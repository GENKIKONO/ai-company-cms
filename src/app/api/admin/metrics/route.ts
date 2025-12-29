/**
 * P3-8: Admin Metrics API
 * GET /api/admin/metrics?range=12w&orgId=...
 * 
 * Super Admin限定のKPIダッシュボード用API
 * Supabase側で作成済みのKPI VIEWからデータを取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserFullWithClient } from '@/lib/core/auth-state';
import type { AdminMetricsResponse, MetricsApiParams } from '@/types/admin-metrics';

export async function GET(request: NextRequest) {
  try {
    // ============================================
    // 1. 認証確認（Super Admin限定）（Core経由）
    // ============================================

    const supabase = await createClient();

    const user = await getUserFullWithClient(supabase);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Super Admin権限チェック
    const userRole = (user.user_metadata?.role as string) ||
                     (user.app_metadata?.role as string) ||
                     user.app_role;

    if (userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin privileges required' },
        { status: 403 }
      );
    }

    // ============================================
    // 2. クエリパラメータ解析
    // ============================================
    
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') as MetricsApiParams['range']) || '4w';
    const orgId = searchParams.get('orgId') || undefined;

    // RLS境界強制: Super Adminのみが全社横断（orgId = 'all' | null）を許可
    if (orgId && orgId !== 'all') {
      // 特定組織を指定している場合は、その組織へのアクセス権限をチェック
      // 現在はSuper Adminなので全組織アクセス可能だが、将来の拡張性のため記載
      console.debug('Organization-specific metrics request:', { orgId, user_id: user.id });
    }

    // ============================================
    // 3. KPIデータ取得（現在はモック実装）
    // ============================================
    // TODO: 本番では以下のSupabase KPI VIEWから取得
    // - public.kpi_rls_denied_weekly
    // - public.kpi_job_fail_rate_weekly  
    // - public.kpi_edge_errors_weekly
    // - public.kpi_ai_interview_completion_weekly
    // - public.kpi_ai_citations_weekly
    // - public.kpi_security_incidents_weekly
    // - public.kpi_alert_events_weekly

    const metricsData = await fetchMetricsData(supabase, range, orgId);

    return NextResponse.json({
      success: true,
      data: metricsData,
      metadata: {
        range,
        orgId: orgId || 'all',
        generated_at: new Date().toISOString(),
        timezone: 'UTC'
      }
    });

  } catch (error) {
    console.error('Admin metrics API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch metrics data',
        data: createEmptyMetricsResponse()
      },
      { status: 500 }
    );
  }
}

/**
 * KPIデータを取得する関数（実DB接続版）
 */
async function fetchMetricsData(
  supabase: any,
  range: string,
  orgId?: string
): Promise<AdminMetricsResponse> {

  // 期間計算（UTC週ベース）
  const weeksCount = range === '1w' ? 1 : range === '4w' ? 4 : 12;
  const currentWeekStart = getUTCWeekStart(new Date());
  const rangeStartDate = new Date(currentWeekStart);
  rangeStartDate.setUTCDate(rangeStartDate.getUTCDate() - (weeksCount * 7));
  const rangeStartISO = rangeStartDate.toISOString();

  // 並列でデータ取得
  const [
    rlsDeniedResult,
    securityIncidentsResult,
    jobRunsResult,
    alertEventsResult,
    aiInterviewKpiResult,
    aiCitationsKpiResult,
  ] = await Promise.all([
    // RLS拒否イベント
    supabase
      .from('rls_denied_events')
      .select('created_at')
      .gte('created_at', rangeStartISO),
    // セキュリティインシデント
    supabase
      .from('intrusion_detection_alerts')
      .select('detected_at, severity')
      .gte('detected_at', rangeStartISO),
    // ジョブ実行結果
    supabase
      .from('job_runs_v2')
      .select('job_name, status, created_at')
      .gte('created_at', rangeStartISO),
    // Webhookイベント（アラート用）
    supabase
      .from('webhook_events')
      .select('event_type, created_at')
      .gte('created_at', rangeStartISO),
    // AI Interview completion KPI (view confirmed by Supabase Assistant)
    supabase
      .from('kpi_ai_interview_completion_weekly')
      .select('*')
      .gte('week_start', rangeStartISO.split('T')[0]),
    // AI Citations KPI (view confirmed by Supabase Assistant)
    supabase
      .from('kpi_ai_citations_weekly')
      .select('*')
      .gte('week_start', rangeStartISO.split('T')[0]),
  ]);

  // RLS拒否数集計
  const rlsDeniedEvents = rlsDeniedResult.data || [];
  const rlsDeniedCount = rlsDeniedEvents.length;
  const rlsDeniedWeeklyRaw = aggregateByWeek(rlsDeniedEvents, 'created_at', 'rls_denied_count', currentWeekStart, weeksCount);
  const rlsDeniedWeekly = rlsDeniedWeeklyRaw.map(item => ({
    week_start_utc: item.week_start_utc,
    rls_denied_count: (item as any).rls_denied_count ?? 0
  }));

  // セキュリティインシデント集計
  const securityIncidents = securityIncidentsResult.data || [];
  const securityIncidentsCount = securityIncidents.length;
  const securityWeekly = aggregateSecurityByWeek(securityIncidents, currentWeekStart, weeksCount);

  // ジョブ失敗率集計
  const jobRuns = jobRunsResult.data || [];
  const jobFailRateTop3 = calculateJobFailRates(jobRuns);
  const jobFailRateWeekly = aggregateJobFailRateByWeek(jobRuns, currentWeekStart, weeksCount);

  // Edge関数エラー率（job_runs_v2から推測）
  const edgeJobs = jobRuns.filter((j: any) => j.job_name?.startsWith('edge:'));
  const edgeErrorRateWorst3 = calculateEdgeErrorRates(edgeJobs);

  // アラートイベント集計
  const webhookEvents = alertEventsResult.data || [];
  const alertEventsCurrent = aggregateAlertEvents(webhookEvents, rlsDeniedCount, jobFailRateTop3, securityIncidentsCount);

  // AI Interview KPI (from view)
  const aiInterviewKpiData = aiInterviewKpiResult.data || [];
  const aiInterviewCompletionWeekly = aiInterviewKpiData.map((row: any) => ({
    week_start_utc: row.week_start,
    organization_id: row.organization_id,
    organization_name: row.organization_name,
    completion_rate_pct: row.completion_rate_pct || 0,
    total_sessions: row.total_sessions || 0,
    completed_sessions: row.completed_sessions || 0,
  }));

  // AI Citations KPI (from view)
  const aiCitationsKpiData = aiCitationsKpiResult.data || [];
  const aiCitationsWeekly = aiCitationsKpiData.map((row: any) => ({
    week_start_utc: row.week_start,
    organization_id: row.organization_id,
    organization_name: row.organization_name,
    citation_count: row.citation_count || 0,
    unique_sources: row.unique_sources || 0,
  }));

  return {
    summary: {
      rls_denied_count: rlsDeniedCount,
      job_fail_rate_top3: jobFailRateTop3,
      edge_error_rate_worst3: edgeErrorRateWorst3,
      security_incidents_count: securityIncidentsCount
    },
    charts: {
      rls_denied_weekly: rlsDeniedWeekly,
      job_fail_rate_weekly_by_job: jobFailRateWeekly,
      edge_error_rate_latest_week: edgeErrorRateWorst3,
      ai_interview_completion_rate_weekly_by_org: aiInterviewCompletionWeekly,
      ai_citations_weekly_by_org: aiCitationsWeekly,
      security_incidents_weekly_by_type_and_risk: securityWeekly,
      alert_events_current_week: alertEventsCurrent
    }
  };
}

/**
 * 週次集計ヘルパー
 */
function aggregateByWeek(
  items: any[],
  dateField: string,
  countField: string,
  currentWeekStart: Date,
  weeksCount: number
) {
  const weekCounts: Record<string, number> = {};

  // 初期化
  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(currentWeekStart.getUTCDate() - (i * 7));
    weekCounts[weekStart.toISOString()] = 0;
  }

  // 集計
  for (const item of items) {
    const dateStr = item[dateField];
    if (!dateStr) continue;
    const itemDate = new Date(dateStr);
    const weekStart = getUTCWeekStart(itemDate);
    const key = weekStart.toISOString();
    if (key in weekCounts) {
      weekCounts[key]++;
    }
  }

  return Object.entries(weekCounts)
    .map(([week_start_utc, count]) => ({ week_start_utc, [countField]: count }))
    .sort((a, b) => a.week_start_utc.localeCompare(b.week_start_utc));
}

/**
 * ジョブ失敗率計算
 */
function calculateJobFailRates(jobRuns: any[]) {
  const jobStats: Record<string, { failed: number; total: number }> = {};

  for (const job of jobRuns) {
    const name = job.job_name || 'unknown';
    if (!jobStats[name]) {
      jobStats[name] = { failed: 0, total: 0 };
    }
    jobStats[name].total++;
    if (job.status === 'failed' || job.status === 'error') {
      jobStats[name].failed++;
    }
  }

  return Object.entries(jobStats)
    .map(([job_name, stats]) => ({
      job_name,
      failed_count: stats.failed,
      total_runs: stats.total,
      fail_rate_pct: stats.total > 0 ? (stats.failed / stats.total) * 100 : 0
    }))
    .sort((a, b) => b.fail_rate_pct - a.fail_rate_pct)
    .slice(0, 3);
}

/**
 * Edge関数エラー率計算
 */
function calculateEdgeErrorRates(edgeJobs: any[]) {
  const funcStats: Record<string, { failed: number; total: number }> = {};

  for (const job of edgeJobs) {
    const name = job.job_name?.replace('edge:', '') || 'unknown';
    if (!funcStats[name]) {
      funcStats[name] = { failed: 0, total: 0 };
    }
    funcStats[name].total++;
    if (job.status === 'failed' || job.status === 'error') {
      funcStats[name].failed++;
    }
  }

  return Object.entries(funcStats)
    .map(([function_name, stats]) => ({
      function_name,
      failed_count: stats.failed,
      total_runs: stats.total,
      error_rate_pct: stats.total > 0 ? (stats.failed / stats.total) * 100 : 0
    }))
    .sort((a, b) => b.error_rate_pct - a.error_rate_pct)
    .slice(0, 3);
}

/**
 * セキュリティインシデント週次集計
 */
function aggregateSecurityByWeek(incidents: any[], currentWeekStart: Date, weeksCount: number) {
  const result: any[] = [];
  const riskLevels = ['low', 'medium', 'high', 'critical'];

  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(currentWeekStart.getUTCDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    const weekIncidents = incidents.filter(inc => {
      const d = new Date(inc.detected_at);
      return d >= weekStart && d < weekEnd;
    });

    for (const risk of riskLevels) {
      const count = weekIncidents.filter(inc => inc.severity === risk).length;
      result.push({
        week_start_utc: weekStart.toISOString(),
        incident_type: 'security_alert',
        risk,
        incident_count: count
      });
    }
  }

  return result;
}

/**
 * ジョブ失敗率週次集計
 */
function aggregateJobFailRateByWeek(jobRuns: any[], currentWeekStart: Date, weeksCount: number) {
  const result: any[] = [];
  const jobNames = [...new Set(jobRuns.map(j => j.job_name || 'unknown'))].slice(0, 5);

  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(currentWeekStart.getUTCDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    const weekJobs = jobRuns.filter(job => {
      const d = new Date(job.created_at);
      return d >= weekStart && d < weekEnd;
    });

    for (const jobName of jobNames) {
      const jobsForName = weekJobs.filter(j => j.job_name === jobName);
      const failedCount = jobsForName.filter(j => j.status === 'failed' || j.status === 'error').length;
      const totalCount = jobsForName.length;

      result.push({
        week_start_utc: weekStart.toISOString(),
        job_name: jobName,
        fail_rate_pct: totalCount > 0 ? (failedCount / totalCount) * 100 : 0
      });
    }
  }

  return result;
}

/**
 * アラートイベント集計
 */
function aggregateAlertEvents(
  webhookEvents: any[],
  rlsDeniedCount: number,
  jobFailRates: any[],
  securityIncidentsCount: number
) {
  const THRESHOLDS = {
    rls_spike: 5,
    job_fail_spike: 10,
    security_critical: 0,
  };

  const events: { event_type: string; event_count: number }[] = [];

  // Webhookエラー
  const webhookErrors = webhookEvents.filter(e => e.event_type?.includes('error')).length;
  events.push({ event_type: 'webhook_error', event_count: webhookErrors });

  // RLSスパイク
  events.push({
    event_type: 'rls_denied_spike',
    event_count: rlsDeniedCount > THRESHOLDS.rls_spike ? 1 : 0
  });

  // ジョブ失敗スパイク
  const hasJobSpike = jobFailRates.some(j => j.fail_rate_pct > THRESHOLDS.job_fail_spike);
  events.push({
    event_type: 'job_fail_rate_spike',
    event_count: hasJobSpike ? 1 : 0
  });

  // セキュリティインシデント
  events.push({
    event_type: 'security_incident_critical',
    event_count: securityIncidentsCount > THRESHOLDS.security_critical ? securityIncidentsCount : 0
  });

  return events.filter(e => e.event_count > 0);
}

/**
 * 空のメトリクスレスポンスを生成
 */
function createEmptyMetricsResponse(): AdminMetricsResponse {
  return {
    summary: {
      rls_denied_count: 0,
      job_fail_rate_top3: [],
      edge_error_rate_worst3: [],
      security_incidents_count: 0
    },
    charts: {
      rls_denied_weekly: [],
      job_fail_rate_weekly_by_job: [],
      edge_error_rate_latest_week: [],
      ai_interview_completion_rate_weekly_by_org: [],
      ai_citations_weekly_by_org: [],
      security_incidents_weekly_by_type_and_risk: [],
      alert_events_current_week: []
    }
  };
}

/**
 * UTC週の開始日を取得（月曜日始まり）
 */
function getUTCWeekStart(date: Date): Date {
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  const dayOfWeek = utcDate.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(utcDate);
  weekStart.setUTCDate(utcDate.getUTCDate() - mondayOffset);
  weekStart.setUTCHours(0, 0, 0, 0);
  return weekStart;
}

// モック関数は削除済み - 実DBから取得