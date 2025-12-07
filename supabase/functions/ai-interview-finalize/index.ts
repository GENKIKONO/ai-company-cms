/**
 * P1-5: Edge Function 標準テンプレート
 * 
 * AI Interview セッション完了処理の例
 * - Deno.serve 使用
 * - 認証・認可 (P1-3との整合)
 * - idempotency key 対応
 * - service_role 監査ログ
 * - waitUntil 後処理
 * - 構造化ログ
 */

import { createAuthenticatedClient, createServiceRoleClient } from '../_shared/supabase.ts';
import { createEdgeLogger } from '../_shared/logging.ts';
import { requireOrgAuth, type OrgAuthResult } from '../_shared/auth.ts';
import { withServiceRoleAudit, auditHighRiskOperation } from '../_shared/audit.ts';
import { 
  extractIdempotencyKey, 
  generateIdempotencyKey, 
  withIdempotency 
} from '../_shared/idempotency.ts';

/**
 * AI Interview 完了処理のリクエスト
 */
interface InterviewFinalizeRequest {
  session_id: string;
  organization_id: string;
  final_score?: number;
  evaluation_notes?: string;
  ai_recommendations?: Record<string, unknown>;
  idempotency_key?: string;
}

/**
 * 処理結果レスポンス
 */
interface InterviewFinalizeResponse {
  success: boolean;
  session_id: string;
  finalized_at: string;
  final_score?: number;
  request_id: string;
}

/**
 * AI Interview セッション完了処理
 */
async function finalizeInterviewSession(
  request: InterviewFinalizeRequest,
  authResult: OrgAuthResult,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<InterviewFinalizeResponse> {
  const { session_id, organization_id, final_score, evaluation_notes, ai_recommendations } = request;
  const { user } = authResult;

  logger.info('Starting interview session finalization', {
    session_id,
    user_id: user.id,
    org_id: organization_id,
  });

  // service_role での書き込み処理 (監査ログ付き)
  const finalizeResult = await withServiceRoleAudit(
    async () => {
      const supabase = createServiceRoleClient();
      
      // 1. セッション状態更新
      const { data: session, error: sessionError } = await supabase
        .from('ai_interview_sessions')
        .update({
          status: 'completed',
          final_score,
          evaluation_notes,
          ai_recommendations,
          completed_at: new Date().toISOString(),
          completed_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session_id)
        .eq('organization_id', organization_id) // 組織境界チェック
        .eq('status', 'in_progress') // 進行中のもののみ完了可能
        .select('id, status, created_at')
        .single();

      if (sessionError || !session) {
        throw new Error(`Session finalization failed: ${sessionError?.message || 'Session not found'}`);
      }

      // 2. 統計情報更新 (組織レベル)
      const { error: statsError } = await supabase.rpc('increment_org_interview_stats', {
        org_id: organization_id,
        stat_type: 'completed_sessions',
        increment: 1,
      });

      if (statsError) {
        logger.warn('Failed to update interview statistics', { 
          error: statsError.message,
          org_id: organization_id,
        });
        // 統計更新失敗は処理を止めない
      }

      return {
        session_id: session.id,
        finalized_at: new Date().toISOString(),
        final_score,
      };
    },
    {
      operation_type: 'UPDATE',
      table_name: 'ai_interview_sessions',
      function_name: 'ai-interview-finalize',
      query_text: `UPDATE ai_interview_sessions SET status='completed', final_score=${final_score} WHERE id='${session_id}'`,
      risk_level: 'medium',
      additional_data: {
        session_id,
        organization_id,
        user_id: user.id,
      },
    },
    new Request(''), // service_role監査用の仮Request
    user,
    logger
  );

  logger.info('Interview session finalized successfully', {
    session_id: finalizeResult.session_id,
    final_score: finalizeResult.final_score,
  });

  return {
    success: true,
    session_id: finalizeResult.session_id,
    finalized_at: finalizeResult.finalized_at,
    final_score: finalizeResult.final_score,
    request_id: logger.context.request_id!,
  };
}

/**
 * Edge Function エントリポイント
 */
Deno.serve(async (request: Request) => {
  const logger = createEdgeLogger(request, 'ai-interview-finalize');
  
  logger.info('Edge function invoked', {
    method: request.method,
    url: request.url,
    user_agent: request.headers.get('user-agent'),
  });

  try {
    // HTTP メソッドチェック
    if (request.method !== 'POST') {
      logger.warn('Invalid HTTP method', { method: request.method });
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Content-Type チェック
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      logger.warn('Invalid content type', { content_type: contentType });
      return new Response(
        JSON.stringify({ error: 'Content-Type must be application/json' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // リクエストボディ解析
    let requestBody: InterviewFinalizeRequest;
    try {
      requestBody = await request.json();
    } catch (error) {
      logger.warn('Invalid JSON body', { error: (error as Error).message });
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 必須フィールド検証
    if (!requestBody.session_id || !requestBody.organization_id) {
      logger.warn('Missing required fields', { body: requestBody });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: session_id, organization_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 認証・認可チェック (P1-3 統合)
    const authResult = await requireOrgAuth(request, ['admin', 'member'], logger);
    
    // 組織ID一致確認
    if (authResult.organization_id !== requestBody.organization_id) {
      logger.warn('Organization ID mismatch', {
        auth_org_id: authResult.organization_id,
        request_org_id: requestBody.organization_id,
      });
      return new Response(
        JSON.stringify({ error: 'Organization ID mismatch' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // idempotency key 処理
    const idempotencyKey = await extractIdempotencyKey(request) || 
                          requestBody.idempotency_key ||
                          generateIdempotencyKey('auto');

    logger.info('Processing with idempotency', { 
      idempotency_key: idempotencyKey,
      user_id: authResult.user.id,
    });

    // メイン処理を idempotency ラッパーで実行
    const result = await withIdempotency(
      () => finalizeInterviewSession(requestBody, authResult, logger),
      {
        key: idempotencyKey,
        scope: 'ai:interview:finalize',
        functionName: 'ai-interview-finalize',
        requestData: {
          session_id: requestBody.session_id,
          organization_id: requestBody.organization_id,
          user_id: authResult.user.id,
        },
      },
      request,
      authResult.user,
      authResult.organization_id,
      logger
    );

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: 'Operation failed', details: result.data }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 後処理 (waitUntil)
    const afterTasks = async () => {
      try {
        // 通知送信
        await sendCompletionNotification(requestBody.session_id, authResult.user.email, logger);
        
        // キャッシュ更新
        await invalidateSessionCache(requestBody.session_id, logger);
        
        logger.info('Post-processing completed');
      } catch (error) {
        logger.error('Post-processing failed', { error: (error as Error).message });
      }
    };

    // waitUntil で後処理を非同期実行
    // @ts-ignore - Deno Edge Runtime specific
    if (globalThis.EdgeRuntime?.waitUntil) {
      // @ts-ignore
      globalThis.EdgeRuntime.waitUntil(afterTasks());
    } else {
      // ローカル開発環境では即座に実行
      afterTasks();
    }

    logger.info('Interview finalization completed successfully', {
      session_id: result.data!.session_id,
      idempotency_key: idempotencyKey,
    });

    return new Response(
      JSON.stringify(result.data),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': logger.context.request_id!,
          'X-Idempotency-Key': idempotencyKey,
        }
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Edge function error', { 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // エラータイプに応じたステータスコード
    const statusCode = errorMessage.includes('Authentication') ? 401 :
                      errorMessage.includes('permission') ? 403 :
                      errorMessage.includes('not found') ? 404 :
                      500;

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        request_id: logger.context.request_id,
      }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * 完了通知送信 (後処理)
 */
async function sendCompletionNotification(
  sessionId: string,
  userEmail: string,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<void> {
  try {
    // 実装例: 外部通知API呼び出し
    const notificationPayload = {
      to: userEmail,
      template: 'interview_completed',
      data: { session_id: sessionId },
    };

    logger.debug('Sending completion notification', notificationPayload);
    
    // NOTE: 実際の通知API実装は省略
    await new Promise(resolve => setTimeout(resolve, 100));
    
    logger.info('Completion notification sent', { session_id: sessionId });
  } catch (error) {
    logger.error('Failed to send completion notification', { 
      error: (error as Error).message,
      session_id: sessionId,
    });
  }
}

/**
 * セッションキャッシュ無効化 (後処理)
 */
async function invalidateSessionCache(
  sessionId: string,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<void> {
  try {
    // 実装例: Redis/CDN キャッシュクリア
    logger.debug('Invalidating session cache', { session_id: sessionId });
    
    // NOTE: 実際のキャッシュ無効化実装は省略  
    await new Promise(resolve => setTimeout(resolve, 50));
    
    logger.info('Session cache invalidated', { session_id: sessionId });
  } catch (error) {
    logger.error('Failed to invalidate session cache', { 
      error: (error as Error).message,
      session_id: sessionId,
    });
  }
}