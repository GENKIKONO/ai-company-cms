/**
 * service_role_audit 書き込みユーティリティ
 * 
 * Supabase Assistant 回答準拠 (Q11, Q17, Q18):
 * - public.service_role_audit テーブル既存
 * - service_role 使用時は必ず監査ログ記録
 * - payload機密情報除去 (Q11)
 * - waitUntil経由で非同期保存 (Q4, Q17)
 * - バッチ化対応 (Q18)
 */

import { createServiceRoleClient, getEdgeFunctionMeta } from './supabase.ts';
import { type EdgeLogger, logServiceRoleUsage } from './logging.ts';
import { type AuthenticatedUser } from './auth.ts';

/**
 * 監査ログエントリ (新service_role_auditスキーマ準拠)
 * Supabaseアシスタントが設計したテーブル構造に対応
 */
export interface ServiceRoleAuditEntry {
  function_name: string;           // Edge Function名
  actor: string;                   // 実行者 ('user:uuid' | 'service_role' | 'external:source')
  request_id?: string;             // リクエストID (X-Request-Id等)
  trigger_type?: 'MANUAL' | 'CI' | 'SCHEDULED'; // トリガー種別
  trigger_source?: string;         // トリガー元 ('github-actions' | 'cron' | 'console')
  git_commit_hash?: string;        // Gitコミットハッシュ
  resource?: string;               // 対象リソース ('table:users' | 'interview:uuid')
  row_count: number;               // 影響行数 (Q13: SELECTは返却件数)
  latency_ms: number;              // 実行時間 (Q14: >10秒でアラート推奨)
  success: boolean;                // 成功/失敗
  error_code?: string;             // エラーコード (SQLSTATE等)
  error_message?: string;          // エラーメッセージ
  payload?: Record<string, unknown>; // リクエスト要約 (機密情報除去済み)
  context?: Record<string, unknown>; // 実行環境情報
}

// ============================================
// 機密情報除去 (Q11対応)
// ============================================

/**
 * payload から機密情報を除去 (Q11準拠)
 * PII/秘匿情報を[REDACTED]に置換
 */
function sanitizePayload(payload: any): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const sensitivePatterns = [
    // Q11で挙げられた機密情報
    'password', 'token', 'secret', 'key', 'jwt', 'authorization',
    'email', 'phone', 'address', 'name', 'fullname', 'firstname', 'lastname',
    'card', 'credit', 'pan', 'cvv', 'bank', 'account',
    'oauth', 'api_key', 'cookie', 'session',
    'social_security', 'ssn', 'passport', 'license'
  ];

  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();
    
    // キー名に機密パターンが含まれているかチェック
    const isSensitive = sensitivePatterns.some(pattern => 
      lowerKey.includes(pattern)
    );
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      // ネストしたオブジェクトも再帰的にサニタイズ
      sanitized[key] = sanitizePayload(value);
    } else if (typeof value === 'string') {
      // IP アドレスは /24 でマスク (Q11)
      const ipv4Regex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
      const maskedValue = value.replace(ipv4Regex, (ip) => {
        const parts = ip.split('.');
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      });
      
      // JWT っぽい文字列（3つのドットで区切られた長い文字列）を検出
      if (value.split('.').length === 3 && value.length > 100) {
        sanitized[key] = '[JWT_REDACTED]';
      } else {
        sanitized[key] = maskedValue;
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * リクエストから IP アドレス抽出
 */
function extractClientIp(request: Request): string | undefined {
  // Cloudflare/各種プロキシのヘッダーをチェック
  const ip = request.headers.get('cf-connecting-ip') ||
             request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip');
             
  // Q11: IPフル値は/24マスクを推奨
  if (ip && ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }
  
  return ip || undefined;
}

// ============================================
// 監査ログ書き込み (新スキーマ対応)
// ============================================

/**
 * service_role_audit テーブルへの監査ログ記録 (新スキーマ)
 * Q4, Q17, Q18対応: waitUntil経由非同期保存・バッチ化
 * 
 * @param entry - 監査ログエントリ
 * @param logger - ロガー (エラー記録用)
 */
export async function writeServiceRoleAudit(
  entry: ServiceRoleAuditEntry,
  logger?: EdgeLogger
): Promise<void> {
  const supabase = createServiceRoleClient();
  
  // payload機密情報除去
  const sanitizedEntry = {
    ...entry,
    payload: entry.payload ? sanitizePayload(entry.payload) : null,
    created_at: new Date().toISOString()
  };

  try {
    const { error } = await supabase
      .from('service_role_audit')
      .insert(sanitizedEntry);

    if (error) {
      logger?.error('Failed to write service_role audit', { 
        error: error.message,
        function_name: entry.function_name,
        actor: entry.actor
      });
      // Q4: waitUntil内での監査ログ失敗は例外にしない (元処理を止めない)
    } else {
      logger?.debug('Service role audit written successfully', { 
        function_name: entry.function_name,
        actor: entry.actor,
        success: entry.success
      });
    }
  } catch (error) {
    logger?.error('Exception writing service_role audit', { 
      error: (error as Error).message,
      function_name: entry.function_name
    });
  }
}

/**
 * バッチ監査ログ記録 (Q18対応)
 * 大量実行時のパフォーマンス最適化
 */
export async function writeBatchServiceRoleAudit(
  entries: ServiceRoleAuditEntry[],
  logger?: EdgeLogger
): Promise<void> {
  if (entries.length === 0) return;

  const supabase = createServiceRoleClient();
  
  // 全エントリの機密情報除去
  const sanitizedEntries = entries.map(entry => ({
    ...entry,
    payload: entry.payload ? sanitizePayload(entry.payload) : null,
    created_at: new Date().toISOString()
  }));

  try {
    const { error } = await supabase
      .from('service_role_audit')
      .insert(sanitizedEntries);

    if (error) {
      logger?.error('Failed to write batch service_role audit', { 
        error: error.message,
        batch_size: entries.length
      });
    } else {
      logger?.debug('Batch service_role audit written successfully', { 
        batch_size: entries.length
      });
    }
  } catch (error) {
    logger?.error('Exception writing batch service_role audit', { 
      error: (error as Error).message,
      batch_size: entries.length
    });
  }
}

/**
 * waitUntil経由での非同期監査ログ保存 (Q4, Q17対応)
 * レスポンスをブロックしない監査記録
 */
export function auditAsync(
  entry: ServiceRoleAuditEntry,
  logger?: EdgeLogger
): void {
  // Q4: EdgeRuntime.waitUntilでバックグラウンド実行
  EdgeRuntime.waitUntil(
    writeServiceRoleAudit(entry, logger).catch(error => {
      // Q4: waitUntil内の例外をcatchしてログ出力
      logger?.error('Async audit logging failed', {
        error: error.message,
        function_name: entry.function_name,
        actor: entry.actor
      });
    })
  );
}

// ============================================
// 高レベルヘルパー関数
// ============================================

/**
 * service_role 操作の監査付きラッパー (新スキーマ対応)
 * 
 * @param operation - 実行する処理
 * @param metadata - 監査ログ用メタデータ
 * @param request - HTTP Request (IP/User-Agent取得用)
 * @param user - 認証済みユーザー (任意)
 * @param logger - ロガー
 */
export async function withServiceRoleAudit<T>(
  operation: () => Promise<T>,
  metadata: {
    function_name: string;
    resource?: string;
    trigger_type?: 'MANUAL' | 'CI' | 'SCHEDULED';
    trigger_source?: string;
    git_commit_hash?: string;
    payload?: Record<string, unknown>;
  },
  request: Request,
  user: AuthenticatedUser | null,
  logger: EdgeLogger
): Promise<T> {
  const startTime = Date.now();
  const requestMeta = getEdgeFunctionMeta();
  
  // 事前にservice_role使用をログ記録 (構造化ログへ)
  logServiceRoleUsage(logger, 'service_role_operation', {
    user_id: user?.id,
    resource: metadata.resource,
  });

  let result: T;
  let rowCount = 0;
  let success = true;
  let errorCode: string | undefined;
  let errorMessage: string | undefined;

  try {
    result = await operation();
    
    // 結果から行数を抽出 (可能な場合)
    if (result && typeof result === 'object') {
      if ('count' in result) {
        rowCount = (result as any).count;
      } else if ('data' in result && Array.isArray((result as any).data)) {
        rowCount = (result as any).data.length;
      }
    }
    
    return result;
  } catch (error) {
    success = false;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // SQLStateやエラーコード抽出
    if (error instanceof Error && 'code' in error) {
      errorCode = (error as any).code;
    }
    
    throw error;
  } finally {
    const latencyMs = Date.now() - startTime;
    
    // 監査ログを非同期で記録 (Q4, Q17対応)
    auditAsync({
      function_name: metadata.function_name,
      actor: user ? `user:${user.id}` : 'service_role',
      request_id: requestMeta.requestId,
      trigger_type: metadata.trigger_type,
      trigger_source: metadata.trigger_source,
      git_commit_hash: metadata.git_commit_hash,
      resource: metadata.resource,
      row_count: rowCount,
      latency_ms: latencyMs,
      success,
      error_code: errorCode,
      error_message: errorMessage,
      payload: metadata.payload,
      context: {
        function_region: requestMeta.region,
        request_method: request.method,
        request_url: request.url,
        user_agent: request.headers.get('user-agent'),
        client_ip: extractClientIp(request)
      }
    }, logger);
  }
}

/**
 * 汎用監査ログ記録 (旧audit_logsスキーマ互換)
 * 新しいservice_role_auditと既存audit_logsの橋渡し
 */
interface AuditLogEntry {
  operation_type: string;
  table_name: string;
  function_name: string;
  user_id?: string;
  request_ip?: string;
  user_agent?: string;
  query_text?: string;
  row_count?: number;
  execution_time_ms: number;
  risk_level?: 'low' | 'medium' | 'high';
  additional_data?: Record<string, unknown>;
}

async function writeAuditLog(
  entry: AuditLogEntry,
  logger?: EdgeLogger
): Promise<void> {
  // 新しいservice_role_auditスキーマに変換して記録
  const serviceRoleEntry: ServiceRoleAuditEntry = {
    function_name: entry.function_name,
    actor: entry.user_id ? `user:${entry.user_id}` : 'system',
    resource: `table:${entry.table_name}`,
    row_count: entry.row_count || 0,
    latency_ms: entry.execution_time_ms,
    success: true, // エラー発生時は別途catchされることを想定
    payload: {
      operation_type: entry.operation_type,
      query_text: entry.query_text,
      risk_level: entry.risk_level,
      ...entry.additional_data
    },
    context: {
      client_ip: entry.request_ip,
      user_agent: entry.user_agent
    }
  };

  await writeServiceRoleAudit(serviceRoleEntry, logger);
}

/**
 * 高リスク操作の監査ログ
 * DELETE, UPDATE (大量), service_role使用等
 */
export async function auditHighRiskOperation(
  operation: {
    type: 'DELETE' | 'BULK_UPDATE' | 'BULK_INSERT' | 'SCHEMA_CHANGE';
    table: string;
    description: string;
    affectedRows?: number;
  },
  functionName: string,
  request: Request,
  user: AuthenticatedUser | null,
  logger: EdgeLogger
): Promise<void> {
  await writeAuditLog({
    operation_type: operation.type,
    table_name: operation.table,
    function_name: functionName,
    user_id: user?.id,
    request_ip: extractClientIp(request),
    user_agent: request.headers.get('user-agent') || undefined,
    query_text: operation.description,
    row_count: operation.affectedRows,
    execution_time_ms: 0, // 即座に記録
    risk_level: 'high',
    additional_data: {
      high_risk_operation: true,
      operation_description: operation.description,
    },
  }, logger);
}

/**
 * 組織ベースのセキュリティ監査
 * 組織外アクセス試行などの検出用
 */
export async function auditSecurityEvent(
  event: {
    type: 'UNAUTHORIZED_ACCESS' | 'INVALID_ORG_ACCESS' | 'SUSPICIOUS_ACTIVITY';
    description: string;
    severity: 'low' | 'medium' | 'high';
    organizationId?: string;
  },
  functionName: string,
  request: Request,
  user: AuthenticatedUser | null,
  logger: EdgeLogger
): Promise<void> {
  await writeAuditLog({
    operation_type: 'SECURITY_EVENT',
    table_name: 'security_audit',
    function_name: functionName,
    user_id: user?.id,
    request_ip: extractClientIp(request),
    user_agent: request.headers.get('user-agent') || undefined,
    query_text: `Security event: ${event.type}`,
    execution_time_ms: 0,
    risk_level: event.severity,
    additional_data: {
      security_event_type: event.type,
      description: event.description,
      organization_id: event.organizationId,
      timestamp: new Date().toISOString(),
    },
  }, logger);
}

// ============================================
// スキーマDiff機能との連携強化 (EPIC 3-7)
// ============================================

/**
 * スキーマ変更検知時の監査ログ記録
 * schema_diff_historyとの相関用
 */
export async function auditSchemaDiffDetected(
  diffData: {
    environment: string;
    diff_id: string;
    total_changes: number;
    severity: 'info' | 'warn' | 'error';
    schemas_affected: string[];
    change_summary: Record<string, number>;
    latest_migration?: string;
  },
  requestId: string,
  request: Request,
  logger: EdgeLogger
): Promise<void> {
  const entry: ServiceRoleAuditEntry = {
    function_name: 'nightly-schema-diff',
    actor: 'system:scheduled',
    request_id: requestId,
    trigger_type: 'SCHEDULED',
    trigger_source: 'pg_cron',
    resource: `schema:${diffData.environment}`,
    row_count: diffData.total_changes,
    latency_ms: 0, // Diff detection自体の実行時間は別途記録済み
    success: true,
    payload: {
      diff_id: diffData.diff_id,
      environment: diffData.environment,
      severity: diffData.severity,
      schemas_affected: diffData.schemas_affected,
      change_summary: diffData.change_summary,
      latest_migration: diffData.latest_migration
    },
    context: {
      audit_type: 'schema_diff_detected',
      client_ip: extractClientIp(request),
      user_agent: request.headers.get('user-agent')
    }
  };

  auditAsync(entry, logger);
}

/**
 * スキーマDiffアラート送信時の監査ログ記録
 */
export async function auditSchemaDiffAlertSent(
  alertData: {
    environment: string;
    diff_id: string;
    severity: 'info' | 'warn' | 'error';
    alert_channels: string[]; // ['slack', 'email', etc.]
    alert_success: boolean;
    alert_error?: string;
  },
  requestId: string,
  request: Request,
  logger: EdgeLogger
): Promise<void> {
  const entry: ServiceRoleAuditEntry = {
    function_name: 'nightly-schema-diff',
    actor: 'system:scheduled',
    request_id: requestId,
    trigger_type: 'SCHEDULED',
    trigger_source: 'pg_cron',
    resource: `schema_alert:${alertData.environment}`,
    row_count: 1,
    latency_ms: 0,
    success: alertData.alert_success,
    error_message: alertData.alert_error,
    payload: {
      diff_id: alertData.diff_id,
      environment: alertData.environment,
      severity: alertData.severity,
      alert_channels: alertData.alert_channels
    },
    context: {
      audit_type: 'schema_diff_alert_sent',
      client_ip: extractClientIp(request),
      user_agent: request.headers.get('user-agent')
    }
  };

  auditAsync(entry, logger);
}

/**
 * request_id相関による監査ログ検索ヘルパー
 * スキーマDiffからその他の関連処理まで追跡
 */
export async function getAuditTrail(
  requestId: string,
  logger?: EdgeLogger
): Promise<ServiceRoleAuditEntry[]> {
  const supabase = createServiceRoleClient();
  
  try {
    const { data, error } = await supabase
      .from('service_role_audit')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    logger?.info('Retrieved audit trail', {
      request_id: requestId,
      entries_count: data?.length || 0
    });

    return data || [];
  } catch (error) {
    logger?.error('Failed to retrieve audit trail', {
      request_id: requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return [];
  }
}

/**
 * 観測性ダッシュボード用の統合監査サマリー取得
 * 複数の観測性機能（schema diff, job runs, contract violations等）の統合ビュー
 */
export async function getObservabilityAuditSummary(
  timeRangeHours: number = 24,
  environment?: string,
  logger?: EdgeLogger
): Promise<{
  schema_diffs: number;
  job_failures: number;
  contract_violations: number;
  rls_denials: number;
  high_risk_operations: number;
  total_events: number;
}> {
  const supabase = createServiceRoleClient();
  
  try {
    const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000).toISOString();
    
    let query = supabase
      .from('service_role_audit')
      .select('function_name, success, context')
      .gte('created_at', since);
    
    if (environment) {
      query = query.or(
        `payload->>'environment'.eq.${environment},context->>'environment'.eq.${environment}`
      );
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }

    const summary = {
      schema_diffs: 0,
      job_failures: 0,
      contract_violations: 0,
      rls_denials: 0,
      high_risk_operations: 0,
      total_events: data?.length || 0
    };

    for (const entry of data || []) {
      if (entry.function_name === 'nightly-schema-diff') {
        summary.schema_diffs++;
      }
      
      if (entry.function_name?.includes('job') && !entry.success) {
        summary.job_failures++;
      }
      
      if (entry.context?.audit_type === 'contract_violation') {
        summary.contract_violations++;
      }
      
      if (entry.context?.audit_type === 'rls_denied') {
        summary.rls_denials++;
      }
      
      if (entry.context?.risk_level === 'high') {
        summary.high_risk_operations++;
      }
    }

    logger?.info('Retrieved observability audit summary', {
      time_range_hours: timeRangeHours,
      environment,
      summary
    });

    return summary;
  } catch (error) {
    logger?.error('Failed to retrieve observability audit summary', {
      time_range_hours: timeRangeHours,
      environment,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // エラー時はゼロ値を返す
    return {
      schema_diffs: 0,
      job_failures: 0,
      contract_violations: 0,
      rls_denials: 0,
      high_risk_operations: 0,
      total_events: 0
    };
  }
}