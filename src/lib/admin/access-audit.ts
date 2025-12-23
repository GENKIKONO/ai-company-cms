/**
 * Admin Access Audit - アクセス監査ユーティリティ
 *
 * 管理UIからの操作を軽量に記録するためのプレースホルダ関数。
 * 将来的にはEdge FunctionまたはServer APIで永続化。
 *
 * 使用方法:
 * - 各管理ページのuseEffectでログイベントを発火
 * - フィルタ変更等の操作時にログを記録
 *
 * 環境変数:
 * - NEXT_PUBLIC_ADMIN_AUDIT_ENABLED: 'true'で有効化（デフォルト: false）
 */

export type AuditEventType =
  | 'page_view'
  | 'filter_change'
  | 'tab_switch'
  | 'data_export'
  | 'action_execute';

export interface AuditEvent {
  eventType: AuditEventType;
  page: string;
  action?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// フラグで有効/無効を切り替え
const isAuditEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return process.env.NEXT_PUBLIC_ADMIN_AUDIT_ENABLED === 'true';
};

// イベントバッファ（バッチ送信用）
let eventBuffer: AuditEvent[] = [];
const BUFFER_FLUSH_INTERVAL = 30000; // 30秒
const BUFFER_MAX_SIZE = 20;

// バッファフラッシュタイマー
let flushTimer: NodeJS.Timeout | null = null;

/**
 * 監査イベントを記録
 *
 * @param eventType イベント種別
 * @param page ページパス
 * @param action 実行アクション（任意）
 * @param metadata 追加メタデータ（任意）
 */
export function logAuditEvent(
  eventType: AuditEventType,
  page: string,
  action?: string,
  metadata?: Record<string, unknown>
): void {
  if (!isAuditEnabled()) {
    // 無効時はコンソールにのみ出力（開発時のデバッグ用）
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Admin Audit - Disabled]', { eventType, page, action, metadata });
    }
    return;
  }

  const event: AuditEvent = {
    eventType,
    page,
    action,
    metadata,
    timestamp: new Date().toISOString(),
  };

  eventBuffer.push(event);

  // バッファサイズ上限でフラッシュ
  if (eventBuffer.length >= BUFFER_MAX_SIZE) {
    flushEventBuffer();
  }

  // タイマーがなければ設定
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushEventBuffer();
    }, BUFFER_FLUSH_INTERVAL);
  }
}

/**
 * イベントバッファをフラッシュ（サーバーに送信）
 *
 * TODO: 実際のAPI実装時に置き換え
 */
async function flushEventBuffer(): Promise<void> {
  if (eventBuffer.length === 0) return;

  const eventsToSend = [...eventBuffer];
  eventBuffer = [];

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  try {
    // TODO: 実際のAPI実装
    // await fetch('/api/admin/audit-log', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ events: eventsToSend }),
    // });

    // プレースホルダ: コンソールに出力
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Admin Audit] Flushing events:', eventsToSend);
    }
  } catch (error) {
    // エラー時はバッファに戻す（次回再試行）
    eventBuffer = [...eventsToSend, ...eventBuffer].slice(0, BUFFER_MAX_SIZE * 2);
    console.error('[Admin Audit] Failed to flush events:', error);
  }
}

/**
 * ページビューを記録するヘルパー
 */
export function logPageView(page: string, metadata?: Record<string, unknown>): void {
  logAuditEvent('page_view', page, undefined, metadata);
}

/**
 * フィルタ変更を記録するヘルパー
 */
export function logFilterChange(
  page: string,
  filterName: string,
  filterValue: string
): void {
  logAuditEvent('filter_change', page, filterName, { value: filterValue });
}

/**
 * タブ切り替えを記録するヘルパー
 */
export function logTabSwitch(page: string, tabName: string): void {
  logAuditEvent('tab_switch', page, tabName);
}

/**
 * クリーンアップ（ページアンマウント時に呼び出し）
 */
export function cleanupAudit(): void {
  if (eventBuffer.length > 0) {
    flushEventBuffer();
  }
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

/**
 * React Hook: ページビュー自動記録
 *
 * 使用例:
 * ```
 * useAdminPageAudit('/dashboard/admin/jobs');
 * ```
 */
export function useAdminPageAudit(page: string): void {
  if (typeof window === 'undefined') return;

  // マウント時にページビューを記録
  // Note: 実際のReact Hookとして使用する場合はuseEffectでラップ
  logPageView(page);
}
