/**
 * P1-5: テスト用 Edge Function
 * 
 * _shared ユーティリティの使用例
 * - 基本的な認証・認可パターン
 * - idempotency 対応
 * - service_role 使用パターン
 * - 構造化ログ
 */

import { createAuthenticatedClient, createServiceRoleClient } from '../_shared/supabase.ts';
import { createEdgeLogger } from '../_shared/logging.ts';
import { requireOrgAuth, requireAuth, EdgeAuthError } from '../_shared/auth.ts';
import { withServiceRoleAudit, auditSecurityEvent } from '../_shared/audit.ts';
import { 
  extractIdempotencyKey, 
  generateIdempotencyKey, 
  withIdempotency 
} from '../_shared/idempotency.ts';

/**
 * テスト用リクエスト
 */
interface ExampleRequest {
  action: 'create_test_record' | 'update_test_record' | 'security_test';
  organization_id?: string;
  data?: Record<string, unknown>;
  idempotency_key?: string;
}

/**
 * テスト用レスポンス
 */
interface ExampleResponse {
  success: boolean;
  action: string;
  result: unknown;
  request_id: string;
  execution_time_ms: number;
}

/**
 * テストレコード作成処理
 */
async function createTestRecord(
  data: Record<string, unknown>,
  organizationId: string,
  userId: string,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<{ id: string; created_at: string }> {
  
  logger.info('Creating test record', { org_id: organizationId, user_id: userId });

  // service_role での作成 (監査ログ付き)
  const result = await withServiceRoleAudit(
    async () => {
      const supabase = createServiceRoleClient();
      
      const { data: record, error } = await supabase
        .from('test_records') // 仮想テーブル
        .insert({
          organization_id: organizationId,
          user_id: userId,
          data,
          created_at: new Date().toISOString(),
        })
        .select('id, created_at')
        .single();

      if (error) {
        throw new Error(`Test record creation failed: ${error.message}`);
      }

      return record;
    },
    {
      operation_type: 'INSERT',
      table_name: 'test_records',
      function_name: 'example-function',
      query_text: 'INSERT INTO test_records (organization_id, user_id, data)',
      risk_level: 'low',
      additional_data: {
        organization_id: organizationId,
        user_id: userId,
        data_keys: Object.keys(data),
      },
    },
    new Request(''), // service_role監査用の仮Request
    { id: userId, email: '', user: {} as any }, // 簡易ユーザー情報
    logger
  );

  logger.info('Test record created successfully', { 
    record_id: result.id,
    org_id: organizationId,
  });

  return result;
}

/**
 * テストレコード更新処理
 */
async function updateTestRecord(
  recordId: string,
  data: Record<string, unknown>,
  organizationId: string,
  userId: string,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<{ updated_at: string }> {

  logger.info('Updating test record', { 
    record_id: recordId,
    org_id: organizationId,
    user_id: userId,
  });

  // authenticated クライアント使用 (RLS適用)
  const supabase = createAuthenticatedClient();
  
  const { data: record, error } = await supabase
    .from('test_records')
    .update({
      data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recordId)
    .eq('organization_id', organizationId) // 組織境界チェック
    .select('updated_at')
    .single();

  if (error) {
    throw new Error(`Test record update failed: ${error.message}`);
  }

  logger.info('Test record updated successfully', { record_id: recordId });
  
  return { updated_at: record.updated_at };
}

/**
 * セキュリティテスト処理
 */
async function performSecurityTest(
  request: Request,
  userId: string,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<{ test_result: string }> {
  
  logger.info('Performing security test', { user_id: userId });

  // セキュリティイベント監査
  await auditSecurityEvent(
    {
      type: 'SUSPICIOUS_ACTIVITY',
      description: 'Security test function called',
      severity: 'low',
    },
    'example-function',
    request,
    { id: userId, email: '', user: {} as any },
    logger
  );

  return { test_result: 'Security test completed successfully' };
}

/**
 * Edge Function エントリポイント
 */
Deno.serve(async (request: Request) => {
  const startTime = Date.now();
  const logger = createEdgeLogger(request, 'example-function');
  
  logger.info('Example function invoked', {
    method: request.method,
    url: request.url,
  });

  try {
    // CORS対応 (開発用)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
        },
      });
    }

    // HTTP メソッドチェック
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // リクエストボディ解析
    let requestBody: ExampleRequest;
    try {
      requestBody = await request.json();
    } catch (error) {
      logger.warn('Invalid JSON body', { error: (error as Error).message });
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // アクション別処理
    let result: unknown;
    let requiresOrgAuth = false;

    switch (requestBody.action) {
      case 'create_test_record':
      case 'update_test_record':
        requiresOrgAuth = true;
        break;
      case 'security_test':
        requiresOrgAuth = false;
        break;
      default:
        logger.warn('Invalid action', { action: requestBody.action });
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // 認証・認可
    if (requiresOrgAuth) {
      if (!requestBody.organization_id) {
        return new Response(
          JSON.stringify({ error: 'organization_id required for this action' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const authResult = await requireOrgAuth(request, ['admin', 'member'], logger);
      
      // idempotency key 処理
      const idempotencyKey = await extractIdempotencyKey(request) || 
                            requestBody.idempotency_key ||
                            generateIdempotencyKey('auto');

      // メイン処理を idempotency ラッパーで実行
      const idempotentResult = await withIdempotency(
        async () => {
          switch (requestBody.action) {
            case 'create_test_record':
              return await createTestRecord(
                requestBody.data || {},
                authResult.organization_id,
                authResult.user.id,
                logger
              );
            case 'update_test_record':
              return await updateTestRecord(
                requestBody.data?.record_id as string,
                requestBody.data || {},
                authResult.organization_id,
                authResult.user.id,
                logger
              );
            default:
              throw new Error('Invalid action for org context');
          }
        },
        {
          key: idempotencyKey,
          scope: `example:${requestBody.action}`,
          functionName: 'example-function',
          requestData: {
            action: requestBody.action,
            organization_id: requestBody.organization_id,
            user_id: authResult.user.id,
          },
        },
        request,
        authResult.user,
        authResult.organization_id,
        logger
      );

      result = idempotentResult.data;

    } else {
      // 基本認証のみ
      const user = await requireAuth(request, logger);
      
      switch (requestBody.action) {
        case 'security_test':
          result = await performSecurityTest(request, user.id, logger);
          break;
        default:
          throw new Error('Invalid action for basic auth');
      }
    }

    const executionTime = Date.now() - startTime;
    
    logger.info('Example function completed successfully', {
      action: requestBody.action,
      execution_time_ms: executionTime,
    });

    const response: ExampleResponse = {
      success: true,
      action: requestBody.action,
      result,
      request_id: logger.context.request_id!,
      execution_time_ms: executionTime,
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': logger.context.request_id!,
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Example function error', { 
      error: errorMessage,
      execution_time_ms: executionTime,
    });

    // EdgeAuthError の場合は適切なステータスコードを返す
    if (error instanceof EdgeAuthError) {
      return new Response(
        JSON.stringify({ 
          error: error.message,
          code: error.code,
          request_id: logger.context.request_id,
        }),
        { status: error.statusCode, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        request_id: logger.context.request_id,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});