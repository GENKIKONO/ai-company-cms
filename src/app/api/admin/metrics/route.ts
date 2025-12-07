/**
 * P3-8: Admin Metrics API
 * GET /api/admin/metrics?range=12w&orgId=...
 * 
 * Super Admin限定のKPIダッシュボード用API
 * Supabase側で作成済みのKPI VIEWからデータを取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { AdminMetricsResponse, MetricsApiParams } from '@/types/admin-metrics';

export async function GET(request: NextRequest) {
  try {
    // ============================================
    // 1. 認証確認（Super Admin限定）
    // ============================================
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Super Admin権限チェック
    const { data: user } = await supabase.auth.getUser();
    const userRole = user.user?.user_metadata?.role || 
                     user.user?.app_metadata?.role;
    
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
      console.debug('Organization-specific metrics request:', { orgId, user_id: user.user?.id });
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
 * KPIデータを取得する関数（現在はモック実装）
 */
async function fetchMetricsData(
  supabase: any,
  range: string,
  orgId?: string
): Promise<AdminMetricsResponse> {
  
  // 期間計算（UTC週ベース）
  const weeksCount = range === '1w' ? 1 : range === '4w' ? 4 : 12;
  const currentWeekStart = getUTCWeekStart(new Date());
  
  // モックデータ生成
  // TODO: 本番では実際のKPI VIEWクエリに置き換え
  const mockResponse: AdminMetricsResponse = {
    summary: {
      rls_denied_count: 3,
      job_fail_rate_top3: [
        { job_name: 'edge:nightly-schema-diff', failed_count: 2, total_runs: 10, fail_rate_pct: 20.0 },
        { job_name: 'edge:ai-interview-processor', failed_count: 1, total_runs: 8, fail_rate_pct: 12.5 },
        { job_name: 'backup-daily', failed_count: 0, total_runs: 7, fail_rate_pct: 0.0 }
      ],
      edge_error_rate_worst3: [
        { function_name: 'ai-interview-processor', failed_count: 5, total_runs: 50, error_rate_pct: 10.0 },
        { function_name: 'nightly-schema-diff', failed_count: 2, total_runs: 30, error_rate_pct: 6.7 },
        { function_name: 'data-export', failed_count: 1, total_runs: 25, error_rate_pct: 4.0 }
      ],
      security_incidents_count: 1
    },
    charts: {
      rls_denied_weekly: generateWeeklyRlsData(weeksCount, currentWeekStart),
      job_fail_rate_weekly_by_job: generateWeeklyJobFailRateData(weeksCount, currentWeekStart),
      edge_error_rate_latest_week: [
        { function_name: 'ai-interview-processor', failed_count: 5, total_runs: 50, error_rate_pct: 10.0 },
        { function_name: 'nightly-schema-diff', failed_count: 2, total_runs: 30, error_rate_pct: 6.7 },
        { function_name: 'data-export', failed_count: 1, total_runs: 25, error_rate_pct: 4.0 },
        { function_name: 'user-sync', failed_count: 0, total_runs: 20, error_rate_pct: 0.0 }
      ],
      ai_interview_completion_rate_weekly_by_org: generateWeeklyAiInterviewData(weeksCount, currentWeekStart, orgId),
      ai_citations_weekly_by_org: generateWeeklyAiCitationsData(weeksCount, currentWeekStart, orgId),
      security_incidents_weekly_by_type_and_risk: generateWeeklySecurityIncidentsData(weeksCount, currentWeekStart),
      alert_events_current_week: [
        { event_type: 'rate_limit_violation', event_count: 8 },
        { event_type: 'rls_denied_spike', event_count: 3 },
        { event_type: 'job_fail_rate_spike', event_count: 2 },
        { event_type: 'edge_error_rate_spike', event_count: 1 },
        { event_type: 'security_incident_critical', event_count: 1 }
      ]
    }
  };

  return mockResponse;
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

/**
 * モックデータ生成関数群
 */
function generateWeeklyRlsData(weeksCount: number, currentWeekStart: Date) {
  const data = [];
  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(currentWeekStart.getUTCDate() - (i * 7));
    data.push({
      week_start_utc: weekStart.toISOString(),
      rls_denied_count: Math.floor(Math.random() * 10)
    });
  }
  return data;
}

function generateWeeklyJobFailRateData(weeksCount: number, currentWeekStart: Date) {
  const jobNames = ['edge:nightly-schema-diff', 'edge:ai-interview-processor', 'backup-daily'];
  const data = [];
  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(currentWeekStart.getUTCDate() - (i * 7));
    jobNames.forEach(job => {
      data.push({
        week_start_utc: weekStart.toISOString(),
        job_name: job,
        fail_rate_pct: Math.random() * 20
      });
    });
  }
  return data;
}

function generateWeeklyAiInterviewData(weeksCount: number, currentWeekStart: Date, orgId?: string) {
  const orgs = orgId ? [orgId] : ['org-1', 'org-2', 'org-3'];
  const data = [];
  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(currentWeekStart.getUTCDate() - (i * 7));
    orgs.forEach(org => {
      data.push({
        week_start_utc: weekStart.toISOString(),
        org_id: org,
        completion_rate_pct: 60 + Math.random() * 35
      });
    });
  }
  return data;
}

function generateWeeklyAiCitationsData(weeksCount: number, currentWeekStart: Date, orgId?: string) {
  const orgs = orgId ? [orgId] : ['org-1', 'org-2', 'org-3'];
  const data = [];
  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(currentWeekStart.getUTCDate() - (i * 7));
    orgs.forEach(org => {
      data.push({
        week_start_utc: weekStart.toISOString(),
        org_id: org,
        avg_items_per_response: 2 + Math.random() * 3,
        tokens_sum: Math.floor(5000 + Math.random() * 10000)
      });
    });
  }
  return data;
}

function generateWeeklySecurityIncidentsData(weeksCount: number, currentWeekStart: Date) {
  const incidentTypes = ['unauthorized_access', 'rls_bypass_attempt', 'rate_limit_exceeded'];
  const riskLevels = ['low', 'medium', 'high', 'critical'];
  const data = [];
  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(currentWeekStart.getUTCDate() - (i * 7));
    incidentTypes.forEach(type => {
      const risk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
      data.push({
        week_start_utc: weekStart.toISOString(),
        incident_type: type,
        risk,
        incident_count: Math.floor(Math.random() * 5)
      });
    });
  }
  return data;
}