/**
 * 監査ログ送出モジュール（クライアント用）
 *
 * 【責務】
 * - クライアントコンポーネントからの監査ログ送出
 * - /api/ops_audit_simple エンドポイント経由
 *
 * 【使用場所】
 * - DashboardPageShell
 * - その他 'use client' コンポーネント
 *
 * 【注意】
 * - サーバーサイド（Route Handler, Server Component）では
 *   audit-logger.ts の auditLogWrite/auditLogWriteRPC を使用
 */

'use client';

interface ClientAuditLogInput {
  action: string
  endpoint?: string
  request_id?: string
  reason?: string
  status?: 'success' | 'error' | 'denied'
  entity_type?: string
  entity_id?: string
}

/**
 * 監査ログを記録（クライアント側用）
 * /api/ops_audit_simple API を呼び出し
 *
 * @param input - 監査ログ入力
 * @returns 成功/失敗
 */
export async function auditLogWriteClient(
  input: ClientAuditLogInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/ops_audit_simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: input.action,
        endpoint: input.endpoint ?? (typeof window !== 'undefined' ? window.location.pathname : ''),
        request_id: input.request_id,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        reason: input.reason,
        status: input.status ?? 'success',
        entity_kind: input.entity_type,
        entity_id: input.entity_id,
      }),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (err) {
    // 監査ログ送信失敗はUXに影響させない（サイレント）
    // eslint-disable-next-line no-console
    console.error('[auditLogWriteClient] Error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
