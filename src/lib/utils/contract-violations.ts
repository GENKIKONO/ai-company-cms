/**
 * Contract Violations ログユーティリティ
 * API契約違反を検出・記録するためのユーティリティ
 * 
 * Supabase 側の admin.contract_violations テーブル構造に準拠
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

// Supabase admin.violation_type enum に対応
export type ViolationType = 
  | 'INVALID_ENUM'
  | 'NULL_NOT_ALLOWED'
  | 'LENGTH_OVER'
  | 'FORMAT_INVALID'
  | 'RANGE_INVALID'
  | 'FOREIGN_KEY_MISSING'
  | 'OTHER'

export type ContractViolationSource = 'api' | 'edge' | 'job' | 'ui'

export interface ContractViolationData {
  source: ContractViolationSource
  endpoint: string                // '/api/my/interview/session' など
  table_name: string              // 'ai_interview_sessions' など
  column_name: string             // 'content_type' など  
  violation_type: ViolationType   // 'INVALID_ENUM' など
  payload: unknown                // 実際の入力データ（マスク済み推奨）
  request_id?: string             // 相関ID（service_role_auditと突合用）
  actor_user_id?: string          // ログインユーザーID
  actor_org_id?: string           // 対象組織ID
  client_ip?: string              // クライアントIP
}

// 後方互換性のためのレガシー型（内部使用のみ）
interface LegacyContractViolationData {
  endpoint: string
  table?: string
  column?: string
  expectedType?: string
  actualValue: unknown
  payload?: Record<string, unknown>
}

/**
 * Contract違反をSupabaseの admin.contract_violations テーブルに記録
 * テーブルが存在しない場合はloggerにのみ記録
 * 
 * @param data Contract violation data (新仕様)
 */
export async function logContractViolation(data: ContractViolationData): Promise<void> {
  try {
    const supabase = await createClient()
    
    // Payload サイズ制御（64KB上限）
    const trimmedPayload = trimPayloadSize(data.payload, 64 * 1024)
    
    // admin.contract_violations テーブルへの挿入を試行
    // 注意: スキーマ設定によっては .from('admin.contract_violations') に変更が必要
    const { error } = await supabase
      .from('contract_violations')  // TODO: admin スキーマが公開されている場合は 'admin.contract_violations'
      .insert({
        source: data.source,
        endpoint: data.endpoint,
        table_name: data.table_name,
        column_name: data.column_name,
        violation_type: data.violation_type,
        payload: trimmedPayload,
        request_id: data.request_id || null,
        actor_user_id: data.actor_user_id || null,
        actor_org_id: data.actor_org_id || null,
        client_ip: data.client_ip || null
      })

    if (error) {
      // テーブルが存在しない場合やその他のDB エラー時はloggerに記録
      logger.error('Failed to log contract violation to database', error, {
        contractViolation: data
      })
    } else {
      logger.warn('Contract violation logged to database', data, {
        source: data.source,
        endpoint: data.endpoint,
        table: data.table_name,
        column: data.column_name,
        violationType: data.violation_type
      })
    }
  } catch (error) {
    // DB接続エラーなどの場合はloggerにフォールバック
    logger.error('Contract violation logging failed', error, {
      contractViolation: data
    })
  }
}

/**
 * payload のサイズを制限する（64KB想定）
 * 超過時は要約化してサイズを削減
 */
function trimPayloadSize(payload: unknown, maxBytes: number): unknown {
  if (payload === null || payload === undefined) {
    return payload
  }
  
  const payloadString = JSON.stringify(payload)
  
  if (payloadString.length <= maxBytes) {
    return payload
  }
  
  // サイズ超過時は要約化
  const truncated = payloadString.slice(0, maxBytes - 100) // バッファを残す
  try {
    // JSON として valid になるよう調整
    return JSON.parse(truncated + '"}')
  } catch {
    // パース失敗時は文字列として保存
    return {
      __truncated: true,
      __original_size: payloadString.length,
      data: truncated
    }
  }
}

/**
 * レガシー形式から新仕様への変換ヘルパー
 * 既存コードの段階的移行用
 */
function convertLegacyData(
  legacy: LegacyContractViolationData, 
  source: ContractViolationSource = 'api'
): ContractViolationData {
  return {
    source,
    endpoint: legacy.endpoint,
    table_name: legacy.table || 'unknown',
    column_name: legacy.column || 'unknown',
    violation_type: 'OTHER', // レガシー形式では特定不可
    payload: {
      expectedType: legacy.expectedType,
      actualValue: legacy.actualValue,
      ...legacy.payload
    }
  }
}

/**
 * 型安全なenum検証ヘルパー
 * 値がvalidValuesに含まれているかチェックし、違反時は自動でログ記録
 * 
 * @param value - 検証対象の値
 * @param validValues - 有効な値の配列
 * @param context - 違反時のログ情報（新仕様 or レガシー）
 * @returns 値が有効な場合はtrue、無効な場合はfalse
 */
export function validateEnum<T extends readonly string[]>(
  value: unknown,
  validValues: T,
  context: ContractViolationContext
): value is T[number] {
  if (typeof value === 'string' && validValues.includes(value as T[number])) {
    return true
  }
  
  // 新仕様での違反ログ記録
  if ('source' in context) {
    logContractViolation({
      ...context,
      violation_type: 'INVALID_ENUM',
      payload: {
        expectedValues: validValues,
        actualValue: value
      }
    }).catch(error => {
      logger.error('Failed to log enum validation violation', error)
    })
  } else {
    // レガシー形式のサポート（段階移行用）
    const converted = convertLegacyData({
      ...context,
      actualValue: value,
      expectedType: validValues.join(' | ')
    })
    
    logContractViolation({
      ...converted,
      violation_type: 'INVALID_ENUM'
    }).catch(error => {
      logger.error('Failed to log enum validation violation', error)
    })
  }
  
  return false
}

// 型ヘルパー: 新仕様 or レガシーのいずれかを受け入れ
type ContractViolationContext = 
  | Omit<ContractViolationData, 'violation_type' | 'payload'>
  | Omit<LegacyContractViolationData, 'actualValue'>

/**
 * 配列型の検証ヘルパー
 * 
 * @param value - 検証対象の値
 * @param context - 違反時のログ情報
 * @returns 値が配列の場合はtrue、そうでなければfalse
 */
export function validateArray(
  value: unknown,
  context: ContractViolationContext
): value is unknown[] {
  if (Array.isArray(value)) {
    return true
  }
  
  if ('source' in context) {
    logContractViolation({
      ...context,
      violation_type: 'FORMAT_INVALID',
      payload: {
        expectedType: 'array',
        actualValue: value
      }
    }).catch(error => {
      logger.error('Failed to log array validation violation', error)
    })
  } else {
    const converted = convertLegacyData({
      ...context,
      actualValue: value,
      expectedType: 'array'
    })
    
    logContractViolation({
      ...converted,
      violation_type: 'FORMAT_INVALID'
    }).catch(error => {
      logger.error('Failed to log array validation violation', error)
    })
  }
  
  return false
}

/**
 * 文字列型の検証ヘルパー
 * 
 * @param value - 検証対象の値
 * @param context - 違反時のログ情報
 * @param options - 文字列の制約（長さ等）
 * @returns 値が有効な文字列の場合はtrue、そうでなければfalse
 */
export function validateString(
  value: unknown,
  context: ContractViolationContext,
  options?: { minLength?: number; maxLength?: number }
): value is string {
  if (typeof value !== 'string') {
    if ('source' in context) {
      logContractViolation({
        ...context,
        violation_type: 'FORMAT_INVALID',
        payload: {
          expectedType: 'string',
          actualValue: value
        }
      }).catch(error => {
        logger.error('Failed to log string type validation violation', error)
      })
    } else {
      const converted = convertLegacyData({
        ...context,
        actualValue: value,
        expectedType: 'string'
      })
      
      logContractViolation({
        ...converted,
        violation_type: 'FORMAT_INVALID'
      }).catch(error => {
        logger.error('Failed to log string type validation violation', error)
      })
    }
    return false
  }
  
  // 最小長チェック
  if (options?.minLength && value.length < options.minLength) {
    if ('source' in context) {
      logContractViolation({
        ...context,
        violation_type: 'LENGTH_OVER',
        payload: {
          expectedMinLength: options.minLength,
          actualLength: value.length,
          actualValue: value
        }
      }).catch(error => {
        logger.error('Failed to log string length validation violation', error)
      })
    } else {
      const converted = convertLegacyData({
        ...context,
        actualValue: value,
        expectedType: `string (min length: ${options.minLength})`
      })
      
      logContractViolation({
        ...converted,
        violation_type: 'LENGTH_OVER'
      }).catch(error => {
        logger.error('Failed to log string length validation violation', error)
      })
    }
    return false
  }
  
  // 最大長チェック
  if (options?.maxLength && value.length > options.maxLength) {
    if ('source' in context) {
      logContractViolation({
        ...context,
        violation_type: 'LENGTH_OVER',
        payload: {
          expectedMaxLength: options.maxLength,
          actualLength: value.length,
          actualValue: value.substring(0, 100) + '...' // 長すぎる値は truncate
        }
      }).catch(error => {
        logger.error('Failed to log string length validation violation', error)
      })
    } else {
      const converted = convertLegacyData({
        ...context,
        actualValue: value,
        expectedType: `string (max length: ${options.maxLength})`
      })
      
      logContractViolation({
        ...converted,
        violation_type: 'LENGTH_OVER'
      }).catch(error => {
        logger.error('Failed to log string length validation violation', error)
      })
    }
    return false
  }
  
  return true
}

/**
 * UUID形式の検証ヘルパー
 * 
 * @param value - 検証対象の値
 * @param context - 違反時のログ情報
 * @returns 値が有効なUUIDの場合はtrue、そうでなければfalse
 */
export function validateUUID(
  value: unknown,
  context: ContractViolationContext
): value is string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  
  if (typeof value === 'string' && uuidRegex.test(value)) {
    return true
  }
  
  if ('source' in context) {
    logContractViolation({
      ...context,
      violation_type: 'FORMAT_INVALID',
      payload: {
        expectedType: 'UUID',
        actualValue: value
      }
    }).catch(error => {
      logger.error('Failed to log UUID validation violation', error)
    })
  } else {
    const converted = convertLegacyData({
      ...context,
      actualValue: value,
      expectedType: 'UUID'
    })
    
    logContractViolation({
      ...converted,
      violation_type: 'FORMAT_INVALID'
    }).catch(error => {
      logger.error('Failed to log UUID validation violation', error)
    })
  }
  
  return false
}

/**
 * 複数フィールドの一括検証ヘルパー
 * 
 * @param data - 検証対象のデータ
 * @param validations - フィールドごとの検証ルール
 * @param context - 違反時の共通コンテキスト
 * @returns すべてのフィールドが有効な場合はtrue
 */
export async function validateFields(
  data: Record<string, unknown>,
  validations: Array<{
    field: string
    validator: (value: unknown) => boolean
    required?: boolean
  }>,
  context: Omit<ContractViolationData, 'violation_type' | 'payload' | 'column_name'>
): Promise<boolean> {
  let allValid = true
  
  for (const validation of validations) {
    const value = data[validation.field]
    
    if (validation.required && (value === undefined || value === null)) {
      await logContractViolation({
        ...context,
        column_name: validation.field,
        violation_type: 'NULL_NOT_ALLOWED',
        payload: {
          expectedType: 'required field',
          actualValue: value
        }
      })
      allValid = false
      continue
    }
    
    if (value !== undefined && value !== null && !validation.validator(value)) {
      allValid = false
      // 個別のvalidatorがログ記録を行う想定
    }
  }
  
  return allValid
}