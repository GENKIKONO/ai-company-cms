/**
 * P1-5: idempotency key 管理ユーティリティ
 * 
 * Supabase Assistant 回答準拠:
 * - 専用テーブル public.idempotency_keys 使用
 * - UNIQUE制約による重複防止
 * - 外部イベントでは event_id を使用
 * - scope による分離
 */

import { createServiceRoleClient } from './supabase.ts';
import { type EdgeLogger } from './logging.ts';
import { type AuthenticatedUser } from './auth.ts';
import { writeAuditLog } from './audit.ts';

/**
 * idempotency key の状態
 */
export type IdempotencyStatus = 'pending' | 'completed' | 'failed';

/**
 * idempotency レコード
 */
export interface IdempotencyRecord {
  id: string;                    // idempotency key
  scope: string;                // scope ('default', 'stripe:webhook', 'ai:interview' など)
  function_name: string;        // 実行した Edge Function 名
  user_id?: string;            // 実行ユーザー
  organization_id?: string;    // 組織ID
  request_data?: Record<string, unknown>; // リクエストデータのハッシュ
  response_data?: Record<string, unknown>; // 初回実行結果
  status: IdempotencyStatus;   // 実行状態
  created_at: string;          // 作成日時
  updated_at: string;          // 更新日時
  expires_at: string;          // 有効期限
}

/**
 * idempotency key 確認結果
 */
export interface IdempotencyCheckResult {
  isFirstExecution: boolean;   // 初回実行かどうか
  existingRecord?: IdempotencyRecord; // 既存レコード (重複実行時)
}

/**
 * idempotency key 操作結果
 */
export interface IdempotencyResult<T = unknown> {
  success: boolean;
  data?: T;
  record: IdempotencyRecord;
}

/**
 * idempotency key 生成
 * 
 * @param source - 生成元 ('auto' | 'event_id' | 'custom')
 * @param value - カスタム値 (source が 'custom' または 'event_id' の場合)
 */
export function generateIdempotencyKey(
  source: 'auto' | 'event_id' | 'custom' = 'auto',
  value?: string
): string {
  switch (source) {
    case 'event_id':
    case 'custom':
      if (!value) {
        throw new Error(`Value required for idempotency key source: ${source}`);
      }
      return value;
    case 'auto':
    default:
      return crypto.randomUUID();
  }
}

/**
 * リクエストからidempotency key抽出
 * ヘッダー、URL、ボディから順次チェック
 */
export async function extractIdempotencyKey(
  request: Request
): Promise<string | null> {
  // ヘッダーから取得 (最優先)
  const headerKey = request.headers.get('idempotency-key') || 
                   request.headers.get('x-idempotency-key');
  if (headerKey) {
    return headerKey;
  }

  // URL パラメータから取得
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('idempotency_key');
  if (queryKey) {
    return queryKey;
  }

  // JSON ボディから取得
  if (request.method !== 'GET' && request.headers.get('content-type')?.includes('application/json')) {
    try {
      const body = await request.clone().json();
      return body.idempotency_key || body.event_id || null;
    } catch {
      // JSON パース失敗は無視
    }
  }

  return null;
}

/**
 * idempotency key の存在確認と初回判定
 * 
 * @param key - idempotency key
 * @param scope - スコープ
 * @param functionName - Edge Function名
 * @param logger - ロガー
 */
export async function checkIdempotency(
  key: string,
  scope: string,
  functionName: string,
  logger: EdgeLogger
): Promise<IdempotencyCheckResult> {
  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase
      .from('idempotency_keys')
      .select('*')
      .eq('id', key)
      .eq('scope', scope)
      .maybeSingle();

    if (error) {
      logger.error('Idempotency check failed', { 
        error: error.message,
        key,
        scope,
      });
      // エラー時は初回実行として扱う (安全側)
      return { isFirstExecution: true };
    }

    if (!data) {
      logger.debug('Idempotency key not found, first execution', { key, scope });
      return { isFirstExecution: true };
    }

    logger.info('Idempotency key found, duplicate execution', { 
      key,
      scope,
      status: data.status,
      created_at: data.created_at,
    });

    return {
      isFirstExecution: false,
      existingRecord: data as IdempotencyRecord,
    };
  } catch (error) {
    logger.error('Exception during idempotency check', { 
      error: (error as Error).message,
      key,
      scope,
    });
    return { isFirstExecution: true };
  }
}

/**
 * idempotency key レコード作成 (初回実行時)
 * 
 * @param key - idempotency key
 * @param scope - スコープ  
 * @param functionName - Edge Function名
 * @param user - 実行ユーザー
 * @param organizationId - 組織ID
 * @param requestData - リクエストデータ
 * @param logger - ロガー
 */
export async function createIdempotencyRecord(
  key: string,
  scope: string,
  functionName: string,
  user: AuthenticatedUser | null,
  organizationId: string | null,
  requestData: Record<string, unknown>,
  logger: EdgeLogger
): Promise<IdempotencyRecord> {
  const supabase = createServiceRoleClient();
  
  const record: Partial<IdempotencyRecord> = {
    id: key,
    scope,
    function_name: functionName,
    user_id: user?.id,
    organization_id: organizationId,
    request_data: requestData,
    status: 'pending',
  };

  try {
    const { data, error } = await supabase
      .from('idempotency_keys')
      .insert(record)
      .select()
      .single();

    if (error) {
      // UNIQUE制約エラーの場合は重複実行
      if (error.code === '23505') {
        logger.warn('Idempotency key collision during insert', { key, scope });
        throw new Error('Duplicate execution detected');
      }
      
      logger.error('Failed to create idempotency record', { 
        error: error.message,
        key,
        scope,
      });
      throw new Error(`Idempotency record creation failed: ${error.message}`);
    }

    logger.info('Idempotency record created', { key, scope, status: 'pending' });
    return data as IdempotencyRecord;
  } catch (error) {
    logger.error('Exception creating idempotency record', { 
      error: (error as Error).message,
      key,
      scope,
    });
    throw error;
  }
}

/**
 * idempotency レコード完了更新
 * 
 * @param key - idempotency key
 * @param scope - スコープ
 * @param status - 最終状態
 * @param responseData - 処理結果
 * @param logger - ロガー
 */
export async function updateIdempotencyRecord(
  key: string,
  scope: string,
  status: 'completed' | 'failed',
  responseData: Record<string, unknown>,
  logger: EdgeLogger
): Promise<void> {
  const supabase = createServiceRoleClient();

  try {
    const { error } = await supabase
      .from('idempotency_keys')
      .update({
        status,
        response_data: responseData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', key)
      .eq('scope', scope);

    if (error) {
      logger.error('Failed to update idempotency record', { 
        error: error.message,
        key,
        scope,
        status,
      });
    } else {
      logger.info('Idempotency record updated', { key, scope, status });
    }
  } catch (error) {
    logger.error('Exception updating idempotency record', { 
      error: (error as Error).message,
      key,
      scope,
    });
  }
}

/**
 * idempotency付き実行ラッパー
 * 
 * @param operation - 実行する処理
 * @param options - idempotency設定
 * @param request - HTTP Request
 * @param user - 実行ユーザー
 * @param organizationId - 組織ID
 * @param logger - ロガー
 */
export async function withIdempotency<T>(
  operation: () => Promise<T>,
  options: {
    key: string;
    scope: string;
    functionName: string;
    requestData: Record<string, unknown>;
  },
  request: Request,
  user: AuthenticatedUser | null,
  organizationId: string | null,
  logger: EdgeLogger
): Promise<IdempotencyResult<T>> {
  const { key, scope, functionName, requestData } = options;

  // idempotency確認
  const checkResult = await checkIdempotency(key, scope, functionName, logger);

  if (!checkResult.isFirstExecution) {
    // 重複実行の場合は既存結果を返す
    const existing = checkResult.existingRecord!;
    
    if (existing.status === 'completed') {
      logger.info('Returning cached result for duplicate execution', { key, scope });
      return {
        success: true,
        data: existing.response_data as T,
        record: existing,
      };
    } else if (existing.status === 'failed') {
      logger.warn('Previous execution failed, rejecting duplicate', { key, scope });
      return {
        success: false,
        data: existing.response_data as T,
        record: existing,
      };
    } else {
      // pending状態 - 同時実行中
      logger.warn('Concurrent execution detected, rejecting', { key, scope });
      throw new Error('Concurrent execution in progress');
    }
  }

  // 初回実行 - レコード作成
  const record = await createIdempotencyRecord(
    key,
    scope,
    functionName,
    user,
    organizationId,
    requestData,
    logger
  );

  // 監査ログ記録
  await writeAuditLog({
    operation_type: 'IDEMPOTENCY_START',
    table_name: 'idempotency_keys',
    function_name: functionName,
    user_id: user?.id,
    request_ip: request.headers.get('cf-connecting-ip') || undefined,
    execution_time_ms: 0,
    risk_level: 'low',
    additional_data: {
      idempotency_key: key,
      scope,
      first_execution: true,
    },
  }, logger);

  let result: T;
  let finalStatus: 'completed' | 'failed';

  try {
    // 実際の処理実行
    result = await operation();
    finalStatus = 'completed';
    
    logger.info('Idempotent operation completed successfully', { key, scope });
    
    return {
      success: true,
      data: result,
      record,
    };
  } catch (error) {
    finalStatus = 'failed';
    
    logger.error('Idempotent operation failed', { 
      error: (error as Error).message,
      key,
      scope,
    });
    
    throw error;
  } finally {
    // レコード状態更新
    await updateIdempotencyRecord(
      key,
      scope,
      finalStatus,
      finalStatus === 'completed' ? { result } : { error: 'Operation failed' },
      logger
    );
  }
}