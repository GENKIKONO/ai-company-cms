/**
 * DB依存RPC安全ラッパ
 *
 * 【目的】
 * 要件定義で規定されているがDB側実装が未確認のRPCを安全に呼び出す。
 * 存在しない/権限で失敗しても致命傷にならない形にする。
 *
 * 【対象RPC】
 * - get_current_plan(subject_type, subject_id) - Subject型プラン取得
 * - audit_log_write(...) - 監査ログ書き込み
 * - analytics_event_write(...) - 分析イベント書き込み
 * - feature_flags / feature_overrides 関連
 *
 * 【方針】
 * - RPC存在が前提の直叩きをしない
 * - 存在しない場合は null / disabled 扱いで安全に失敗
 * - ログは安全に握りつぶす（開発時のみ console.warn）
 *
 * 【DB担当への確認依頼】
 * docs/db/requirements-missing-rpc-check.md を参照
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Subject } from '@/lib/featureGate'

// =============================================================================
// Types
// =============================================================================

export interface CurrentPlanResult {
  plan_id: string | null
  plan_key: string | null
  plan_meta: Record<string, unknown> | null
}

export interface AuditLogEntry {
  action: string
  entity_type: string
  entity_id: string
  context?: Record<string, unknown>
  diff?: Record<string, unknown>
}

export interface AnalyticsEvent {
  event_key: string
  properties?: Record<string, unknown>
  context?: Record<string, unknown>
}

export interface FeatureFlagResult {
  feature_key: string
  is_enabled: boolean
  override_config?: Record<string, unknown>
}

// =============================================================================
// get_current_plan (Subject型)
// =============================================================================

/**
 * Subject型でプランを取得（DB未確認のため安全にフォールバック）
 *
 * @returns プラン情報、取得できない場合は null
 */
export async function getCurrentPlanSafe(
  supabase: SupabaseClient,
  subject: Subject
): Promise<CurrentPlanResult | null> {
  try {
    // 新RPC (Subject型) を試行
    const { data, error } = await supabase.rpc('get_current_plan', {
      subject_type: subject.type,
      subject_id: subject.id,
    })

    if (error) {
      // RPC未存在 (42883) または権限エラーは null で返す
      if (error.code === '42883') {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('[db-safe-wrappers] get_current_plan RPC not found, returning null')
        }
        return null
      }
      // その他のエラーも安全に null で返す
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[db-safe-wrappers] get_current_plan error:', error.message)
      }
      return null
    }

    // 成功時
    if (typeof data === 'object' && data !== null) {
      return {
        plan_id: data.plan_id ?? null,
        plan_key: data.plan_key ?? null,
        plan_meta: data.plan_meta ?? null,
      }
    }

    return null
  } catch {
    // 予期せぬエラーも安全に握りつぶす
    return null
  }
}

// =============================================================================
// audit_log_write
// =============================================================================

/**
 * 監査ログを書き込み（DB未確認のため安全にフォールバック）
 *
 * @returns 成功時 true、失敗時 false（致命傷にしない）
 */
export async function auditLogWriteSafe(
  supabase: SupabaseClient,
  entry: AuditLogEntry
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('audit_log_write', {
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      context: entry.context ?? null,
      diff: entry.diff ?? null,
    })

    if (error) {
      if (error.code === '42883') {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('[db-safe-wrappers] audit_log_write RPC not found')
        }
        return false
      }
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[db-safe-wrappers] audit_log_write error:', error.message)
      }
      return false
    }

    return true
  } catch {
    return false
  }
}

// =============================================================================
// analytics_event_write
// =============================================================================

/**
 * 分析イベントを書き込み（DB未確認のため安全にフォールバック）
 *
 * @returns 成功時 true、失敗時 false（致命傷にしない）
 */
export async function analyticsEventWriteSafe(
  supabase: SupabaseClient,
  event: AnalyticsEvent
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('analytics_event_write', {
      event_key: event.event_key,
      properties: event.properties ?? null,
      context: event.context ?? null,
    })

    if (error) {
      if (error.code === '42883') {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('[db-safe-wrappers] analytics_event_write RPC not found')
        }
        return false
      }
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[db-safe-wrappers] analytics_event_write error:', error.message)
      }
      return false
    }

    return true
  } catch {
    return false
  }
}

// =============================================================================
// feature_flags / feature_overrides
// =============================================================================

/**
 * 機能フラグを取得（DB未確認のため安全にフォールバック）
 *
 * @returns フラグ一覧、取得できない場合は空配列
 */
export async function getFeatureFlagsSafe(
  supabase: SupabaseClient,
  subject: Subject
): Promise<FeatureFlagResult[]> {
  try {
    // feature_flags テーブルを直接参照（RLSで保護されている前提）
    const { data, error } = await supabase
      .from('feature_flags')
      .select('feature_key, is_enabled')
      .eq('subject_type', subject.type)
      .eq('subject_id', subject.id)

    if (error) {
      // テーブル未存在 (42P01) または権限エラーは空配列で返す
      if (error.code === '42P01' || error.code === '42501') {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('[db-safe-wrappers] feature_flags table not found or no access')
        }
        return []
      }
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[db-safe-wrappers] feature_flags error:', error.message)
      }
      return []
    }

    return (data ?? []).map((row) => ({
      feature_key: row.feature_key,
      is_enabled: row.is_enabled ?? false,
    }))
  } catch {
    return []
  }
}

/**
 * 機能オーバーライドを取得（DB未確認のため安全にフォールバック）
 *
 * @returns オーバーライド設定、取得できない場合は null
 */
export async function getFeatureOverridesSafe(
  supabase: SupabaseClient,
  subject: Subject,
  featureKey: string
): Promise<Record<string, unknown> | null> {
  try {
    const { data, error } = await supabase
      .from('feature_overrides')
      .select('override_config')
      .eq('subject_type', subject.type)
      .eq('subject_id', subject.id)
      .eq('feature_key', featureKey)
      .maybeSingle()

    if (error) {
      if (error.code === '42P01' || error.code === '42501') {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('[db-safe-wrappers] feature_overrides table not found or no access')
        }
        return null
      }
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[db-safe-wrappers] feature_overrides error:', error.message)
      }
      return null
    }

    return (data?.override_config as Record<string, unknown>) ?? null
  } catch {
    return null
  }
}
