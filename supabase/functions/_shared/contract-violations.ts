/**
 * Data Contract 違反検知・記録ユーティリティ
 * EPIC 3-4: contract_violations テーブルへの安全な INSERT
 * 
 * Supabase 確定仕様準拠:
 * - ENUM型名: public.contract_violation_type
 * - service_role 経由のみ INSERT
 * - payload の匿名化必須（PII/Secrets禁止）
 * - request_id は既存audit/idempotencyと統一
 * - 記録タイミング: バリデで弾いた後
 */

import { createServiceRoleClient } from './supabase.ts';
import { type EdgeLogger } from './logging.ts';
import { sanitizePayload } from './audit.ts';
import { getOrGenerateRequestId } from './logging.ts';

/**
 * Data Contract 違反タイプ (public.contract_violation_type ENUM準拠)
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
 * Data Contract 違反ソース (確定済みリスト)
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
 * 重要度レベル
 */
export type SeverityLevel = 'error' | 'warn';

/**
 * Contract 違反エントリ (必須カラム準拠)
 */
export interface ContractViolationEntry {
  // 必須カラム
  source: ViolationSource;
  endpoint: string;
  table_name: string;
  column_name: string;
  violation_type: ViolationType;
  payload: Record<string, unknown>;
  request_id: string;
  
  // オプショナルカラム (推奨)
  severity?: SeverityLevel;
  function_name?: string;
  user_id?: string;
  session_id?: string;
  actor?: string;
  resource?: string;
  git_commit_hash?: string;
  error_code?: string;
  error_message?: string;
  context?: Record<string, unknown>;
}

/**
 * Contract 違反記録結果
 */
export interface ContractViolationResult {
  success: boolean;
  violation_id?: string;
  error?: string;
}

/**
 * Data Contract 違反の統一記録ヘルパ
 * service_role 経由で安全に INSERT
 */
export async function recordContractViolation(
  entry: ContractViolationEntry,
  logger?: EdgeLogger
): Promise<ContractViolationResult> {
  const supabase = createServiceRoleClient();
  
  try {
    // 1. 必須フィールド検証
    const validationError = validateContractViolationEntry(entry);
    if (validationError) {
      logger?.error('Contract violation validation failed', { 
        error: validationError,
        endpoint: entry.endpoint 
      });
      return { success: false, error: validationError };
    }

    // 2. payload/context の匿名化 (PII/Secrets除去)
    const sanitizedPayload = sanitizePayload(entry.payload);
    const sanitizedContext = entry.context ? sanitizePayload(entry.context) : null;

    // 3. レコード作成
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
      actor: entry.actor,
      resource: entry.resource,
      git_commit_hash: entry.git_commit_hash,
      error_code: entry.error_code,
      error_message: entry.error_message ? entry.error_message.slice(0, 1000) : null, // 1000文字制限
      context: sanitizedContext
    };

    // 4. service_role 経由で INSERT
    const { data, error } = await supabase
      .from('contract_violations')
      .insert(violationRecord)
      .select('id')
      .single();

    if (error) {
      logger?.error('Failed to record contract violation', {
        error: error.message,
        endpoint: entry.endpoint,
        violation_type: entry.violation_type,
        table_name: entry.table_name
      });
      return { success: false, error: error.message };
    }

    logger?.info('Contract violation recorded', {
      violation_id: data.id,
      endpoint: entry.endpoint,
      violation_type: entry.violation_type,
      table_name: entry.table_name,
      column_name: entry.column_name
    });

    return { success: true, violation_id: data.id };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger?.error('Exception recording contract violation', {
      error: errorMsg,
      endpoint: entry.endpoint,
      violation_type: entry.violation_type
    });
    return { success: false, error: errorMsg };
  }
}

/**
 * Contract 違反エントリの必須フィールド検証
 */
function validateContractViolationEntry(entry: ContractViolationEntry): string | null {
  if (!entry.source) return 'source is required';
  if (!entry.endpoint) return 'endpoint is required';
  if (!entry.table_name) return 'table_name is required';
  if (!entry.column_name) return 'column_name is required';
  if (!entry.violation_type) return 'violation_type is required';
  if (!entry.request_id) return 'request_id is required';
  
  // violation_type ENUM バリデーション
  const validViolationTypes: ViolationType[] = [
    'INVALID_ENUM', 'NULL_NOT_ALLOWED', 'LENGTH_OVER', 'FORMAT_INVALID',
    'RANGE_VIOLATION', 'TYPE_MISMATCH', 'UNIQUE_VIOLATION', 'FK_VIOLATION',
    'CHECK_CONSTRAINT', 'PAYLOAD_MALFORMED', 'REQUIRED_FIELD_MISSING',
    'DUPLICATE_REQUEST', 'BUSINESS_RULE_VIOLATION', 'UNSUPPORTED_VALUE',
    'JSON_SCHEMA_VIOLATION'
  ];
  
  if (!validViolationTypes.includes(entry.violation_type)) {
    return `Invalid violation_type: ${entry.violation_type}`;
  }

  // source バリデーション
  const validSources: ViolationSource[] = [
    'api', 'edge', 'job', 'ui', 'batch', 'webhook', 
    'sync', 'import', 'export', 'cron', 'partner_api'
  ];
  
  if (!validSources.includes(entry.source)) {
    return `Invalid source: ${entry.source}`;
  }

  return null;
}

/**
 * バリデーション失敗時の便利ヘルパー関数群
 */
export const ContractViolationHelpers = {
  /**
   * Zod バリデーション失敗時の Contract 違反エントリ作成
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
   * PostgreSQL制約エラー時の Contract 違反エントリ作成
   */
  fromPgError: (
    pgError: any,
    endpoint: string,
    tableName: string,
    request: Request,
    source: ViolationSource = 'api'
  ): ContractViolationEntry => {
    let violationType: ViolationType = 'CHECK_CONSTRAINT';
    
    // SQLSTATEに基づく違反タイプ判定
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
        constraint_name: pgError.constraint,
        schema_name: pgError.schema
      },
      request_id: getOrGenerateRequestId(request),
      severity: 'error',
      error_code: pgError.code,
      error_message: pgError.message?.slice(0, 500)
    };
  },

  /**
   * カスタムビジネスルール違反時の Contract 違反エントリ作成
   */
  fromBusinessRule: (
    ruleName: string,
    fieldName: string,
    endpoint: string,
    tableName: string,
    request: Request,
    details: Record<string, unknown> = {},
    source: ViolationSource = 'api'
  ): ContractViolationEntry => ({
    source,
    endpoint,
    table_name: tableName,
    column_name: fieldName,
    violation_type: 'BUSINESS_RULE_VIOLATION',
    payload: {
      rule_name: ruleName,
      violated_field: fieldName,
      ...sanitizePayload(details)
    },
    request_id: getOrGenerateRequestId(request),
    severity: 'warn',
    error_message: `Business rule violation: ${ruleName}`
  }),

  /**
   * ENUM値不正時の Contract 違反エントリ作成
   */
  fromInvalidEnum: (
    enumField: string,
    invalidValue: string,
    validValues: string[],
    endpoint: string,
    tableName: string,
    request: Request,
    source: ViolationSource = 'api'
  ): ContractViolationEntry => ({
    source,
    endpoint,
    table_name: tableName,
    column_name: enumField,
    violation_type: 'INVALID_ENUM',
    payload: {
      invalid_value: invalidValue,
      valid_values: validValues.slice(0, 10), // 最大10件
      field_name: enumField
    },
    request_id: getOrGenerateRequestId(request),
    severity: 'error',
    error_message: `Invalid enum value '${invalidValue}' for field '${enumField}'`
  })
};

/**
 * 非同期でContract違反を記録 (レスポンスをブロックしない)
 */
export function recordContractViolationAsync(
  entry: ContractViolationEntry,
  logger?: EdgeLogger
): void {
  Promise.resolve().then(() => 
    recordContractViolation(entry, logger)
  ).catch(error => {
    logger?.error('Failed to record contract violation async', {
      error: error.message,
      endpoint: entry.endpoint,
      violation_type: entry.violation_type
    });
  });
}