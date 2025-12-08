/**
 * Phase 2-3: AI Interview Session Finalize API
 * 
 * OpenAI統合による本格的なコンテンツ生成と統一レスポンス形式
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser, requireOrgMember } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { generateInterviewContent, type CitationItem, type FinalizeResult } from '@/lib/ai/openai-interview';
import { logFinalizeResult, logContentUnits } from '@/lib/ai/logAiResponseWithCitations';
import { logInterviewQuestionBatch, generateLogEntriesFromAnswers, type QuestionLogEntry } from '@/lib/interview/question-logging';
import type { InterviewAnswersJson } from '@/types/interview-session';
// TODO: [SUPABASE_PLAN_MIGRATION] このロジックは isFeatureQuotaLimitReached に寄せる想定
// 現在: checkMonthlyQuestionUsage() で静的制限チェック
// 提案: isFeatureQuotaLimitReached(orgId, 'ai_interview') で RPC ベース制限チェック
import { checkMonthlyQuestionUsage } from '@/lib/billing/interview-credits';

/**
 * JSON形式判定: 新形式（InterviewAnswersJson）か旧形式（Record<string, unknown>）かを判定
 */
function isNewAnswersFormat(answers: any): answers is InterviewAnswersJson {
  return answers && 
         typeof answers === 'object' && 
         Array.isArray(answers.questions);
}

// Phase 2-3: 統一APIレスポンス型（確定仕様準拠）
type FinalizeSessionResponse = {
  success: true;
  content: string;
  citations: CitationItem[];
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

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<FinalizeSessionResponse>> {
  const startTime = Date.now();
  
  try {
    // 認証確認
    const user = await requireAuthUser();
    const { id: sessionId } = await params;

    // リクエストボディ検証
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body'
        } satisfies FinalizeSessionResponse,
        { status: 400 }
      );
    }

    // sessionId validation (URL paramsとbodyの一致確認)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_SESSION_ID',
          message: 'Invalid session ID format'
        } satisfies FinalizeSessionResponse,
        { status: 400 }
      );
    }

    if (requestBody.sessionId && requestBody.sessionId !== sessionId) {
      return NextResponse.json(
        {
          success: false,
          code: 'SESSION_ID_MISMATCH',
          message: 'Session ID in URL and body do not match'
        } satisfies FinalizeSessionResponse,
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // セッション取得と権限確認
    const { data: session, error: fetchError } = await supabase
      .from('ai_interview_sessions')
      .select(`
        id, 
        organization_id, 
        user_id, 
        content_type,
        status, 
        answers, 
        generated_content,
        generated_content_json,
        version,
        created_at
      `)
      .eq('id', sessionId)
      .is('deleted_at', null)
      .maybeSingle();

    if (fetchError) {
      logger.error('Failed to fetch session for finalize:', { 
        sessionId, 
        error: fetchError 
      });
      return NextResponse.json(
        {
          success: false,
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch session'
        } satisfies FinalizeSessionResponse,
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          code: 'NOT_FOUND',
          message: 'Session not found or has been deleted'
        } satisfies FinalizeSessionResponse,
        { status: 404 }
      );
    }

    // 権限チェック
    if (session.organization_id) {
      try {
        await requireOrgMember(session.organization_id);
      } catch (error) {
        logger.warn('Unauthorized access to session for finalize:', { 
          sessionId, 
          userId: user.id, 
          organizationId: session.organization_id,
          error 
        });
        return NextResponse.json(
          {
            success: false,
            code: 'FORBIDDEN',
            message: 'Access denied'
          } satisfies FinalizeSessionResponse,
          { status: 403 }
        );
      }
    } else {
      // 組織に属さないセッションの場合、作成者本人のみアクセス可能
      if (session.user_id !== user.id) {
        logger.warn('Unauthorized access to personal session for finalize:', { 
          sessionId, 
          userId: user.id, 
          sessionUserId: session.user_id 
        });
        return NextResponse.json(
          {
            success: false,
            code: 'FORBIDDEN',
            message: 'Access denied'
          } satisfies FinalizeSessionResponse,
          { status: 403 }
        );
      }
    }

    // 既に完了済みの場合は既存のコンテンツを返却（再生成しない）
    if (session.status === 'completed' && session.generated_content) {
      logger.info('Returning existing generated content', { 
        sessionId, 
        userId: user.id 
      });

      // 既存のcitationsがあればログから取得（簡易実装として空配列）
      // TODO: 既存のcitations_responsesから取得するクエリを実装するか検討
      return NextResponse.json({
        success: true,
        content: session.generated_content,
        citations: [], // 既存セッションのcitationsは未実装
        usedModel: 'cached', // キャッシュ済みであることを示す
        inputTokens: 0,
        outputTokens: 0,
        durationMs: Date.now() - startTime
      } satisfies FinalizeSessionResponse);
    }

    // 【プラン制限チェック】組織セッションでコンテンツ生成時の最終的な質問数制限確認
    if (session.organization_id) {
      const usageCheck = await checkMonthlyQuestionUsage(supabase, session.organization_id);
      
      if (usageCheck.isExceeded || !usageCheck.allowed) {
        logger.warn('Question quota exceeded during finalize', {
          sessionId,
          organizationId: session.organization_id,
          currentUsage: usageCheck.currentUsage,
          monthlyLimit: usageCheck.monthlyLimit,
          priceId: usageCheck.priceId,
          isExceeded: usageCheck.isExceeded,
          allowed: usageCheck.allowed
        });
        
        return NextResponse.json(
          {
            success: false,
            code: 'QUOTA_EXCEEDED',
            message: `月間のAIインタビュー上限に達しています。プラン: ${usageCheck.priceId || 'デフォルト'}, 使用済み: ${usageCheck.currentUsage}/${usageCheck.monthlyLimit}`,
            detail: {
              priceId: usageCheck.priceId,
              currentUsage: usageCheck.currentUsage,
              monthlyLimit: usageCheck.monthlyLimit
            }
          } satisfies FinalizeSessionResponse,
          { status: 402 } // Payment Required
        );
      }
      
      logger.debug('Finalize quota check passed', {
        sessionId,
        organizationId: session.organization_id,
        priceId: usageCheck.priceId,
        currentUsage: usageCheck.currentUsage,
        monthlyLimit: usageCheck.monthlyLimit
      });
    }

    // 回答の有無確認
    const answersObj = session.answers as Record<string, unknown>;
    const validAnswers = Object.values(answersObj || {}).filter(answer => 
      answer !== undefined && 
      answer !== null && 
      String(answer).trim() !== ''
    );
    
    if (validAnswers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          code: 'NO_ANSWERS',
          message: 'No answers provided. Please answer at least one question.'
        } satisfies FinalizeSessionResponse,
        { status: 400 }
      );
    }

    // TODO: 生成中ステータスの更新（ENUMに 'generating' を追加した場合）
    // await supabase.from('ai_interview_sessions').update({ status: 'generating' }).eq('id', sessionId)

    // Phase 2-3: OpenAI によるコンテンツ生成
    logger.info('Starting AI content generation', { 
      sessionId, 
      userId: user.id,
      answersCount: validAnswers.length 
    });

    const generationResult = await generateInterviewContent({
      id: sessionId,
      answers: answersObj || {},
      content_type: session.content_type,
      organization_id: session.organization_id || undefined,
      user_id: session.user_id,
      created_at: session.created_at
    });

    // 生成失敗の場合（確定仕様対応）
    if (!generationResult.success) {
      // 型の絞り込みのため、失敗タイプであることを明確にする
      const failedResult = generationResult as { success: false; code: string; message: string; detail?: any };
      
      // ログ保存（失敗）
      await logFinalizeResult({
        sessionId,
        organizationId: session.organization_id,
        userId: session.user_id,
        finalizeResult: failedResult
      });

      // TODO: セッションステータスを 'failed' に更新（ENUMに追加した場合）
      // await supabase.from('ai_interview_sessions').update({ status: 'failed' }).eq('id', sessionId)

      return NextResponse.json(
        {
          success: false,
          code: failedResult.code,
          message: failedResult.message,
          detail: failedResult.detail
        } satisfies FinalizeSessionResponse,
        { status: 502 } // Bad Gateway - 外部サービス（OpenAI）エラー
      );
    }

    // 【質問ログ記録】セッション完了時に回答済みの質問をすべてログに記録（fire-and-forget）
    if (session.organization_id && answersObj) {
      let logEntries: QuestionLogEntry[] = [];
      
      // 新旧形式対応でのログエントリ生成
      if (isNewAnswersFormat(answersObj)) {
        // 新形式（InterviewAnswersJson）の場合
        logEntries = generateLogEntriesFromAnswers(
          session.organization_id,
          sessionId,
          answersObj as InterviewAnswersJson
        );
        logger.debug('Generated log entries from new format answers', { 
          sessionId, 
          logEntriesCount: logEntries.length 
        });
      } else {
        // 旧形式（Record<string, unknown>）の場合
        Object.entries(answersObj).forEach(([questionId, answer]) => {
          if (answer && String(answer).trim()) {
            logEntries.push({
              organization_id: session.organization_id!,
              session_id: sessionId,
              question_id: questionId,
              turn_index: 0, // 旧形式は初回回答のみ（turn_index=0）
            });
          }
        });
        logger.debug('Generated log entries from old format answers', { 
          sessionId, 
          logEntriesCount: logEntries.length 
        });
      }
      
      if (logEntries.length > 0) {
        logInterviewQuestionBatch(supabase, logEntries);
      }
    }

    // 生成成功 - セッション更新（確定仕様対応）
    const updateData = {
      status: 'completed' as const,
      generated_content: generationResult.content,
      generated_content_json: generationResult.structured || null,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('ai_interview_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .is('deleted_at', null); // 更新時にも論理削除チェック

    if (updateError) {
      logger.error('Failed to update session with generated content:', {
        sessionId,
        error: updateError
      });

      // セッション更新失敗時もログ保存（成功として記録しつつエラー詳細も保存）
      await logFinalizeResult({
        sessionId,
        organizationId: session.organization_id,
        userId: session.user_id,
        finalizeResult: {
          success: false,
          code: 'SESSION_UPDATE_ERROR',
          message: updateError.message,
          detail: updateError
        }
      });

      return NextResponse.json(
        {
          success: false,
          code: 'SESSION_UPDATE_ERROR',
          message: 'Failed to save generated content'
        } satisfies FinalizeSessionResponse,
        { status: 500 }
      );
    }

    // ai_content_units への分割保存（確定仕様対応）
    if (generationResult.structured?.sections?.length) {
      await logContentUnits({
        sessionId,
        organizationId: session.organization_id,
        userId: session.user_id,
        sections: generationResult.structured.sections
      });
    }

    // 全ログ保存（成功）
    await logFinalizeResult({
      sessionId,
      organizationId: session.organization_id,
      userId: session.user_id,
      finalizeResult: generationResult
    });

    logger.info('Interview session finalized successfully', { 
      sessionId, 
      userId: user.id,
      model: generationResult.usedModel,
      inputTokens: generationResult.inputTokens,
      outputTokens: generationResult.outputTokens,
      durationMs: generationResult.durationMs,
      contentLength: generationResult.content.length,
      citationsCount: generationResult.citations.length
    });

    // 成功レスポンス（確定仕様準拠）
    return NextResponse.json({
      success: true,
      content: generationResult.content,
      citations: generationResult.citations,
      usedModel: generationResult.usedModel,
      inputTokens: generationResult.inputTokens,
      outputTokens: generationResult.outputTokens,
      durationMs: generationResult.durationMs
    } satisfies FinalizeSessionResponse);

  } catch (error) {
    const durationMs = Date.now() - startTime;
    
    logger.error('Finalize interview session API error', {
      sessionId: 'params' in error ? undefined : 'unknown',
      error: error instanceof Error ? error.message : error,
      durationMs
    });

    // 認証エラーの場合
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        {
          success: false,
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        } satisfies FinalizeSessionResponse,
        { status: 401 }
      );
    }

    // 組織メンバーアクセスエラーの場合
    if (error instanceof Error && (error.message.includes('Organization') || error.message.includes('Forbidden'))) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Access denied'
        } satisfies FinalizeSessionResponse,
        { status: 403 }
      );
    }

    // 内部サーバーエラー
    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        detail: process.env.NODE_ENV === 'development' ? error : undefined
      } satisfies FinalizeSessionResponse,
      { status: 500 }
    );
  }
}

// 他のHTTPメソッドは拒否
export async function GET() {
  return NextResponse.json(
    { success: false, code: 'METHOD_NOT_ALLOWED', message: 'GET method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, code: 'METHOD_NOT_ALLOWED', message: 'PUT method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, code: 'METHOD_NOT_ALLOWED', message: 'DELETE method not allowed' },
    { status: 405 }
  );
}