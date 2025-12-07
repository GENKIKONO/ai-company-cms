/**
 * P2-8: AIインタビュー → コンテンツ生成共通ヘルパー
 * OpenAI呼び出し、コンテンツ保存、リンク作成の共通ロジック
 */

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type {
  ContentGenerationType,
  InterviewSessionData,
  InterviewContentUnit,
  GeneratedContentData,
  AiGenerationJob,
  ContentGenerationPrompt,
  GenerationConfig
} from '@/types/interview-generated';
import {
  DEFAULT_GENERATION_CONFIG,
  GENERATION_TYPE_MAPPING,
  CONTENT_TYPE_METADATA
} from '@/types/interview-generated';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * インタビューセッションとコンテンツユニットを取得
 */
export async function fetchInterviewData(sessionId: string): Promise<{
  session: InterviewSessionData;
  contentUnits: InterviewContentUnit[];
}> {
  const supabase = await createClient();

  // セッションデータ取得
  const { data: sessionData, error: sessionError } = await supabase
    .from('ai_interview_sessions')
    .select('id, organization_id, answers, generated_content, generated_content_json')
    .eq('id', sessionId)
    .is('deleted_at', null)
    .single();

  if (sessionError || !sessionData) {
    throw new Error(`Session not found: ${sessionError?.message || 'No data'}`);
  }

  // コンテンツユニット取得
  const { data: unitsData, error: unitsError } = await supabase
    .from('ai_content_units')
    .select('id, section_key, title, content, order_no, meta')
    .eq('session_id', sessionId)
    .order('order_no', { ascending: true });

  if (unitsError) {
    logger.warn('Failed to fetch content units', { error: unitsError.message, sessionId });
  }

  const contentUnits: InterviewContentUnit[] = (unitsData || []).map(unit => ({
    id: unit.id,
    section_key: unit.section_key,
    title: unit.title,
    content: unit.content,
    order_no: unit.order_no,
    visibility_score: unit.meta?.visibility_score || null
  }));

  return {
    session: sessionData as InterviewSessionData,
    contentUnits
  };
}

/**
 * プロンプト生成
 */
export function generatePrompt(
  contentType: ContentGenerationType,
  session: InterviewSessionData,
  contentUnits: InterviewContentUnit[]
): ContentGenerationPrompt {
  const metadata = CONTENT_TYPE_METADATA[contentType];
  
  // 回答内容の抽出
  const answers = Object.entries(session.answers || {})
    .map(([questionId, answer]) => `Q: ${questionId}\nA: ${answer}`)
    .join('\n\n');

  // コンテンツユニットの抽出（visibility_scoreでソート）
  const sortedUnits = [...contentUnits].sort((a, b) => 
    (b.visibility_score || 0) - (a.visibility_score || 0)
  );
  
  const unitContent = sortedUnits
    .slice(0, 5) // 上位5つまで
    .map(unit => `[${unit.section_key}] ${unit.title}\n${unit.content}`)
    .join('\n\n---\n\n');

  // 既存の生成コンテンツ
  const existingContent = session.generated_content || '';

  switch (contentType) {
    case 'blog':
      return {
        systemPrompt: `あなたは企業のコンテンツマーケティング担当者です。提供されたAIインタビューの内容を元に、魅力的で読みやすいブログ記事を作成してください。

要件:
- 導入、本文、結論の構成
- 読み手にとって価値のある情報
- SEOを意識したキーワード配置
- 1500-2000文字程度
- 見出し（##）を適切に使用`,

        userPrompt: `以下のAIインタビューデータを元にブログ記事を作成してください：

## インタビュー回答
${answers}

## 生成されたコンテンツ
${existingContent}

## 重要なコンテンツセクション
${unitContent}

上記の情報を統合して、魅力的なブログ記事を作成してください。`,

        expectedFormat: {
          title: 'ブログのタイトル',
          content: 'ブログの本文（Markdown形式）',
          summary: '記事の要約（150文字程度）',
          keywords: ['キーワード1', 'キーワード2']
        }
      };

    case 'qna':
      return {
        systemPrompt: `あなたは顧客サポートのエキスパートです。提供されたAIインタビューの内容を元に、よくある質問（FAQ）形式のQ&Aを作成してください。

要件:
- 明確で答えやすい質問
- 具体的で実用的な回答
- 顧客の立場で理解しやすい言葉遣い
- 1つのQ&Aペア`,

        userPrompt: `以下のAIインタビューデータを元にQ&A形式のコンテンツを作成してください：

## インタビュー回答
${answers}

## 生成されたコンテンツ
${existingContent}

## 重要なコンテンツセクション
${unitContent}

この情報から、顧客がよく疑問に思いそうな質問と、それに対する適切な回答を1つ作成してください。`,

        expectedFormat: {
          title: '質問のタイトル',
          content: '回答の内容'
        }
      };

    case 'case_study':
      return {
        systemPrompt: `あなたはビジネスアナリストです。提供されたAIインタビューの内容を元に、説得力のあるケーススタディを作成してください。

要件:
- 背景、課題、解決策、結果の構成
- 具体的な数値や成果
- 他の企業が参考にできる内容
- 2000-3000文字程度`,

        userPrompt: `以下のAIインタビューデータを元にケーススタディを作成してください：

## インタビュー回答
${answers}

## 生成されたコンテンツ
${existingContent}

## 重要なコンテンツセクション
${unitContent}

この情報を元に、成功事例として他社が参考にできるケーススタディを作成してください。`,

        expectedFormat: {
          title: 'ケーススタディのタイトル',
          content: 'ケーススタディの本文',
          summary: '事例の要約',
          keywords: ['業界', '課題', '解決策']
        }
      };

    default:
      throw new Error(`Unsupported content type: ${contentType}`);
  }
}

/**
 * OpenAI呼び出し
 */
export async function generateContentWithOpenAI(
  prompt: ContentGenerationPrompt,
  config: GenerationConfig = DEFAULT_GENERATION_CONFIG
): Promise<{
  generatedText: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}> {
  try {
    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: prompt.systemPrompt },
        { role: 'user', content: prompt.userPrompt }
      ],
      max_tokens: config.max_tokens,
      temperature: config.temperature
    });

    const generatedText = response.choices[0]?.message?.content || '';
    const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    if (!generatedText.trim()) {
      throw new Error('OpenAI returned empty content');
    }

    return { generatedText, usage };

  } catch (error: any) {
    logger.error('OpenAI generation failed', { 
      error: error.message,
      prompt: prompt.systemPrompt.slice(0, 100) + '...'
    });
    throw new Error(`OpenAI generation failed: ${error.message}`);
  }
}

/**
 * 生成されたテキストを解析して構造化
 */
export function parseGeneratedContent(
  rawText: string,
  contentType: ContentGenerationType
): Partial<GeneratedContentData> {
  // 簡単なパターンマッチングで抽出
  const titleMatch = rawText.match(/(?:^|\n)(?:#\s+|タイトル[:：]\s*)(.*?)(?:\n|$)/i);
  const summaryMatch = rawText.match(/(?:要約|サマリー|概要)[:：]\s*(.*?)(?:\n\n|$)/is);
  
  const title = titleMatch?.[1]?.trim() || `AI生成${CONTENT_TYPE_METADATA[contentType].label}`;
  let content = rawText;
  const summary = summaryMatch?.[1]?.trim() || '';

  // タイトルがある場合は本文から除去
  if (titleMatch) {
    content = content.replace(titleMatch[0], '').trim();
  }

  // 要約がある場合は本文から除去
  if (summaryMatch && summary) {
    content = content.replace(summaryMatch[0], '').trim();
  }

  // slug生成（タイトルから）
  const slug = title
    .toLowerCase()
    .replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 100);

  return {
    title,
    content,
    summary: summary || undefined,
    slug
  };
}

/**
 * ai_generation_jobs 作成
 */
export async function createGenerationJob(
  orgId: string,
  sessionId: string,
  contentType: ContentGenerationType
): Promise<string> {
  const supabase = await createClient();
  const mapping = GENERATION_TYPE_MAPPING[contentType];

  const { data, error } = await supabase
    .from('ai_generation_jobs')
    .insert({
      organization_id: orgId,
      interview_session_id: sessionId,
      target_content_type: mapping.cmsContentType,
      generation_source: mapping.generationSource,
      openai_calls: 0,
      cost_usd: 0,
      meta: { started_at: new Date().toISOString() }
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create generation job: ${error?.message}`);
  }

  return data.id;
}

/**
 * ai_generation_jobs 更新
 */
export async function updateGenerationJob(
  jobId: string,
  updates: Partial<AiGenerationJob & { target_content_id?: string }>
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('ai_generation_jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);

  if (error) {
    throw new Error(`Failed to update generation job: ${error.message}`);
  }
}

/**
 * コンテンツをテーブルに保存
 */
export async function saveGeneratedContent(
  contentData: Partial<GeneratedContentData> & { 
    contentType: ContentGenerationType;
    sessionId: string;
    orgId: string;
  }
): Promise<string> {
  const supabase = await createClient();
  const mapping = GENERATION_TYPE_MAPPING[contentData.contentType];

  // テーブル固有の挿入データ構築
  const baseData = {
    organization_id: contentData.orgId,
    interview_session_id: contentData.sessionId,
    is_ai_generated: true,
    generation_source: mapping.generationSource,
    content_type: mapping.cmsContentType,
    status: 'draft',
    title: contentData.title,
    slug: contentData.slug,
    created_at: new Date().toISOString()
  };

  let insertData: any = { ...baseData };

  switch (contentData.contentType) {
    case 'blog':
      insertData = {
        ...insertData,
        content: contentData.content,
        summary: contentData.summary
      };
      break;

    case 'qna':
      insertData = {
        ...insertData,
        question: contentData.title,
        answer: contentData.content
      };
      break;

    case 'case_study':
      insertData = {
        ...insertData,
        content: contentData.content,
        summary: contentData.summary
      };
      break;
  }

  const { data, error } = await supabase
    .from(mapping.tableName)
    .insert(insertData)
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to save content to ${mapping.tableName}: ${error?.message}`);
  }

  return data.id;
}

/**
 * content_interview_links と ai_content_unit_links を作成
 */
export async function createContentLinks(
  contentId: string,
  contentType: ContentGenerationType,
  sessionId: string,
  contentUnits: InterviewContentUnit[]
): Promise<void> {
  const supabase = await createClient();
  const mapping = GENERATION_TYPE_MAPPING[contentType];

  // content_interview_links 挿入
  const { error: linkError } = await supabase
    .from('content_interview_links')
    .insert({
      content_type: mapping.cmsContentType,
      content_id: contentId,
      interview_session_id: sessionId,
      relation_type: 'generated_from'
    });

  if (linkError) {
    logger.error('Failed to create content_interview_link', { 
      error: linkError.message, 
      contentId, 
      sessionId 
    });
  }

  // ai_content_unit_links 挿入（上位5つのユニット）
  const topUnits = [...contentUnits]
    .sort((a, b) => (b.visibility_score || 0) - (a.visibility_score || 0))
    .slice(0, 5);

  if (topUnits.length > 0) {
    const unitLinks = topUnits.map(unit => ({
      interview_session_id: sessionId,
      content_type: mapping.cmsContentType,
      content_id: contentId,
      content_unit_id: unit.id,
      relation_type: 'source_unit',
      visibility_score: unit.visibility_score
    }));

    const { error: unitLinkError } = await supabase
      .from('ai_content_unit_links')
      .insert(unitLinks);

    if (unitLinkError) {
      logger.error('Failed to create ai_content_unit_links', { 
        error: unitLinkError.message, 
        contentId, 
        sessionId 
      });
    }
  }
}

/**
 * コスト計算（簡易版）
 */
export function calculateOpenAICost(usage: { 
  prompt_tokens: number; 
  completion_tokens: number; 
}): number {
  // GPT-4の料金（2024年概算）
  const PROMPT_COST_PER_1K = 0.03; // $0.03 per 1K prompt tokens
  const COMPLETION_COST_PER_1K = 0.06; // $0.06 per 1K completion tokens

  const promptCost = (usage.prompt_tokens / 1000) * PROMPT_COST_PER_1K;
  const completionCost = (usage.completion_tokens / 1000) * COMPLETION_COST_PER_1K;

  return promptCost + completionCost;
}