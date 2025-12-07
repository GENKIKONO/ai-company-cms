import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
import type { 
  InterviewSession,
  CreateInterviewSessionInput,
  SaveAnswerInput,
  FinalizeSessionInput,
  InterviewAnswersJson
} from '@/types/interview-session';
// P1-2: 移行後は Supabase Database enum型を使用
import { maskPII, validateAndMaskAnswer } from '@/lib/utils/pii-mask';
import { logAiResponseWithCitations } from '@/lib/ai/citations';
import { logger } from '@/lib/utils/logger';

type InterviewSessionRow = Database['public']['Tables']['ai_interview_sessions']['Row'];
type InterviewSessionInsert = Database['public']['Tables']['ai_interview_sessions']['Insert'];

/**
 * 新しいインタビューセッションを作成
 */
export async function createInterviewSession(input: CreateInterviewSessionInput): Promise<{ sessionId: string }> {
  try {
    const supabase = await createClient();

    // 質問IDの検証
    if (!input.questionIds || input.questionIds.length === 0) {
      throw new Error('At least one question must be selected');
    }

    // 初期回答オブジェクト作成
    const initialAnswers: Record<string, string> = {};
    input.questionIds.forEach(questionId => {
      initialAnswers[questionId] = '';
    });

    const sessionData: InterviewSessionInsert = {
      organization_id: input.organizationId,
      user_id: input.userId,
      content_type: input.contentType,
      status: "draft" satisfies Database['public']['Enums']['interview_session_status'],
      answers: initialAnswers as any, // JSONB型
      generated_content: null
    };

    const { data, error } = await supabase
      .from('ai_interview_sessions')
      .insert(sessionData)
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to create interview session', { 
        data: { error, input: { ...input, questionIds: `[${input.questionIds.length} questions]` } }
      });
      throw new Error(`Failed to create session: ${error.message}`);
    }

    logger.info('Interview session created', {
      data: {
        sessionId: data.id,
        organizationId: input.organizationId,
        contentType: input.contentType,
        questionCount: input.questionIds.length
      }
    });

    return { sessionId: data.id };

  } catch (error) {
    logger.error('Create interview session error', { data: error });
    throw error;
  }
}

/**
 * インタビューの回答を保存
 */
export async function saveInterviewAnswer(input: SaveAnswerInput): Promise<void> {
  try {
    const supabase = await createClient();

    // PIIチェックとマスキング
    const validation = validateAndMaskAnswer(input.answer);
    if (!validation.isValid) {
      throw new Error(`Invalid answer: ${validation.warnings.join(', ')}`);
    }

    // 現在のセッション取得
    const { data: currentSession, error: fetchError } = await supabase
      .from('ai_interview_sessions')
      .select('answers, status')
      .eq('id', input.sessionId)
      .single();

    if (fetchError) {
      throw new Error(`Session not found: ${fetchError.message}`);
    }

    if (currentSession.status === "completed") {
      throw new Error('Cannot modify completed session');
    }

    // 回答をマージ
    const updatedAnswers = {
      ...currentSession.answers,
      [input.questionId]: validation.maskedText
    };

    // データベース更新
    const { error: updateError } = await supabase
      .from('ai_interview_sessions')
      .update({
        answers: updatedAnswers as any, // JSONB型
        status: "in_progress" satisfies Database['public']['Enums']['interview_session_status'],
        updated_at: new Date().toISOString()
      })
      .eq('id', input.sessionId);

    if (updateError) {
      logger.error('Failed to save interview answer', {
        data: { error: updateError, sessionId: input.sessionId, questionId: input.questionId }
      });
      throw new Error(`Failed to save answer: ${updateError.message}`);
    }

    // PII検出時はログ記録
    if (validation.containsPII) {
      logger.warn('PII detected in interview answer', {
        data: {
          sessionId: input.sessionId,
          questionId: input.questionId,
          warnings: validation.warnings,
          originalLength: input.answer.length,
          maskedLength: validation.maskedText.length
        }
      });
    }

    logger.info('Interview answer saved', {
      data: {
        sessionId: input.sessionId,
        questionId: input.questionId,
        answerLength: validation.maskedText.length,
        hasPII: validation.containsPII
      }
    });

  } catch (error) {
    logger.error('Save interview answer error', { data: error });
    throw error;
  }
}

/**
 * インタビューセッションを完了させてAI生成を実行
 */
export async function finalizeInterviewSession(input: FinalizeSessionInput): Promise<{ generatedContent: string }> {
  try {
    const supabase = await createClient(); // server-side クライアント

    // セッション情報取得
    const { data: session, error: fetchError } = await supabase
      .from('ai_interview_sessions')
      .select('*')
      .eq('id', input.sessionId)
      .single();

    if (fetchError) {
      throw new Error(`Session not found: ${fetchError.message}`);
    }

    if (session.status === "completed") {
      return { generatedContent: session.generated_content || '' };
    }

    // 回答データの準備
    const answers = session.answers as Record<string, string>;
    const answeredQuestions = Object.entries(answers).filter(([_, answer]) => answer.trim() !== '');

    if (answeredQuestions.length === 0) {
      throw new Error('No answers provided');
    }

    // 回答データを直接渡してAI生成実行
    const answersMap = Object.fromEntries(answeredQuestions);
    const generatedContent = await generateContentWithAI(answersMap, session.content_type);

    // 引用ログを記録
    await logAiResponseWithCitations({
      organizationId: session.organization_id,
      sessionId: session.id,
      requestId: `interview-finalize-${session.id}`,
      modelName: 'gpt-4o-mini', // 実際のモデル名
      promptTokens: estimateTokens('AI generation prompt'),
      completionTokens: estimateTokens(generatedContent),
      totalTokens: estimateTokens('AI generation prompt') + estimateTokens(generatedContent),
      quotedTokensTotal: answeredQuestions.length * 50, // 概算
      quotedCharsTotal: answeredQuestions.reduce((sum, [_, answer]) => sum + answer.length, 0),
      items: answeredQuestions.map(([questionId, answer]) => ({
        contentUnitId: questionId, // 実際のcontent_unit_idマッピングが必要
        weight: 1.0 / answeredQuestions.length,
        quotedTokens: estimateTokens(answer),
        quotedChars: answer.length,
        fragmentHint: `question-${questionId}`,
        locale: 'ja'
      })),
      meta: {
        source: 'ai-interviewer',
        feature: 'session-finalize',
        contentType: session.content_type,
        questionCount: answeredQuestions.length
      }
    });

    // セッション完了として保存
    const { error: updateError } = await supabase
      .from('ai_interview_sessions')
      .update({
        status: "completed" satisfies Database['public']['Enums']['interview_session_status'],
        generated_content: generatedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', input.sessionId);

    if (updateError) {
      logger.error('Failed to finalize interview session', {
        data: { error: updateError, sessionId: input.sessionId }
      });
      throw new Error(`Failed to finalize session: ${updateError.message}`);
    }

    logger.info('Interview session finalized', {
      data: {
        sessionId: input.sessionId,
        questionCount: answeredQuestions.length,
        generatedContentLength: generatedContent.length
      }
    });

    return { generatedContent };

  } catch (error) {
    logger.error('Finalize interview session error', { data: error });
    throw error;
  }
}

/**
 * インタビューセッション取得
 */
export async function getInterviewSession(sessionId: string): Promise<InterviewSession | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('ai_interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      throw new Error(`Failed to fetch session: ${error.message}`);
    }

    return {
      id: data.id,
      organization_id: data.organization_id,
      user_id: data.user_id,
      content_type: data.content_type,
      status: data.status,
      answers: data.answers as InterviewAnswersJson,
      generated_content: data.generated_content,
      created_at: data.created_at,
      updated_at: data.updated_at,
      version: data.version || 1
    };

  } catch (error) {
    logger.error('Get interview session error', { data: error });
    throw error;
  }
}

/**
 * ユーザーのインタビューセッション一覧取得
 */
export async function getUserInterviewSessions(userId: string): Promise<InterviewSession[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('ai_interview_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }

    return data.map(session => ({
      id: session.id,
      organization_id: session.organization_id,
      user_id: session.user_id,
      content_type: session.content_type,
      status: session.status,
      answers: session.answers as InterviewAnswersJson,
      generated_content: session.generated_content,
      created_at: session.created_at,
      updated_at: session.updated_at,
      version: session.version || 1
    }));

  } catch (error) {
    logger.error('Get user interview sessions error', { data: error });
    throw error;
  }
}

// ヘルパー関数

function buildGenerationPrompt(answeredQuestions: [string, string][], contentType: string): string {
  const answerText = answeredQuestions.map(([questionId, answer]) => 
    `質問${questionId}: ${answer}`
  ).join('\n\n');

  return `以下のインタビュー回答を基に、${contentType}の説明文を構造化して生成してください。

回答内容:
${answerText}

出力形式:
1. 要約（200文字以内）
2. 主要なポイント（箇条書き）
3. 特徴・強み
4. 対象顧客
5. 価格・料金

プロフェッショナルで読みやすい文章で作成してください。`;
}

async function generateContentWithAI(answers: Record<string, string>, contentType: string): Promise<string> {
  try {
    // 既存のOpenAIクライアントを動的インポート
    const { generateContentWithRetry } = await import('@/lib/ai/openai-client');

    const result = await generateContentWithRetry({
      answers,
      contentType
    });

    return result.content;

  } catch (error) {
    logger.error('OpenAI content generation failed', { 
      data: { 
        error: error instanceof Error ? error.message : String(error),
        contentType,
        answerCount: Object.keys(answers).length
      }
    });

    // フォールバック: 構造化された基本テンプレート
    const answeredQuestions = Object.entries(answers)
      .filter(([_, answer]) => answer.trim() !== '')
      .map(([questionId, answer], index) => `**質問${index + 1}の回答:**\n${answer}`)
      .join('\n\n');

    return `# ${contentType === 'service' ? 'サービス' : 
            contentType === 'product' ? '製品' : 
            contentType === 'faq' ? 'FAQ' :
            contentType === 'case_study' ? '導入事例' : 'コンテンツ'}概要

## 📋 インタビュー内容まとめ

${answeredQuestions}

## ⚠️ 注意
AI生成サービスが一時的に利用できません。上記は回答内容をそのまま構造化したものです。

---
*生成日時: ${new Date().toLocaleString('ja-JP')}*
*AI生成エラーのため基本テンプレートを使用*`;
  }
}

function estimateTokens(text: string): number {
  // 簡易的なトークン数推定（実際はtiktokenなどを使用）
  return Math.ceil(text.length / 4);
}