import { logger } from '@/lib/utils/logger';

// ================================
// WEBHOOK MONITORING UTILITIES
// ================================
// Webhook の健全性監視とアラート機能

// Webhook monitoring はサーバーサイドでのみ使用するため、動的インポートを使用
// import { supabaseAdmin } from '@/lib/supabase-admin-client';

export interface WebhookHealthMetrics {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  pendingRetries: number;
  successRate: number;
  avgProcessingTime: number;
  lastEventTime: string | null;
  oldestPendingEvent: string | null;
}

export interface WebhookAlert {
  type: 'high_failure_rate' | 'old_pending_events' | 'no_recent_events' | 'excessive_retries';
  severity: 'warning' | 'critical';
  message: string;
  metadata: Record<string, string | number | boolean>;
}

/**
 * Webhook の健全性メトリクスを取得
 */
export async function getWebhookHealthMetrics(hoursBack: number = 24): Promise<WebhookHealthMetrics> {
  // サーバーサイドでのみ動作することを確認
  if (typeof window !== 'undefined') {
    // クライアントサイドでは模擬データを返す
    return {
      totalEvents: Math.floor(Math.random() * 100) + 50,
      successfulEvents: Math.floor(Math.random() * 80) + 40,
      failedEvents: Math.floor(Math.random() * 10),
      pendingRetries: Math.floor(Math.random() * 5),
      successRate: Math.random() * 20 + 80, // 80-100%
      avgProcessingTime: Math.random() * 2 + 0.5, // 0.5-2.5 seconds
      lastEventTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      oldestPendingEvent: null,
    };
  }

  try {
    // 動的インポートでサーバーサイドコードを取得
    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const supabase = supabaseAdmin;
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    // 指定期間内のイベント統計を取得
    const { data: events, error } = await supabase
      .from('webhook_events')
      .select('processed, retry_count, created_at, processed_at')
      .gte('created_at', cutoffTime);

    if (error) {
      throw error;
    }

    /** Webhookイベント行 */
    type WebhookEventRow = { processed: boolean; retry_count: number; created_at: string; processed_at: string | null };
    const typedEvents = (events ?? []) as WebhookEventRow[];

    const totalEvents = typedEvents.length;
    const successfulEvents = typedEvents.filter((e) => e.processed).length;
    const failedEvents = typedEvents.filter((e) => !e.processed && e.retry_count >= 3).length;
    const pendingRetries = typedEvents.filter((e) => !e.processed && e.retry_count < 3).length;
    
    const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 100;

    // 最新イベント時刻
    const lastEventTime = typedEvents.length > 0
      ? Math.max(...typedEvents.map((e) => new Date(e.created_at).getTime()))
      : null;

    // 古い未処理イベントをチェック
    const oldPendingEvents = typedEvents.filter((e) =>
      !e.processed &&
      new Date(e.created_at).getTime() < Date.now() - 30 * 60 * 1000 // 30分以上前
    );

    const oldestPendingEvent = oldPendingEvents.length > 0
      ? Math.min(...oldPendingEvents.map((e) => new Date(e.created_at).getTime()))
      : null;

    // 平均処理時間（処理済みイベントのみ）
    const processedEvents = typedEvents.filter((e) => e.processed && e.processed_at);
    const avgProcessingTime = processedEvents.length > 0
      ? processedEvents.reduce((sum: number, e) => {
          const start = new Date(e.created_at).getTime();
          const end = new Date(e.processed_at!).getTime();
          return sum + (end - start);
        }, 0) / processedEvents.length / 1000 // 秒単位
      : 0;

    return {
      totalEvents,
      successfulEvents,
      failedEvents,
      pendingRetries,
      successRate,
      avgProcessingTime,
      lastEventTime: lastEventTime ? new Date(lastEventTime).toISOString() : null,
      oldestPendingEvent: oldestPendingEvent ? new Date(oldestPendingEvent).toISOString() : null,
    };

  } catch (error) {
    logger.error('Failed to get webhook health metrics', { data: error instanceof Error ? error : new Error(String(error)) });
    return {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      pendingRetries: 0,
      successRate: 100,
      avgProcessingTime: 0,
      lastEventTime: null,
      oldestPendingEvent: null,
    };
  }
}

/**
 * Webhook アラートをチェック
 */
export async function checkWebhookAlerts(): Promise<WebhookAlert[]> {
  const alerts: WebhookAlert[] = [];
  const metrics = await getWebhookHealthMetrics(24);

  // 高い失敗率をチェック
  if (metrics.totalEvents > 10 && metrics.successRate < 80) {
    alerts.push({
      type: 'high_failure_rate',
      severity: metrics.successRate < 50 ? 'critical' : 'warning',
      message: `Webhook success rate is ${metrics.successRate.toFixed(1)}% (${metrics.failedEvents} failures out of ${metrics.totalEvents} events)`,
      metadata: { successRate: metrics.successRate, failedEvents: metrics.failedEvents, totalEvents: metrics.totalEvents }
    });
  }

  // 古い未処理イベントをチェック
  if (metrics.oldestPendingEvent) {
    const ageHours = (Date.now() - new Date(metrics.oldestPendingEvent).getTime()) / (1000 * 60 * 60);
    if (ageHours > 1) {
      alerts.push({
        type: 'old_pending_events',
        severity: ageHours > 6 ? 'critical' : 'warning',
        message: `Webhook events pending for ${ageHours.toFixed(1)} hours (${metrics.pendingRetries} pending events)`,
        metadata: { oldestPendingAge: ageHours, pendingRetries: metrics.pendingRetries }
      });
    }
  }

  // 最近のイベントがないかチェック
  if (metrics.lastEventTime) {
    const lastEventAgeHours = (Date.now() - new Date(metrics.lastEventTime).getTime()) / (1000 * 60 * 60);
    if (lastEventAgeHours > 48) {
      alerts.push({
        type: 'no_recent_events',
        severity: lastEventAgeHours > 168 ? 'critical' : 'warning', // 1週間
        message: `No webhook events received for ${lastEventAgeHours.toFixed(1)} hours`,
        metadata: { lastEventAge: lastEventAgeHours }
      });
    }
  }

  // 過度なリトライをチェック
  if (metrics.pendingRetries > 20) {
    alerts.push({
      type: 'excessive_retries',
      severity: metrics.pendingRetries > 50 ? 'critical' : 'warning',
      message: `Excessive webhook retries: ${metrics.pendingRetries} events pending retry`,
      metadata: { pendingRetries: metrics.pendingRetries }
    });
  }

  return alerts;
}

/**
 * Webhook イベントのクリーンアップ（30日より古いイベントを削除）
 */
export async function cleanupOldWebhookEvents(): Promise<{ deleted: number; error?: string }> {
  // サーバーサイドでのみ動作
  if (typeof window !== 'undefined') {
    return { deleted: 0, error: 'Client-side execution not supported' };
  }

  try {
    // 動的インポートでサーバーサイドコードを取得
    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const supabase = supabaseAdmin;
    const cutoffTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30日前

    const { data, error, count } = await supabase
      .from('webhook_events')
      .delete({ count: 'exact' })
      .lt('created_at', cutoffTime);

    if (error) {
      return { deleted: 0, error: error.message };
    }

    const deletedCount = count || 0;
    logger.debug(`Cleaned up ${deletedCount} old webhook events`);
    
    return { deleted: deletedCount };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to cleanup old webhook events', { data: error instanceof Error ? error : new Error(String(error)) });
    return { deleted: 0, error: errorMessage };
  }
}

/**
 * Webhook の設定状態をチェック
 */
export function validateWebhookConfiguration(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    issues.push('STRIPE_WEBHOOK_SECRET environment variable is not set');
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    issues.push('STRIPE_SECRET_KEY environment variable is not set');
  }

  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    issues.push('STRIPE_PUBLISHABLE_KEY environment variable is not set');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}