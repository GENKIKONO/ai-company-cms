/**
 * RLS拒否イベントロギングユーティリティ
 * EPIC 3-5: rls_denied_events テーブルへの安全なログ記録
 * 
 * Supabase確定仕様＋フィードバック反映:
 * - service_role経由のみINSERT
 * - 1分窓サンプリング（最大3件/分）制限
 * - 403/401エラーの適切な分離
 * - PII除去・allowlistベース匿名化
 * - 非同期再試行（最大3回、2秒/回）
 */

import { createServiceRoleClient } from './supabase.ts';
import { type EdgeLogger } from './logging.ts';
import { getOrGenerateRequestId } from './logging.ts';

/**
 * RLS拒否理由 (ENUM準拠)
 */
export type RlsDeniedReason = 
  | 'RLS_DENY'
  | 'NOT_MEMBER' 
  | 'INSUFFICIENT_ROLE'
  | 'MISSING_JWT'
  | 'TENANT_MISMATCH'
  | 'POLICY_CONDITION_FAILED'
  | 'PRIVATE_CHANNEL_REQUIRED'
  | 'BUCKET_POLICY_DENY'
  | 'EXPIRED_SESSION';

/**
 * ソース分類
 */
export type RlsEventSource = 'api' | 'edge' | 'ui';

/**
 * 操作種別
 */
export type RlsOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'RPC' | 'STORAGE' | 'SUBSCRIBE';

/**
 * RLS拒否イベントエントリ
 */
export interface RlsDeniedEventEntry {
  // 必須項目
  table_name: string;
  operation: RlsOperation;
  reason: RlsDeniedReason;
  source: RlsEventSource;
  request: Request;
  
  // オプション項目
  user_id?: string;
  org_id?: string;
  screen_path?: string;
  api_endpoint?: string;
  resource?: string;
  session_id?: string;
  user_role?: string;
  details?: Record<string, unknown>;
}

/**
 * サンプリングキャッシュ（メモリベース、1分TTL）
 */
interface SamplingKey {
  user_id: string | null;
  org_id: string | null;
  table_name: string;
  operation: RlsOperation;
  reason: RlsDeniedReason;
  screen_path: string | null;
  api_endpoint: string | null;
}

interface SamplingEntry {
  count: number;
  lastSeen: number;
}

const samplingCache = new Map<string, SamplingEntry>();
const SAMPLING_WINDOW_MS = 60 * 1000; // 1分
const MAX_EVENTS_PER_MINUTE = 3;
const MAX_401_EVENTS_PER_MINUTE = 1; // 401は別制限

/**
 * サンプリングキーの生成
 */
function createSamplingKey(entry: RlsDeniedEventEntry, userIdFromAuth?: string): string {
  const key: SamplingKey = {
    user_id: entry.user_id || userIdFromAuth || null,
    org_id: entry.org_id || null,
    table_name: entry.table_name,
    operation: entry.operation,
    reason: entry.reason,
    screen_path: entry.screen_path || null,
    api_endpoint: entry.api_endpoint || null
  };
  return JSON.stringify(key);
}

/**
 * サンプリング制御チェック
 */
function shouldSkipDueToSampling(entry: RlsDeniedEventEntry, userIdFromAuth?: string): boolean {
  const keyStr = createSamplingKey(entry, userIdFromAuth);
  const now = Date.now();
  const existing = samplingCache.get(keyStr);
  
  // 窓が過ぎている場合はリセット
  if (!existing || (now - existing.lastSeen) > SAMPLING_WINDOW_MS) {
    samplingCache.set(keyStr, { count: 1, lastSeen: now });
    return false;
  }
  
  // 制限チェック（401は別制限）
  const maxCount = entry.reason === 'MISSING_JWT' ? MAX_401_EVENTS_PER_MINUTE : MAX_EVENTS_PER_MINUTE;
  if (existing.count >= maxCount) {
    return true; // スキップ
  }
  
  // カウント増加
  existing.count += 1;
  existing.lastSeen = now;
  samplingCache.set(keyStr, existing);
  return false;
}

/**
 * サンプリングキャッシュのクリーンアップ（古いエントリ削除）
 */
function cleanupSamplingCache(): void {
  const now = Date.now();
  for (const [key, entry] of samplingCache.entries()) {
    if ((now - entry.lastSeen) > SAMPLING_WINDOW_MS * 2) { // 2分経過で削除
      samplingCache.delete(key);
    }
  }
}

/**
 * details のPII除去・allowlistベース匿名化
 */
function sanitizeDetails(details: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (!details) return null;
  
  // allowlist: 保存を許可するキーのみ
  const allowedKeys = [
    'error_code', 'error_type', 'status_code', 'method', 'path_segments',
    'table_count', 'row_count', 'query_type', 'operation_type',
    'policy_name', 'constraint_name', 'column_name',
    'tenant_context', 'role_context', 'permission_required'
  ];
  
  const sanitized: Record<string, unknown> = {};
  
  for (const key of allowedKeys) {
    if (key in details) {
      const value = details[key];
      if (typeof value === 'string' && value.length > 200) {
        sanitized[key] = value.slice(0, 200) + '...';
      } else if (typeof value === 'object' && value !== null) {
        // ネストしたオブジェクトは文字列化して制限
        sanitized[key] = JSON.stringify(value).slice(0, 200);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

/**
 * IPアドレス抽出（IPv4/IPv6対応、不正値はnull）
 */
function extractClientIp(request: Request): string | null {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      const firstIp = forwarded.split(',')[0].trim();
      // 簡易IPv4/IPv6判定
      if (/^[\d.]+$/.test(firstIp) || /^[a-fA-F0-9:]+$/.test(firstIp)) {
        return firstIp;
      }
    }
    
    const realIp = request.headers.get('x-real-ip');
    if (realIp && (/^[\d.]+$/.test(realIp) || /^[a-fA-F0-9:]+$/.test(realIp))) {
      return realIp;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * RLS拒否イベントの記録（非同期、再試行付き）
 */
export async function recordRlsDeniedEvent(
  entry: RlsDeniedEventEntry,
  logger?: EdgeLogger
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  const maxRetries = 3;
  const timeoutMs = 2000;
  
  try {
    // ユーザーIDを可能なら抽出（認証情報から）
    let userIdFromAuth: string | undefined;
    try {
      const authHeader = entry.request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        // JWTからuser_idを抽出は複雑なので、entry.user_idを優先
        userIdFromAuth = entry.user_id;
      }
    } catch {
      // 認証情報抽出失敗は無視
    }
    
    // サンプリング制御
    if (shouldSkipDueToSampling(entry, userIdFromAuth)) {
      logger?.debug('RLS denied event skipped due to sampling', {
        table_name: entry.table_name,
        reason: entry.reason
      });
      return { success: true, skipped: true };
    }
    
    // 定期的なキャッシュクリーンアップ（10%の確率で実行）
    if (Math.random() < 0.1) {
      cleanupSamplingCache();
    }
    
    const supabase = createServiceRoleClient();
    const request_id = getOrGenerateRequestId(entry.request);
    const clientIp = extractClientIp(entry.request);
    
    const eventRecord = {
      user_id: entry.user_id || userIdFromAuth || null,
      org_id: entry.org_id || null,
      table_name: entry.table_name,
      operation: entry.operation,
      reason: entry.reason,
      screen_path: entry.screen_path || null,
      api_endpoint: entry.api_endpoint || null,
      source: entry.source,
      resource: entry.resource || null,
      request_id,
      session_id: entry.session_id || null,
      user_role: entry.user_role || null,
      ip: clientIp,
      user_agent: entry.request.headers.get('user-agent') || null,
      details: sanitizeDetails(entry.details)
    };
    
    // 再試行ループ
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await Promise.race([
          supabase
            .from('rls_denied_events')
            .insert(eventRecord)
            .select('id')
            .single(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
          )
        ]) as any;
        
        if (error) {
          throw error;
        }
        
        logger?.info('RLS denied event recorded', {
          event_id: data.id,
          table_name: entry.table_name,
          operation: entry.operation,
          reason: entry.reason,
          attempt
        });
        
        return { success: true };
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        
        if (attempt === maxRetries) {
          logger?.error('Failed to record RLS denied event after retries', {
            error: errorMsg,
            table_name: entry.table_name,
            reason: entry.reason,
            attempts: maxRetries
          });
          return { success: false, error: errorMsg };
        }
        
        // 指数バックオフ待機
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        
        logger?.warn('RLS denied event recording retry', {
          error: errorMsg,
          attempt,
          next_retry_in_ms: backoffMs
        });
      }
    }
    
    return { success: false, error: 'Max retries exceeded' };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger?.error('Exception in RLS denied event recording', {
      error: errorMsg,
      table_name: entry.table_name,
      reason: entry.reason
    });
    return { success: false, error: errorMsg };
  }
}

/**
 * 非同期でRLS拒否イベントを記録（EdgeRuntime.waitUntil使用）
 */
export function recordRlsDeniedEventAsync(
  entry: RlsDeniedEventEntry,
  logger?: EdgeLogger
): void {
  // EdgeRuntime.waitUntil でバックグラウンド処理
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(
      recordRlsDeniedEvent(entry, logger).catch(error => {
        logger?.error('Async RLS denied event recording failed', {
          error: error.message,
          table_name: entry.table_name,
          reason: entry.reason
        });
      })
    );
  } else {
    // fallback: Promise.resolve().then()
    Promise.resolve().then(() => 
      recordRlsDeniedEvent(entry, logger)
    ).catch(error => {
      logger?.error('Fallback async RLS denied event recording failed', {
        error: error.message,
        table_name: entry.table_name,
        reason: entry.reason
      });
    });
  }
}

/**
 * エラーからRLS拒否理由を判定（強化版）
 */
export function detectRlsDeniedReason(error: any): RlsDeniedReason | null {
  if (!error) return null;
  
  // 401エラー（認証なし）
  if (error.status === 401) {
    return 'MISSING_JWT';
  }
  
  // 403エラー（認可なし）
  if (error.status === 403) {
    const code = error.code;
    const message = error.message?.toLowerCase() || '';
    const postgrestCode = error.headers?.['x-postgrest-code'];
    
    // PostgRESTコード判定（強化版）
    if (code === 'PGRST301' || postgrestCode === 'PGRST301') {
      return 'RLS_DENY';
    }
    
    // メッセージ解析によるフォールバック
    if (message.includes('permission denied')) {
      return 'RLS_DENY';
    }
    if (message.includes('not member') || message.includes('membership')) {
      return 'NOT_MEMBER';
    }
    if (message.includes('insufficient role') || message.includes('role')) {
      return 'INSUFFICIENT_ROLE';
    }
    if (message.includes('tenant') || message.includes('organization')) {
      return 'TENANT_MISMATCH';
    }
    if (message.includes('policy') || message.includes('condition')) {
      return 'POLICY_CONDITION_FAILED';
    }
    if (message.includes('private') || message.includes('channel')) {
      return 'PRIVATE_CHANNEL_REQUIRED';
    }
    if (message.includes('bucket') || message.includes('storage')) {
      return 'BUCKET_POLICY_DENY';
    }
    if (message.includes('session') || message.includes('expired')) {
      return 'EXPIRED_SESSION';
    }
    
    // デフォルト
    return 'RLS_DENY';
  }
  
  return null;
}

/**
 * Supabaseエラーからテーブル名を抽出
 */
export function extractTableNameFromError(error: any): string {
  if (!error) return 'unknown';
  
  const message = error.message || '';
  const details = error.details || '';
  
  // "permission denied for table users" パターン
  const tableMatch = message.match(/table\s+([a-zA-Z_][a-zA-Z0-9_]*)/i) ||
                    details.match(/table\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
  
  if (tableMatch) {
    return tableMatch[1];
  }
  
  // schema.table パターン
  const schemaTableMatch = message.match(/[a-zA-Z_][a-zA-Z0-9_]*\.([a-zA-Z_][a-zA-Z0-9_]*)/i);
  if (schemaTableMatch) {
    return schemaTableMatch[1];
  }
  
  return 'unknown';
}

/**
 * 便利ヘルパー関数
 */
export const RlsDeniedEventHelpers = {
  /**
   * Supabaseクライアントエラーから自動生成
   */
  fromSupabaseError: (
    error: any,
    request: Request,
    source: RlsEventSource,
    operation: RlsOperation = 'SELECT',
    screenPath?: string,
    apiEndpoint?: string,
    additionalContext?: Partial<RlsDeniedEventEntry>
  ): RlsDeniedEventEntry | null => {
    const reason = detectRlsDeniedReason(error);
    if (!reason) return null;
    
    const tableName = extractTableNameFromError(error);
    
    return {
      table_name: tableName,
      operation,
      reason,
      source,
      request,
      screen_path: screenPath,
      api_endpoint: apiEndpoint,
      details: {
        error_code: error.code,
        error_type: error.name,
        status_code: error.status,
        original_message: error.message?.slice(0, 200)
      },
      ...additionalContext
    };
  }
};