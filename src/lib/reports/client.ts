'use client';

/**
 * Monthly Reports - Client Service Layer
 * クライアントから直接 Supabase RPC/Query を呼び出す
 *
 * 仕様準拠版:
 * - private チャンネル購読（org:{orgId}:monthly_reports, report:{orgId}:jobs）
 * - completed優先、なければ直近の generating/pending/failed
 * - plan_id, level でのフィルタリング対応
 * - idempotency_key によるジョブ重複防止
 *
 * 将来の reports スキーマ移行時:
 * - public.* は reports.* への thin-wrapper になる
 * - このファイルの RPC 呼び出し名は変更不要（public.* が委譲）
 */

import { createClient } from '@/lib/supabase/client';
import { getSessionClient } from '@/lib/core/auth-state.client';
import type { Database } from '@/types/supabase';
import {
  toPeriodStart,
  toPeriodEnd,
  levelToMeta,
  type ReportLevel,
  type ReportMeta
} from './helpers';

// =====================================================
// Types
// =====================================================

type Tables = Database['public']['Tables'];
export type MonthlyReportRow = Tables['ai_monthly_reports']['Row'];
export type MonthlyReportJobRow = Tables['monthly_report_jobs']['Row'];

export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'timeout' | 'skipped';

// =====================================================
// 列明示パターン（select('*') 排除用定数）
// =====================================================

/** ai_monthly_reports の全列（列明示パターン） */
const AI_MONTHLY_REPORTS_COLUMNS = `
  id,
  organization_id,
  period_start,
  period_end,
  month_bucket,
  plan_id,
  level,
  status,
  summary_text,
  sections,
  metrics,
  suggestions,
  created_at,
  updated_at
` as const;

/** monthly_report_jobs の全列（列明示パターン） */
const MONTHLY_REPORT_JOBS_COLUMNS = `
  id,
  organization_id,
  report_id,
  status,
  idempotency_key,
  meta,
  scheduled_at,
  started_at,
  finished_at,
  attempts,
  last_error,
  created_at,
  updated_at
` as const;

// Result Types
export interface ReportResult {
  report: MonthlyReportRow | null;
  error: string | null;
}

export interface ReportsListResult {
  reports: MonthlyReportRow[];
  total: number;
  error: string | null;
}

export interface JobsListResult {
  jobs: MonthlyReportJobRow[];
  error: string | null;
}

export interface EnqueueResult {
  reportId: string | null;
  jobId: string | null;
  status: 'ok' | 'skipped' | 'error';
  currentStatus?: string;
  message?: string;
  error: string | null;
}

export interface ActionResult {
  success: boolean;
  error: string | null;
}

// =====================================================
// Reports - Read Operations
// =====================================================

/**
 * 組織のレポート一覧を取得（直接クエリ）
 */
export async function getReportsList(params: {
  organizationId: string;
  year?: number;
  limit?: number;
  offset?: number;
  status?: ReportStatus;
  planId?: string;
  level?: ReportLevel;
}): Promise<ReportsListResult> {
  try {
    const supabase = createClient();
    const { organizationId, year, limit = 12, offset = 0, status, planId, level } = params;

    let query = supabase
      .from('ai_monthly_reports')
      .select(AI_MONTHLY_REPORTS_COLUMNS, { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('period_start', { ascending: false })
      .range(offset, offset + limit - 1);

    // Year filter
    if (year) {
      query = query
        .gte('period_start', `${year}-01-01`)
        .lte('period_start', `${year}-12-31`);
    }

    // Status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Plan filter
    if (planId) {
      query = query.eq('plan_id', planId);
    }

    // Level filter
    if (level) {
      query = query.eq('level', level);
    }

    const { data, error, count } = await query;

    if (error) {
      return { reports: [], total: 0, error: error.message };
    }

    return {
      reports: (data ?? []) as MonthlyReportRow[],
      total: count ?? 0,
      error: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { reports: [], total: 0, error: message };
  }
}

/**
 * 特定期間のレポートを取得
 * completed優先、なければ直近の generating/pending/failed
 */
export async function getReportByPeriod(params: {
  organizationId: string;
  year: number;
  month: number;
  planId?: string;
  level?: ReportLevel;
}): Promise<ReportResult> {
  try {
    const supabase = createClient();
    const periodStart = toPeriodStart(params.year, params.month);

    let query = supabase
      .from('ai_monthly_reports')
      .select(AI_MONTHLY_REPORTS_COLUMNS)
      .eq('organization_id', params.organizationId)
      .eq('period_start', periodStart);

    // Optional filters
    if (params.planId) {
      query = query.eq('plan_id', params.planId);
    }
    if (params.level) {
      query = query.eq('level', params.level);
    }

    const { data, error } = await query;

    if (error) {
      return { report: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { report: null, error: null };
    }

    // Sort by status priority: completed > generating > pending > failed
    const sorted = sortByStatusPriority(data as MonthlyReportRow[]);
    return { report: sorted[0], error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { report: null, error: message };
  }
}

/**
 * 最新の完了レポートを取得（RPC）
 */
export async function getLatestReport(
  organizationId: string,
  options?: { planId?: string; level?: ReportLevel }
): Promise<ReportResult> {
  try {
    const supabase = createClient();

    // Try RPC first
    const { data, error } = await supabase.rpc('get_latest_monthly_report', {
      p_org_id: organizationId
    });

    if (error) {
      // Fallback to direct query if RPC doesn't exist
      let query = supabase
        .from('ai_monthly_reports')
        .select(AI_MONTHLY_REPORTS_COLUMNS)
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .order('period_start', { ascending: false })
        .limit(1);

      if (options?.planId) {
        query = query.eq('plan_id', options.planId);
      }
      if (options?.level) {
        query = query.eq('level', options.level);
      }

      const { data: fallbackData, error: fallbackError } = await query.maybeSingle();

      if (fallbackError) {
        return { report: null, error: fallbackError.message };
      }

      return { report: fallbackData as MonthlyReportRow | null, error: null };
    }

    return { report: data as MonthlyReportRow | null, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { report: null, error: message };
  }
}

// =====================================================
// Jobs - Read Operations
// =====================================================

/**
 * 組織のジョブ一覧を取得（直接クエリ）
 */
export async function getJobsList(params: {
  organizationId: string;
  limit?: number;
  status?: JobStatus | JobStatus[];
}): Promise<JobsListResult> {
  try {
    const supabase = createClient();
    const { organizationId, limit = 20, status } = params;

    let query = supabase
      .from('monthly_report_jobs')
      .select(MONTHLY_REPORT_JOBS_COLUMNS)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Status filter
    if (status) {
      if (Array.isArray(status)) {
        query = query.in('status', status);
      } else {
        query = query.eq('status', status);
      }
    }

    const { data, error } = await query;

    if (error) {
      return { jobs: [], error: error.message };
    }

    return { jobs: (data ?? []) as MonthlyReportJobRow[], error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { jobs: [], error: message };
  }
}

/**
 * アクティブなジョブがあるか確認
 */
export async function checkActiveJob(
  organizationId: string
): Promise<{ hasActive: boolean; job?: MonthlyReportJobRow; error: string | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('monthly_report_jobs')
      .select(MONTHLY_REPORT_JOBS_COLUMNS)
      .eq('organization_id', organizationId)
      .in('status', ['queued', 'running'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { hasActive: false, error: error.message };
    }

    return {
      hasActive: data !== null,
      job: data as MonthlyReportJobRow | undefined,
      error: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { hasActive: false, error: message };
  }
}

// =====================================================
// Reports - Write Operations (RPC)
// =====================================================

/**
 * レポート生成をキューに追加（RPC）
 * DB関数: enqueue_monthly_report(p_org, p_start, p_end, p_meta)
 */
export async function enqueueReport(params: {
  organizationId: string;
  year: number;
  month: number;
  level?: ReportLevel;
  planId?: string;
}): Promise<EnqueueResult> {
  try {
    const supabase = createClient();
    const periodStart = toPeriodStart(params.year, params.month);
    const periodEnd = toPeriodEnd(params.year, params.month);
    const meta: ReportMeta = levelToMeta(params.level ?? 'basic');

    // Try RPC first
    const { data, error } = await supabase.rpc('enqueue_monthly_report', {
      p_org: params.organizationId,
      p_start: periodStart,
      p_end: periodEnd,
      p_meta: meta
    });

    if (error) {
      // If RPC doesn't exist, call Edge Function directly
      const session = await getSessionClient();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/monthly-report-generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            organization_id: params.organizationId,
            year: params.year,
            month: params.month,
            level: params.level ?? 'basic',
            plan_id: params.planId
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return {
          reportId: null,
          jobId: null,
          status: 'error',
          error: result.error || 'Failed to enqueue report'
        };
      }

      return {
        reportId: result.reportId || result.report_id,
        jobId: result.jobId || result.job_id,
        status: result.status,
        currentStatus: result.currentStatus || result.current_status,
        message: result.message,
        error: null
      };
    }

    return {
      reportId: null,
      jobId: data as string,
      status: 'ok',
      error: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      reportId: null,
      jobId: null,
      status: 'error',
      error: message
    };
  }
}

/**
 * レポート再生成をリクエスト（RPC）
 * DB関数: request_regenerate_monthly_report(p_org_id, p_year, p_month)
 */
export async function requestRegenerate(params: {
  organizationId: string;
  year: number;
  month: number;
}): Promise<EnqueueResult> {
  try {
    const supabase = createClient();

    // Try RPC first
    const { data, error } = await supabase.rpc('request_regenerate_monthly_report', {
      p_org_id: params.organizationId,
      p_year: params.year,
      p_month: params.month
    });

    if (error) {
      // If RPC doesn't exist, call Edge Function with force=true
      const session = await getSessionClient();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/monthly-report-generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            organization_id: params.organizationId,
            year: params.year,
            month: params.month,
            force: 'true'
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return {
          reportId: null,
          jobId: null,
          status: 'error',
          error: result.error || 'Failed to regenerate report'
        };
      }

      return {
        reportId: result.reportId || result.report_id,
        jobId: result.jobId || result.job_id,
        status: result.status,
        currentStatus: result.currentStatus || result.current_status,
        message: result.message,
        error: null
      };
    }

    return {
      reportId: null,
      jobId: data as string | null,
      status: 'ok',
      error: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      reportId: null,
      jobId: null,
      status: 'error',
      error: message
    };
  }
}

// =====================================================
// Realtime Channel Helpers
// =====================================================

/**
 * レポートチャンネルのトピック名を生成
 * トピック: org:{orgId}:monthly_reports
 */
export function getReportTopic(organizationId: string): string {
  return `org:${organizationId}:monthly_reports`;
}

/**
 * ジョブチャンネルのトピック名を生成
 * トピック: report:{orgId}:jobs
 */
export function getJobTopic(organizationId: string): string {
  return `report:${organizationId}:jobs`;
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * レポートをステータス優先度でソート
 * completed > generating > pending > failed
 */
function sortByStatusPriority<T extends { status: string; updated_at: string }>(
  reports: T[]
): T[] {
  const priority: Record<string, number> = {
    completed: 0,
    generating: 1,
    pending: 2,
    failed: 3
  };

  return [...reports].sort((a, b) => {
    const priorityA = priority[a.status] ?? 99;
    const priorityB = priority[b.status] ?? 99;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Same priority: sort by updated_at desc
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}
