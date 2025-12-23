/**
 * Admin Alerts Dashboard API
 *
 * GET /api/admin/alerts/dashboard - ダッシュボード用アラート集計データを取得
 *
 * Query params:
 *   - range: 1w | 4w | 12w (デフォルト4w)
 *
 * Response規約:
 *   成功: { success: true, data: { cards, series } }
 *   失敗: { success: false, error_code, message }
 *
 * cards: [{ key, value, trend, threshold, severity }]
 * series: Record<string, { x: string; y: number }[]>
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { ok, err, ErrorCodes } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

interface CardData {
  key: string;
  value: number;
  trend?: number; // 前期間比（%）
  threshold?: number;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'normal';
}

interface SeriesPoint {
  x: string; // YYYY-Www形式
  y: number;
}

// 期間を週数からDateに変換
function getDateRange(range: string): { start: Date; weeks: number } {
  const now = new Date();
  const weeks = parseInt(range.replace('w', ''), 10) || 4;
  const start = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
  return { start, weeks };
}

// ISO週番号を取得
function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// 週次集計を生成
function aggregateByWeek(
  items: { created_at?: string; detected_at?: string }[],
  dateField: 'created_at' | 'detected_at'
): SeriesPoint[] {
  const weekCounts: Record<string, number> = {};

  for (const item of items) {
    const dateStr = item[dateField];
    if (!dateStr) continue;
    const week = getISOWeek(new Date(dateStr));
    weekCounts[week] = (weekCounts[week] || 0) + 1;
  }

  return Object.entries(weekCounts)
    .map(([x, y]) => ({ x, y }))
    .sort((a, b) => a.x.localeCompare(b.x));
}

// 重大度を判定
function getSeverity(value: number, threshold: number): CardData['severity'] {
  if (value >= threshold * 2) return 'critical';
  if (value >= threshold * 1.5) return 'high';
  if (value >= threshold) return 'medium';
  return 'normal';
}

export async function GET(request: NextRequest) {
  try {
    // 管理者認証ガード
    const authResult = await requireAdmin();
    if (!isAuthorized(authResult)) {
      return authResult.response;
    }

    const supabase = await createClient();

    // クエリパラメータ取得
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '4w';
    const { start, weeks } = getDateRange(range);
    const startISO = start.toISOString();

    // 並列でデータ取得
    const [
      intrusionResult,
      rlsDeniedResult,
      jobRunsResult,
      webhookResult,
    ] = await Promise.all([
      // 1. intrusion_detection_alerts
      supabase
        .from('intrusion_detection_alerts')
        .select('detected_at, severity')
        .gte('detected_at', startISO),

      // 2. rls_denied_events（存在する場合）
      supabase
        .from('rls_denied_events')
        .select('created_at')
        .gte('created_at', startISO),

      // 3. job_runs_v2
      supabase
        .from('job_runs_v2')
        .select('status, created_at')
        .gte('created_at', startISO),

      // 4. webhook_events
      supabase
        .from('webhook_events')
        .select('event_type, created_at')
        .gte('created_at', startISO),
    ]);

    // intrusion_detection_alerts 集計
    const intrusionAlerts = intrusionResult.data || [];
    const intrusionCount = intrusionAlerts.length;
    const intrusionBySeverity: Record<string, number> = {};
    for (const alert of intrusionAlerts) {
      const sev = alert.severity || 'unknown';
      intrusionBySeverity[sev] = (intrusionBySeverity[sev] || 0) + 1;
    }

    // rls_denied_events 集計
    const rlsDeniedEvents = rlsDeniedResult.data || [];
    const rlsDeniedCount = rlsDeniedEvents.length;

    // job_runs_v2 失敗率
    const jobRuns = jobRunsResult.data || [];
    const totalJobs = jobRuns.length;
    const failedJobs = jobRuns.filter(
      (j) => j.status === 'failed' || j.status === 'error'
    ).length;
    const jobFailureRate = totalJobs > 0 ? Math.round((failedJobs / totalJobs) * 100) : 0;

    // webhook_events エラー率
    const webhookEvents = webhookResult.data || [];
    const totalWebhooks = webhookEvents.length;
    const errorWebhooks = webhookEvents.filter((w) =>
      w.event_type?.toLowerCase().includes('error')
    ).length;
    const webhookErrorRate =
      totalWebhooks > 0 ? Math.round((errorWebhooks / totalWebhooks) * 100) : 0;

    // カード生成
    const cards: CardData[] = [
      {
        key: 'intrusion_alerts',
        value: intrusionCount,
        threshold: weeks * 5, // 週あたり5件を閾値
        severity: getSeverity(intrusionCount, weeks * 5),
      },
      {
        key: 'rls_denied',
        value: rlsDeniedCount,
        threshold: weeks * 10,
        severity: getSeverity(rlsDeniedCount, weeks * 10),
      },
      {
        key: 'job_failure_rate',
        value: jobFailureRate,
        threshold: 10, // 10%を閾値
        severity: getSeverity(jobFailureRate, 10),
      },
      {
        key: 'webhook_error_rate',
        value: webhookErrorRate,
        threshold: 5, // 5%を閾値
        severity: getSeverity(webhookErrorRate, 5),
      },
    ];

    // シリーズ生成（週次トレンド）
    const series: Record<string, SeriesPoint[]> = {
      intrusion_alerts: aggregateByWeek(intrusionAlerts, 'detected_at'),
      rls_denied: aggregateByWeek(rlsDeniedEvents, 'created_at'),
      job_runs: aggregateByWeek(jobRuns, 'created_at'),
      webhook_events: aggregateByWeek(webhookEvents, 'created_at'),
    };

    // severity別集計もシリーズに追加
    for (const [sev, count] of Object.entries(intrusionBySeverity)) {
      series[`intrusion_${sev}`] = [{ x: 'total', y: count }];
    }

    return NextResponse.json(
      ok(
        { cards, series },
        { range, period_start: startISO }
      )
    );
  } catch (e) {
    console.error('Alerts dashboard API error:', e);
    return NextResponse.json(
      err(ErrorCodes.INTERNAL_ERROR, e instanceof Error ? e.message : 'Internal server error'),
      { status: 500 }
    );
  }
}
