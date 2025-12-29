/**
 * 監査ログ送出モジュール
 *
 * 【責務】
 * - 操作監査ログの統一インターフェース
 * - DB の SECURITY DEFINER 関数への委譲
 *
 * 【実装状況】2024-12-25
 * - 推奨: auditLogWriteRPC() → audit_log_write RPC（SECURITY DEFINER）
 * - フォールバック: auditLogWrite() → ops_audit_simple テーブル直接挿入
 * - RPC は admin_audit_logs テーブルに記録（INSERT-only, site_admins読取専用）
 */

import { createClient } from '@/lib/supabase/server'

interface AuditLogInput {
  action: string
  entity_type?: string
  entity_id?: string
  context?: Record<string, unknown>
  diff?: Record<string, unknown>
}

/**
 * 監査ログを記録（サーバー側専用）
 */
export async function auditLogWrite(input: AuditLogInput): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // 現在のユーザーを取得
    const { data: { user } } = await supabase.auth.getUser()

    // 暫定: ops_audit_simple へ挿入
    const { error } = await supabase.from('ops_audit_simple').insert({
      action: input.action,
      endpoint: 'app',
      reason: 'client-action',
      actor_id: user?.id ?? null,
      entity_kind: input.entity_type ?? null,
      entity_ids: input.entity_id ? [input.entity_id] : null,
    })

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[auditLogWrite] Insert error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[auditLogWrite] Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * 監査ログを記録（RPC版、推奨）
 * - SECURITY DEFINER により auth.uid() を自動採用
 * - admin_audit_logs テーブルに記録
 * - RPC未存在時は auditLogWrite() にフォールバック
 */
export async function auditLogWriteRPC(input: AuditLogInput): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.rpc('audit_log_write', {
      action: input.action,
      entity_type: input.entity_type ?? null,
      entity_id: input.entity_id ?? null,
      context: input.context ?? null,
      diff: input.diff ?? null,
    })

    if (error) {
      // RPC が存在しない場合はフォールバック
      if (error.code === '42883') {
        return auditLogWrite(input)
      }
      // eslint-disable-next-line no-console
      console.error('[auditLogWriteRPC] RPC error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[auditLogWriteRPC] Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
