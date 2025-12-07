/**
 * Edge Functions 標準テンプレート - AI Interview Finalize
 * EPIC 3-3: service_role 監査 + idempotency + 全ベストプラクティス統合
 * 
 * Supabase Assistant 回答準拠 (Q1-Q20):
 * - npm:@supabase/supabase-js@2固定 (Q3)
 * - Deno.serve使用 (標準)
 * - JWT検証 + aud確認 (Q5, Q7)
 * - service_role監査必須 (全Q)
 * - idempotency対応 (Q12)
 * - エラーハンドリング + リトライ (Q15, Q16)
 * - 約60秒実行制限対応 (Q2)
 * - waitUntil非同期処理 (Q4)
 * - テナント分離必須 (Q20)
 */

// ============================================
// 依存関係インポート (Q3準拠)
// ============================================
import { createServiceRoleClient, withTenantFilter, getEdgeFunctionMeta, defaultConcurrencyLimiter } from '../_shared/supabase.ts';
import { createEdgeLogger, type EdgeLogger } from '../_shared/logging.ts';
import { requireAuth, type AuthenticatedUser, EdgeAuthError } from '../_shared/auth.ts';
import { withIdempotency } from '../_shared/idempotency.ts';
import { withServiceRoleAudit, auditAsync } from '../_shared/audit.ts';
import { handlePreflight, createCorsResponse, createCorsErrorResponse } from '../_shared/cors.ts';
import { z } from 'npm:zod@3.22.4'; // Q3: バージョン固定

// ============================================
// リクエスト/レスポンス型定義
// ============================================

/**
 * AI Interview Finalize リクエスト
 */
const FinalizeRequestSchema = z.object({
  interview_id: z.string().uuid('Invalid interview ID format'),
  organization_id: z.string().uuid('Invalid organization ID format'), // Q20: テナント分離必須
  finalize_reason: z.string().min(1).max(500, 'Reason too long'),
  send_notification: z.boolean().optional().default(false),
  metadata: z.record(z.any()).optional()
});

type FinalizeRequest = z.infer<typeof FinalizeRequestSchema>;

/**
 * レスポンス型
 */
interface FinalizeResponse {
  success: true;
  interview_id: string;
  finalized_at: string;
  summary: {
    total_questions: number;
    completion_rate: number;
    duration_minutes: number;
  };
  notifications_sent: boolean;
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  interview_id?: string;
}

// ============================================
// メイン Edge Function ハンドラー
// ============================================

Deno.serve(async (req: Request): Promise<Response> => {
  // 実行時間制限モニタリング用 (Q2: 約60秒制限)
  const startTime = Date.now();
  const TIMEOUT_WARNING_MS = 50000; // 50秒で警告
  
  // ログ初期化
  const logger = createEdgeLogger(req, 'ai-interview-finalize');
  const functionMeta = getEdgeFunctionMeta();
  
  logger.info('Function started', { 
    function_meta: functionMeta,
    method: req.method,
    url: req.url 
  });

  try {
    // ============================================
    // 1. CORS & Method Validation
    // ============================================
    
    if (req.method === 'OPTIONS') {
      return handlePreflight(req);
    }

    if (req.method !== 'POST') {
      return createCorsErrorResponse(
        { message: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        405,
        req
      );
    }

    // ============================================
    // 2. 認証 & 入力検証 (Q5, Q7)
    // ============================================

    // JWT認証 (aud検証含む)
    let user: AuthenticatedUser;
    try {
      user = await logger.timed('user_authentication', () => 
        requireAuth(req, logger)
      );
    } catch (error) {
      if (error instanceof EdgeAuthError) {
        logger.warn('Authentication failed', { error: error.message, code: error.code });
        return createCorsErrorResponse(
          { message: error.message, code: error.code },
          error.statusCode,
          req
        );
      }
      throw error;
    }

    // Idempotency Key 必須チェック
    const idempotencyKey = req.headers.get('Idempotency-Key');
    if (!idempotencyKey) {
      return createCorsErrorResponse(
        { message: 'Idempotency-Key header is required', code: 'MISSING_IDEMPOTENCY_KEY' },
        400,
        req
      );
    }

    // リクエストボディ検証
    let requestBody: FinalizeRequest;
    try {
      const rawBody = await req.json();
      requestBody = FinalizeRequestSchema.parse(rawBody);
    } catch (error) {
      logger.warn('Request validation failed', { 
        error: error instanceof z.ZodError ? error.errors : error.message 
      });
      return createCorsErrorResponse(
        { message: 'Invalid request format', code: 'VALIDATION_ERROR' },
        400,
        req
      );
    }

    // ============================================
    // 3. 冪等性チェック (Q12)
    // ============================================

    const idempotencyScope = `interview-finalize:${requestBody.organization_id}`;
    
    try {
      const result = await withIdempotency<FinalizeResponse>(
        idempotencyKey,
        idempotencyScope,
        'ai-interview-finalize',
        user.id,
        requestBody.organization_id,
        requestBody,
        () => performInterviewFinalize(requestBody, user, req, logger),
        logger
      );

      // 成功時の監査ログ (非同期)
      auditAsync({
        function_name: 'ai-interview-finalize',
        actor: `user:${user.id}`,
        request_id: functionMeta.requestId,
        trigger_type: 'MANUAL',
        trigger_source: 'web-console',
        resource: `interview:${requestBody.interview_id}`,
        row_count: 1,
        latency_ms: Date.now() - startTime,
        success: true,
        payload: {
          interview_id: requestBody.interview_id,
          organization_id: requestBody.organization_id,
          finalize_reason: requestBody.finalize_reason,
          send_notification: requestBody.send_notification
        },
        context: {
          user_agent: req.headers.get('user-agent'),
          idempotency_key: idempotencyKey
        }
      }, logger);

      logger.info('Interview finalization completed successfully', {
        interview_id: requestBody.interview_id,
        organization_id: requestBody.organization_id,
        latency_ms: Date.now() - startTime
      });

      return createCorsResponse(result, req);

    } catch (error) {
      // エラー時の監査ログ (非同期)
      auditAsync({
        function_name: 'ai-interview-finalize',
        actor: `user:${user.id}`,
        request_id: functionMeta.requestId,
        trigger_type: 'MANUAL',
        trigger_source: 'web-console',
        resource: `interview:${requestBody.interview_id}`,
        row_count: 0,
        latency_ms: Date.now() - startTime,
        success: false,
        error_code: error instanceof Error && 'code' in error ? (error as any).code : 'UNKNOWN_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        payload: {
          interview_id: requestBody.interview_id,
          organization_id: requestBody.organization_id
        }
      }, logger);

      throw error;
    }

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    
    // 実行時間警告 (Q2)
    if (latencyMs > TIMEOUT_WARNING_MS) {
      logger.warn('Function approaching timeout limit', { 
        latency_ms: latencyMs,
        timeout_warning_ms: TIMEOUT_WARNING_MS
      });
    }

    logger.error('Function execution failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      latency_ms: latencyMs
    });

    // エラーレスポンス
    if (error instanceof EdgeAuthError) {
      return createCorsErrorResponse(
        { message: error.message, code: error.code },
        error.statusCode,
        req
      );
    }

    return createCorsErrorResponse(
      { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      500,
      req
    );
  }
});

// ============================================
// メイン処理関数
// ============================================

/**
 * AIインタビュー確定処理
 * service_role使用 + テナント分離 + リトライ対応
 */
async function performInterviewFinalize(
  request: FinalizeRequest,
  user: AuthenticatedUser,
  httpReq: Request,
  logger: EdgeLogger
): Promise<FinalizeResponse> {
  
  return await withServiceRoleAudit(
    () => executeFinalizationLogic(request, user, logger),
    {
      function_name: 'ai-interview-finalize',
      resource: `interview:${request.interview_id}`,
      trigger_type: 'MANUAL',
      trigger_source: 'web-console',
      payload: {
        interview_id: request.interview_id,
        organization_id: request.organization_id,
        send_notification: request.send_notification
      }
    },
    httpReq,
    user,
    logger
  );
}

/**
 * 実際の確定処理ロジック (リトライ対応)
 */
async function executeFinalizationLogic(
  request: FinalizeRequest,
  user: AuthenticatedUser,
  logger: EdgeLogger
): Promise<FinalizeResponse> {
  const supabase = createServiceRoleClient();
  
  // Q15: 一時的エラーのリトライ戦略
  const MAX_RETRIES = 3;
  const RETRY_DELAY_BASE = 1000; // 1秒
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // ============================================
      // 1. インタビューデータ取得 + テナント分離 (Q20)
      // ============================================
      
      const { data: interview, error: fetchError } = await withTenantFilter(
        supabase
          .from('ai_interviews')
          .select(`
            id, title, status, created_at, updated_at,
            questions:ai_interview_questions(count),
            responses:ai_interview_responses(count)
          `),
        request.organization_id // テナント分離必須
      )
        .eq('id', request.interview_id)
        .eq('created_by', user.id) // 作成者本人のみアクセス可能
        .single();

      if (fetchError) {
        // Q15: 一時的エラーかどうかチェック
        if (isRetriableError(fetchError) && attempt < MAX_RETRIES) {
          const delayMs = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
          logger.warn('Temporary error, retrying', { 
            attempt, 
            error: fetchError.message, 
            delay_ms: delayMs 
          });
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        throw new Error(`Failed to fetch interview: ${fetchError.message}`);
      }

      if (!interview) {
        throw new Error('Interview not found or access denied');
      }

      if (interview.status === 'finalized') {
        logger.info('Interview already finalized, returning existing data');
        // 既に確定済みの場合は既存データを返す
      }

      // ============================================
      // 2. ステータス更新 + 集計
      // ============================================
      
      const { data: updatedInterview, error: updateError } = await withTenantFilter(
        supabase
          .from('ai_interviews')
          .update({
            status: 'finalized',
            finalized_at: new Date().toISOString(),
            finalized_by: user.id,
            finalization_reason: request.finalize_reason,
            updated_at: new Date().toISOString()
          }),
        request.organization_id
      )
        .eq('id', request.interview_id)
        .eq('created_by', user.id)
        .select()
        .single();

      if (updateError) {
        if (isRetriableError(updateError) && attempt < MAX_RETRIES) {
          const delayMs = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
          logger.warn('Update retry', { attempt, error: updateError.message, delay_ms: delayMs });
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        throw new Error(`Failed to update interview: ${updateError.message}`);
      }

      // ============================================
      // 3. 集計計算
      // ============================================
      
      const totalQuestions = interview.questions?.[0]?.count || 0;
      const totalResponses = interview.responses?.[0]?.count || 0;
      const completionRate = totalQuestions > 0 ? Math.round((totalResponses / totalQuestions) * 100) : 0;
      
      const createdAt = new Date(interview.created_at);
      const finalizedAt = new Date();
      const durationMinutes = Math.round((finalizedAt.getTime() - createdAt.getTime()) / 60000);

      // ============================================
      // 4. 通知処理 (非同期、Q4対応)
      // ============================================
      
      let notificationsSent = false;
      if (request.send_notification) {
        // waitUntil で非同期通知
        EdgeRuntime.waitUntil(
          sendFinalizationNotification(request.interview_id, user, logger)
            .catch(error => {
              logger.error('Notification failed', { 
                error: error.message,
                interview_id: request.interview_id 
              });
            })
        );
        notificationsSent = true;
      }

      // 成功時のレスポンス
      const response: FinalizeResponse = {
        success: true,
        interview_id: request.interview_id,
        finalized_at: updatedInterview.finalized_at,
        summary: {
          total_questions: totalQuestions,
          completion_rate: completionRate,
          duration_minutes: durationMinutes
        },
        notifications_sent: notificationsSent
      };

      logger.info('Interview finalization logic completed', {
        interview_id: request.interview_id,
        attempt,
        summary: response.summary
      });

      return response;

    } catch (error) {
      if (attempt === MAX_RETRIES || !isRetriableError(error)) {
        logger.error('Final attempt failed', { 
          attempt, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        throw error;
      }
      
      // 次の試行前の待機
      const delayMs = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
      logger.warn('Retrying after error', { 
        attempt, 
        error: error instanceof Error ? error.message : 'Unknown error',
        delay_ms: delayMs 
      });
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error('Max retries exceeded');
}

// ============================================
// ヘルパー関数
// ============================================

/**
 * エラーがリトライ可能かどうかを判定 (Q15準拠)
 */
function isRetriableError(error: any): boolean {
  if (!error || !error.code) return false;
  
  // Q15: 一時的エラーのSQLSTATEコード
  const retriableCodes = [
    '40001', // serialization_failure
    '40P01', // deadlock_detected
    '55P03', // lock_not_available
    '57014'  // query_canceled (状況次第)
  ];
  
  return retriableCodes.includes(error.code);
}

/**
 * 確定通知の送信 (非同期処理例)
 */
async function sendFinalizationNotification(
  interviewId: string,
  user: AuthenticatedUser,
  logger: EdgeLogger
): Promise<void> {
  try {
    // 実際の通知処理をここに実装
    // 例: メール送信、Slack通知、など
    
    logger.info('Finalization notification sent', {
      interview_id: interviewId,
      user_id: user.id
    });
    
    // ダミー実装 (実際はメール/通知サービス呼び出し)
    await new Promise(resolve => setTimeout(resolve, 100));
    
  } catch (error) {
    logger.error('Notification sending failed', {
      interview_id: interviewId,
      user_id: user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}