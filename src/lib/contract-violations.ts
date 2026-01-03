/**
 * Data Contract 違反検知・記録ユーティリティ (Next.js用)
 * EPIC 3-4: contract_violations テーブルへの安全な INSERT
 *
 * Edge Functions版と仕様統一:
 * - service_role 経由のみ INSERT
 * - payload の匿名化必須
 * - request_id の統一生成
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

/**
 * Data Contract 違反タイプ (Edge Functions版と統一)
 */
export type ViolationType = 
  | 'INVALID_ENUM'
  | 'NULL_NOT_ALLOWED' 
  | 'LENGTH_OVER'
  | 'FORMAT_INVALID'
  | 'RANGE_VIOLATION'
  | 'TYPE_MISMATCH'
  | 'UNIQUE_VIOLATION'
  | 'FK_VIOLATION'
  | 'CHECK_CONSTRAINT'
  | 'PAYLOAD_MALFORMED'
  | 'REQUIRED_FIELD_MISSING'
  | 'DUPLICATE_REQUEST'
  | 'BUSINESS_RULE_VIOLATION'
  | 'UNSUPPORTED_VALUE'
  | 'JSON_SCHEMA_VIOLATION';

/**
 * Data Contract 違反ソース 
 */
export type ViolationSource = 
  | 'api' 
  | 'edge' 
  | 'job' 
  | 'ui' 
  | 'batch' 
  | 'webhook' 
  | 'sync' 
  | 'import' 
  | 'export' 
  | 'cron' 
  | 'partner_api';

/**
 * Contract 違反エントリ (Next.js用)
 */
export interface ContractViolationEntry {
  source: ViolationSource;
  endpoint: string;
  table_name: string;
  column_name: string;
  violation_type: ViolationType;
  payload: Record<string, unknown>;
  request_id: string;
  severity?: 'error' | 'warn';
  function_name?: string;
  user_id?: string;
  session_id?: string;
  error_code?: string;
  error_message?: string;
  context?: Record<string, unknown>;
}

/**
 * payload の匿名化 (PII/Secrets除去)
 * Edge Functions版の sanitizePayload と同等の処理
 */
function sanitizePayload(payload: any): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const sensitivePatterns = [
    'password', 'token', 'secret', 'key', 'jwt', 'authorization',
    'email', 'phone', 'address', 'name', 'fullname', 'firstname', 'lastname',
    'card', 'credit', 'pan', 'cvv', 'bank', 'account',
    'oauth', 'api_key', 'cookie', 'session',
    'social_security', 'ssn', 'passport', 'license'
  ];

  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();
    
    const isSensitive = sensitivePatterns.some(pattern => 
      lowerKey.includes(pattern)
    );
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value);
    } else if (typeof value === 'string') {
      // IP アドレスを /24 でマスク
      const ipv4Regex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
      const maskedValue = value.replace(ipv4Regex, (ip) => {
        const parts = ip.split('.');
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      });
      
      // JWT っぽい文字列を検出
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
 * request_id を取得または生成 (Edge Functions版と統一)
 */
function getOrGenerateRequestId(request: Request): string {
  const headers = request.headers;
  const existingId = headers.get('x-request-id') || headers.get('request-id');
  return existingId || crypto.randomUUID();
}

/**
 * service_role クライアント作成
 */
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Data Contract 違反を記録
 */
export async function recordContractViolation(
  entry: ContractViolationEntry
): Promise<{ success: boolean; violation_id?: string; error?: string }> {
  const supabase = createServiceRoleClient();
  
  try {
    // payload/context の匿名化
    const sanitizedPayload = sanitizePayload(entry.payload);
    const sanitizedContext = entry.context ? sanitizePayload(entry.context) : null;

    const violationRecord = {
      source: entry.source,
      endpoint: entry.endpoint,
      table_name: entry.table_name,
      column_name: entry.column_name,
      violation_type: entry.violation_type,
      payload: sanitizedPayload,
      request_id: entry.request_id,
      severity: entry.severity || 'error',
      function_name: entry.function_name,
      user_id: entry.user_id,
      session_id: entry.session_id,
      error_code: entry.error_code,
      error_message: entry.error_message ? entry.error_message.slice(0, 1000) : null,
      context: sanitizedContext
    };

    const { data, error } = await supabase
      .from('contract_violations')
      .insert(violationRecord)
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to record contract violation', {
        data: {
          error: error.message,
          endpoint: entry.endpoint,
          violation_type: entry.violation_type
        }
      });
      return { success: false, error: error.message };
    }

    logger.info('Contract violation recorded', {
      data: {
        violation_id: data.id,
        endpoint: entry.endpoint,
        violation_type: entry.violation_type,
        table_name: entry.table_name
      }
    });

    return { success: true, violation_id: data.id };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Exception recording contract violation', {
      data: {
        error: errorMsg,
        endpoint: entry.endpoint
      }
    });
    return { success: false, error: errorMsg };
  }
}

/**
 * バリデーション失敗時のヘルパー関数群 (Next.js用)
 */
export const ContractViolationHelpers = {
  /**
   * Zod バリデーション失敗時
   */
  fromZodError: (
    zodError: any,
    endpoint: string,
    tableName: string,
    request: Request,
    source: ViolationSource = 'api'
  ): ContractViolationEntry => ({
    source,
    endpoint,
    table_name: tableName,
    column_name: zodError.path?.[0] || 'unknown',
    violation_type: 'JSON_SCHEMA_VIOLATION',
    payload: {
      validation_errors: zodError.errors?.slice(0, 5)?.map((err: any) => ({
        path: err.path?.join('.'),
        code: err.code,
        message: err.message?.slice(0, 200)
      })),
      error_count: zodError.errors?.length || 0
    },
    request_id: getOrGenerateRequestId(request),
    severity: 'error',
    error_message: `Validation failed: ${zodError.errors?.length || 0} errors`
  }),

  /**
   * PostgreSQL制約エラー時
   */
  fromPgError: (
    pgError: any,
    endpoint: string,
    tableName: string,
    request: Request,
    source: ViolationSource = 'api'
  ): ContractViolationEntry => {
    let violationType: ViolationType = 'CHECK_CONSTRAINT';
    
    switch (pgError.code) {
      case '23505': violationType = 'UNIQUE_VIOLATION'; break;
      case '23503': violationType = 'FK_VIOLATION'; break;
      case '23502': violationType = 'NULL_NOT_ALLOWED'; break;
      case '22001': violationType = 'LENGTH_OVER'; break;
      case '22007': violationType = 'FORMAT_INVALID'; break;
      case '22003': violationType = 'RANGE_VIOLATION'; break;
      default: violationType = 'CHECK_CONSTRAINT';
    }

    return {
      source,
      endpoint,
      table_name: tableName,
      column_name: pgError.column || pgError.constraint || 'unknown',
      violation_type: violationType,
      payload: {
        sqlstate: pgError.code,
        pg_detail: pgError.detail?.slice(0, 300),
        constraint_name: pgError.constraint
      },
      request_id: getOrGenerateRequestId(request),
      severity: 'error',
      error_code: pgError.code,
      error_message: pgError.message?.slice(0, 500)
    };
  }
};

/**
 * 非同期でContract違反を記録 (レスポンスをブロックしない)
 */
export function recordContractViolationAsync(entry: ContractViolationEntry): void {
  Promise.resolve().then(() =>
    recordContractViolation(entry)
  ).catch(error => {
    logger.error('Failed to record contract violation async', {
      data: {
        error: error.message,
        endpoint: entry.endpoint,
        violation_type: entry.violation_type
      }
    });
  });
}