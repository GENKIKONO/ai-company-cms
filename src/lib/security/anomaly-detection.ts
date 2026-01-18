/**
 * 異常検知システム
 *
 * 検出対象:
 * - ログイン失敗の急増
 * - 不審なアクセスパターン
 * - 地理的に異常なアクセス
 * - 時間帯外アクセス
 */

import { logger } from '@/lib/utils/logger';

// 検知閾値設定
const THRESHOLDS = {
  // ログイン失敗
  LOGIN_FAILURES_PER_IP: 5, // 15分間に5回
  LOGIN_FAILURES_PER_USER: 3, // 15分間に3回
  LOGIN_FAILURES_WINDOW_MS: 15 * 60 * 1000,

  // レート異常
  REQUESTS_PER_MINUTE: 100,
  API_CALLS_PER_MINUTE: 60,

  // 時間帯（JST）
  SUSPICIOUS_HOURS_START: 2, // 午前2時
  SUSPICIOUS_HOURS_END: 5, // 午前5時
};

// インメモリストア（本番ではRedis推奨）
const loginFailures = new Map<string, { count: number; firstAt: number }>();
const requestCounts = new Map<string, { count: number; windowStart: number }>();

export interface AnomalyEvent {
  type: 'login_failure_spike' | 'rate_anomaly' | 'suspicious_time' | 'geo_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, unknown>;
  timestamp: string;
}

export interface AnomalyCheckResult {
  isAnomaly: boolean;
  events: AnomalyEvent[];
  shouldBlock: boolean;
  blockReason?: string;
}

/**
 * ログイン失敗を記録
 */
export function recordLoginFailure(
  identifier: string,
  type: 'ip' | 'user'
): AnomalyCheckResult {
  const now = Date.now();
  const key = `${type}:${identifier}`;
  const threshold = type === 'ip' ? THRESHOLDS.LOGIN_FAILURES_PER_IP : THRESHOLDS.LOGIN_FAILURES_PER_USER;

  // 古いエントリをクリーンアップ
  cleanupOldEntries(loginFailures, THRESHOLDS.LOGIN_FAILURES_WINDOW_MS);

  const existing = loginFailures.get(key);

  if (!existing || now - existing.firstAt > THRESHOLDS.LOGIN_FAILURES_WINDOW_MS) {
    // 新しいウィンドウ
    loginFailures.set(key, { count: 1, firstAt: now });
    return { isAnomaly: false, events: [], shouldBlock: false };
  }

  // カウント増加
  existing.count++;
  loginFailures.set(key, existing);

  // 閾値チェック
  if (existing.count >= threshold) {
    const event: AnomalyEvent = {
      type: 'login_failure_spike',
      severity: existing.count >= threshold * 2 ? 'critical' : 'high',
      details: {
        identifier,
        identifierType: type,
        failureCount: existing.count,
        windowMinutes: THRESHOLDS.LOGIN_FAILURES_WINDOW_MS / 60000,
      },
      timestamp: new Date().toISOString(),
    };

    logger.warn('[Anomaly] Login failure spike detected', event.details);

    // Slackに通知（環境変数が設定されている場合）
    notifySlack(event).catch(() => {});

    return {
      isAnomaly: true,
      events: [event],
      shouldBlock: existing.count >= threshold * 2,
      blockReason: 'Too many failed login attempts',
    };
  }

  return { isAnomaly: false, events: [], shouldBlock: false };
}

/**
 * リクエストレートをチェック
 */
export function checkRequestRate(clientIP: string): AnomalyCheckResult {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1分
  const key = `rate:${clientIP}`;

  cleanupOldEntries(requestCounts, windowMs);

  const existing = requestCounts.get(key);

  if (!existing || now - existing.windowStart > windowMs) {
    requestCounts.set(key, { count: 1, windowStart: now });
    return { isAnomaly: false, events: [], shouldBlock: false };
  }

  existing.count++;
  requestCounts.set(key, existing);

  if (existing.count >= THRESHOLDS.REQUESTS_PER_MINUTE) {
    const event: AnomalyEvent = {
      type: 'rate_anomaly',
      severity: existing.count >= THRESHOLDS.REQUESTS_PER_MINUTE * 2 ? 'critical' : 'high',
      details: {
        clientIP,
        requestCount: existing.count,
        windowSeconds: 60,
      },
      timestamp: new Date().toISOString(),
    };

    logger.warn('[Anomaly] Rate anomaly detected', event.details);
    notifySlack(event).catch(() => {});

    return {
      isAnomaly: true,
      events: [event],
      shouldBlock: existing.count >= THRESHOLDS.REQUESTS_PER_MINUTE * 2,
      blockReason: 'Request rate exceeded',
    };
  }

  return { isAnomaly: false, events: [], shouldBlock: false };
}

/**
 * 時間帯チェック（不審な時間帯のアクセス）
 */
export function checkSuspiciousTime(): AnomalyCheckResult {
  const now = new Date();
  // JSTに変換
  const jstHour = (now.getUTCHours() + 9) % 24;

  if (jstHour >= THRESHOLDS.SUSPICIOUS_HOURS_START && jstHour < THRESHOLDS.SUSPICIOUS_HOURS_END) {
    const event: AnomalyEvent = {
      type: 'suspicious_time',
      severity: 'low',
      details: {
        hour: jstHour,
        timezone: 'JST',
        note: 'Access during unusual hours',
      },
      timestamp: now.toISOString(),
    };

    logger.info('[Anomaly] Suspicious time access', event.details);

    return {
      isAnomaly: true,
      events: [event],
      shouldBlock: false, // 時間帯だけではブロックしない
    };
  }

  return { isAnomaly: false, events: [], shouldBlock: false };
}

/**
 * 総合異常チェック
 */
export function checkAllAnomalies(
  clientIP: string,
  userId?: string
): AnomalyCheckResult {
  const results: AnomalyCheckResult[] = [];

  // レートチェック
  results.push(checkRequestRate(clientIP));

  // 時間帯チェック
  results.push(checkSuspiciousTime());

  // 結果を集約
  const allEvents = results.flatMap(r => r.events);
  const shouldBlock = results.some(r => r.shouldBlock);
  const blockReason = results.find(r => r.blockReason)?.blockReason;

  return {
    isAnomaly: allEvents.length > 0,
    events: allEvents,
    shouldBlock,
    blockReason,
  };
}

/**
 * Slack通知
 */
async function notifySlack(event: AnomalyEvent): Promise<void> {
  const webhookUrl = process.env.SLACK_SECURITY_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  const severityEmoji = {
    low: '🟡',
    medium: '🟠',
    high: '🔴',
    critical: '🚨',
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${severityEmoji[event.severity]} Security Alert: ${event.type}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${severityEmoji[event.severity]} Security Alert*\n*Type:* ${event.type}\n*Severity:* ${event.severity}\n*Time:* ${event.timestamp}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `\`\`\`${JSON.stringify(event.details, null, 2)}\`\`\``,
            },
          },
        ],
      }),
    });
  } catch (error) {
    logger.error('[Anomaly] Failed to send Slack notification', { error });
  }
}

/**
 * 古いエントリをクリーンアップ
 */
function cleanupOldEntries(
  store: Map<string, { count: number; firstAt?: number; windowStart?: number }>,
  maxAgeMs: number
): void {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    const startTime = value.firstAt || value.windowStart || 0;
    if (now - startTime > maxAgeMs) {
      store.delete(key);
    }
  }
}

/**
 * ログイン失敗カウントをリセット（ログイン成功時）
 */
export function resetLoginFailures(identifier: string, type: 'ip' | 'user'): void {
  const key = `${type}:${identifier}`;
  loginFailures.delete(key);
}

/**
 * 診断情報を取得
 */
export function getAnomalyStats(): {
  loginFailureEntries: number;
  requestCountEntries: number;
} {
  return {
    loginFailureEntries: loginFailures.size,
    requestCountEntries: requestCounts.size,
  };
}
