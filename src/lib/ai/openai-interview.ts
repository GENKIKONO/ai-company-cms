/**
 * Phase 2-3: OpenAI Interview Content Generation
 * 
 * AI面談セッションの最終コンテンツ生成を統一化
 */

import OpenAI from 'openai';
import { logger } from '@/lib/utils/logger';

// OpenAI設定（環境変数優先）
const OPENAI_CONFIG = {
  primaryModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  fallbackModel: process.env.OPENAI_MODEL_FALLBACK || 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2000,
  timeout: 30000, // 30秒
} as const;

// Phase 2-3 確定型定義
export interface CitationItem {
  type: string;
  sourceId?: string;
  uri?: string;
  title?: string;
  snippet?: string;
  meta?: any;
}

// 要求仕様に完全準拠したFinalizeResult型
export type FinalizeResult = {
  success: true;
  content: string; // セッション全体の最終テキスト
  structured?: {
    sections?: Array<{ key: string; title?: string; content: string; meta?: any }>;
  };
  citations: Array<CitationItem>;
  usedModel: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
} | {
  success: false;
  code: string;
  message: string;
  detail?: any;
};

export interface InterviewSession {
  id: string;
  answers: Record<string, unknown>;
  content_type: string;
  organization_id?: string;
  user_id: string;
  created_at: string;
}

/**
 * OpenAI APIクライアントの初期化
 */
function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  return new OpenAI({
    apiKey,
    timeout: OPENAI_CONFIG.timeout,
  });
}

/**
 * 面談回答からプロンプトを構築
 */
function buildInterviewPrompt(session: InterviewSession): { system: string; user: string } {
  const answers = session.answers || {};
  const answersText = Object.entries(answers)
    .filter(([_, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([questionId, answer], index) => `質問 ${index + 1} (ID: ${questionId}): ${String(answer)}`)
    .join('\n\n');

  const answerCount = Object.values(answers).filter(v => 
    v !== undefined && v !== null && String(v).trim() !== ''
  ).length;

  const system = `あなたは企業の課題解決を支援する専門コンサルタントです。
提供された面談回答を分析し、以下の構造で包括的なレポートを生成してください：

## 出力形式
1. **概要サマリー**: 回答内容の要約（150-200文字）
2. **詳細分析**: 課題の深掘りと背景分析（400-600文字）
3. **推奨アクション**: 具体的な改善提案（300-500文字）

## 注意事項
- 回答内容に基づいて客観的に分析する
- 具体的で実行可能な提案を含める
- 文体は丁寧語で統一する
- 推測ではなく回答内容から読み取れる事実に基づく`;

  const user = `以下の面談回答（${answerCount}件）を分析し、レポートを作成してください：

${answersText}

上記の回答内容を基に、概要サマリー、詳細分析、推奨アクションの構造でレポートを生成してください。`;

  return { system, user };
}

/**
 * OpenAI APIレスポンスから構造化データを抽出（確定スキーマ対応）
 */
function parseContentToStructured(content: string): { sections?: Array<{ key: string; title?: string; content: string; meta?: any }> } | undefined {
  const lines = content.split('\n').filter(line => line.trim());
  const sections: Array<{ key: string; title?: string; content: string; meta?: any }> = [];
  
  let currentSection: { key: string; title?: string; content: string; meta?: any } | null = null;

  for (const line of lines) {
    // セクション見出しを検出
    if (line.match(/^#+\s*(.+)/) || line.match(/^\*\*(.+?)\*\*/) || line.includes('概要サマリー') || line.includes('詳細分析') || line.includes('推奨アクション')) {
      // 前のセクションを保存
      if (currentSection && currentSection.content.trim()) {
        sections.push(currentSection);
      }

      // 新しいセクション開始
      const title = line.replace(/^#+\s*/, '').replace(/^\*\*(.+?)\*\*.*/, '$1').replace(/：.*/, '').trim();
      let key: string;
      let type: string;
      
      if (title.includes('概要') || title.includes('サマリー')) {
        key = 'summary';
        type = 'summary';
      } else if (title.includes('推奨') || title.includes('提案') || title.includes('アクション')) {
        key = 'recommendation';
        type = 'recommendation';
      } else {
        key = 'analysis';
        type = 'analysis';
      }

      currentSection = { 
        key, 
        title, 
        content: '', 
        meta: { type, order: sections.length } 
      };
    } else if (currentSection && line.trim()) {
      // セクション内容を追加
      currentSection.content += (currentSection.content ? '\n' : '') + line.trim();
    }
  }

  // 最後のセクションを保存
  if (currentSection && currentSection.content.trim()) {
    sections.push(currentSection);
  }

  // セクションが検出されなかった場合の fallback
  if (sections.length === 0) {
    sections.push({
      key: 'analysis',
      title: '分析結果',
      content: content.trim(),
      meta: { type: 'analysis', order: 0 }
    });
  }

  return sections.length > 0 ? { sections } : undefined;
}

/**
 * 回答からcitationを生成
 */
function generateCitations(session: InterviewSession): CitationItem[] {
  const citations: CitationItem[] = [];
  const answers = session.answers || {};

  Object.entries(answers).forEach(([questionId, answer], index) => {
    if (answer && String(answer).trim()) {
      citations.push({
        type: 'answer',
        sourceId: questionId,
        title: `質問 ${index + 1}`,
        snippet: String(answer).substring(0, 200) + (String(answer).length > 200 ? '...' : ''),
        meta: {
          questionId,
          answerLength: String(answer).length,
          sessionId: session.id
        }
      });
    }
  });

  return citations;
}

/**
 * OpenAI APIを使用して面談コンテンツを生成（メイン関数）
 * Phase 2-3 確定仕様対応
 */
export async function generateInterviewContent(
  session: InterviewSession
): Promise<FinalizeResult> {
  const startTime = Date.now();
  let usedModel: string = OPENAI_CONFIG.primaryModel;

  try {
    // 入力検証
    const answers = session.answers || {};
    const validAnswers = Object.values(answers).filter(v => 
      v !== undefined && v !== null && String(v).trim() !== ''
    );

    if (validAnswers.length === 0) {
      return {
        success: false,
        code: 'NO_ANSWERS',
        message: '回答が見つかりません。少なくとも1つの質問に回答してください。'
      };
    }

    const openai = createOpenAIClient();
    const { system, user } = buildInterviewPrompt(session);

    logger.info('Starting OpenAI content generation', { 
      sessionId: session.id, 
      answerCount: validAnswers.length,
      model: usedModel 
    });

    // OpenAI API呼び出し（プライマリモデル）
    let completion: OpenAI.Chat.Completions.ChatCompletion;
    
    try {
      completion = await openai.chat.completions.create({
        model: usedModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: OPENAI_CONFIG.temperature,
        max_tokens: OPENAI_CONFIG.maxTokens,
      });
    } catch (primaryError) {
      // プライマリモデルで失敗した場合、フォールバックモデルで再試行
      logger.warn('Primary model failed, trying fallback', { 
        error: primaryError instanceof Error ? primaryError.message : primaryError,
        fallbackModel: OPENAI_CONFIG.fallbackModel 
      });
      
      usedModel = OPENAI_CONFIG.fallbackModel;
      
      completion = await openai.chat.completions.create({
        model: usedModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: OPENAI_CONFIG.temperature,
        max_tokens: Math.min(OPENAI_CONFIG.maxTokens, 1500), // フォールバック時は少し制限
      });
    }

    const durationMs = Date.now() - startTime;
    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        code: 'OPENAI_NO_CONTENT',
        message: 'OpenAI APIからコンテンツが生成されませんでした。'
      };
    }

    // 構造化データの生成（確定仕様対応）
    const structured = parseContentToStructured(content);

    // Citations生成
    const citations = generateCitations(session);

    const result: FinalizeResult = {
      success: true,
      content: content.trim(),
      structured,
      citations,
      usedModel,
      inputTokens: completion.usage?.prompt_tokens || 0,
      outputTokens: completion.usage?.completion_tokens || 0,
      durationMs,
    };

    logger.info('OpenAI content generation completed', {
      sessionId: session.id,
      model: usedModel,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs,
      contentLength: content.length
    });

    return result;

  } catch (error) {
    const durationMs = Date.now() - startTime;
    
    logger.error('OpenAI content generation failed', {
      sessionId: session.id,
      model: usedModel,
      error: error instanceof Error ? error.message : error,
      durationMs
    });

    // エラータイプに応じたコード分類
    let errorCode = 'OPENAI_ERROR';
    let errorMessage = 'AI生成中にエラーが発生しました。';

    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        errorCode = 'OPENAI_AUTH_ERROR';
        errorMessage = 'OpenAI APIの認証に失敗しました。';
      } else if (error.status === 429) {
        errorCode = 'OPENAI_RATE_LIMIT';
        errorMessage = 'API利用制限に達しました。しばらく時間をおいて再試行してください。';
      } else if (error.status === 400) {
        errorCode = 'OPENAI_BAD_REQUEST';
        errorMessage = 'リクエストが無効です。回答内容を確認してください。';
      }
    }

    return {
      success: false,
      code: errorCode,
      message: errorMessage,
      detail: error instanceof Error ? error.message : error
    };
  }
}