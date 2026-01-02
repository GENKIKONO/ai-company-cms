/**
 * Monthly Report Service Layer
 * ai_monthly_reports テーブルへの統一アクセスを提供
 */

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
import { logger } from '@/lib/utils/logger';

// 型定義
type Tables = Database['public']['Tables'];
type MonthlyReportRow = Tables['ai_monthly_reports']['Row'];
type MonthlyReportInsert = Tables['ai_monthly_reports']['Insert'];
type MonthlyReportUpdate = Tables['ai_monthly_reports']['Update'];

// ステータス型
type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

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

// =====================================================
// YEAR/MONTH ⇔ PERIOD_START 変換ヘルパー
// =====================================================

/**
 * year/month から period_start (YYYY-MM-01) を生成
 */
export function toPeriodStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/**
 * year/month から period_end (月末日) を生成
 */
export function toPeriodEnd(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

/**
 * period_start (YYYY-MM-DD) から year/month を抽出
 */
export function fromPeriodStart(periodStart: string): { year: number; month: number } {
  const [yearStr, monthStr] = periodStart.split('-');
  return { year: parseInt(yearStr, 10), month: parseInt(monthStr, 10) };
}

// 取得結果の型
export interface MonthlyReportResult {
  report: MonthlyReportRow | null;
  error: string | null;
}

// 一覧取得結果の型
export interface MonthlyReportsListResult {
  reports: MonthlyReportRow[];
  total: number;
  error: string | null;
}

/**
 * 組織×期間で月次レポートを取得
 * @param periodStart - 期間開始日 (YYYY-MM-DD)
 */
export async function getMonthlyReport(
  organizationId: string,
  periodStart: string
): Promise<MonthlyReportResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('ai_monthly_reports')
      .select(AI_MONTHLY_REPORTS_COLUMNS)
      .eq('organization_id', organizationId)
      .eq('period_start', periodStart)
      .maybeSingle();

    if (error) {
      logger.error('Failed to get monthly report', {
        data: { error, organizationId, periodStart }
      });
      return { report: null, error: error.message };
    }

    return { report: data as MonthlyReportRow | null, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('getMonthlyReport error', { data: { error: message } });
    return { report: null, error: message };
  }
}

/**
 * 組織の月次レポート一覧を取得
 */
export async function getMonthlyReportsList(
  organizationId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: ReportStatus;
  }
): Promise<MonthlyReportsListResult> {
  try {
    const supabase = await createClient();
    const { limit = 12, offset = 0, status } = options ?? {};

    let query = supabase
      .from('ai_monthly_reports')
      .select(AI_MONTHLY_REPORTS_COLUMNS, { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('period_start', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query.returns<MonthlyReportRow[]>();

    if (error) {
      logger.error('Failed to get monthly reports list', {
        data: { error, organizationId }
      });
      return { reports: [], total: 0, error: error.message };
    }

    return {
      reports: data ?? [],
      total: count ?? 0,
      error: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('getMonthlyReportsList error', { data: { error: message } });
    return { reports: [], total: 0, error: message };
  }
}

/**
 * 月次レポートを保存（upsert）
 */
export async function saveMonthlyReport(
  payload: MonthlyReportInsert
): Promise<{ id: string | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // DB unique constraint: (organization_id, period_start, period_end)
    // month_bucket is auto-computed from period_start by DB trigger (not used in constraint)
    const { data, error } = await supabase
      .from('ai_monthly_reports')
      .upsert(payload, { onConflict: 'organization_id,period_start,period_end' })
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to save monthly report', {
        data: { error, periodStart: payload.period_start, orgId: payload.organization_id }
      });
      return { id: null, error: error.message };
    }

    return { id: (data as { id: string } | null)?.id ?? null, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('saveMonthlyReport error', { data: { error: message } });
    return { id: null, error: message };
  }
}

/**
 * 月次レポートのステータスを更新
 */
export async function updateMonthlyReportStatus(
  organizationId: string,
  periodStart: string,
  status: ReportStatus,
  additionalData?: Partial<MonthlyReportUpdate>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const updatePayload: MonthlyReportUpdate = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData
    };

    const { error } = await supabase
      .from('ai_monthly_reports')
      .update(updatePayload)
      .eq('organization_id', organizationId)
      .eq('period_start', periodStart);

    if (error) {
      logger.error('Failed to update monthly report status', {
        data: { error, organizationId, periodStart, status }
      });
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('updateMonthlyReportStatus error', { data: { error: message } });
    return { success: false, error: message };
  }
}

/**
 * 月次レポートを削除
 */
export async function deleteMonthlyReport(
  organizationId: string,
  periodStart: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('ai_monthly_reports')
      .delete()
      .eq('organization_id', organizationId)
      .eq('period_start', periodStart);

    if (error) {
      logger.error('Failed to delete monthly report', {
        data: { error, organizationId, periodStart }
      });
      return { success: false, error: error.message };
    }

    logger.info('Monthly report deleted', {
      data: { organizationId, periodStart }
    });

    return { success: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('deleteMonthlyReport error', { data: { error: message } });
    return { success: false, error: message };
  }
}

// =====================================================
// API互換レスポンス変換
// =====================================================

/**
 * API互換レスポンス形式
 */
export interface MonthlyReportApiResponse {
  id: string;
  year: number;
  month: number;
  status: string;
  format: string;
  file_url: string | null;
  file_size: number | null;
  data_summary: Record<string, unknown>;
  generated_at: string | null;
  created_at: string;
  error_message: string | null;
}

/**
 * MonthlyReportRow を API互換形式に変換
 */
export function toApiResponse(row: MonthlyReportRow): MonthlyReportApiResponse {
  const { year, month } = fromPeriodStart(row.period_start);
  const metrics = (row.metrics as Record<string, unknown>) ?? {};
  return {
    id: row.id,
    year,
    month,
    status: row.status,
    format: 'html', // ai_monthly_reports にはformat列がないのでデフォルト
    file_url: (metrics.file_url as string | null) ?? null,
    file_size: (metrics.file_size as number | null) ?? null,
    data_summary: metrics,
    generated_at: row.status === 'completed' ? row.updated_at : null,
    created_at: row.created_at,
    error_message: null // ai_monthly_reports にはerror_message列がない
  };
}

// =====================================================
// YEAR/MONTH ベースの取得関数
// =====================================================

/**
 * year/month で月次レポートを取得
 */
export async function getMonthlyReportByYearMonth(
  organizationId: string,
  year: number,
  month: number
): Promise<MonthlyReportResult> {
  const periodStart = toPeriodStart(year, month);
  return getMonthlyReport(organizationId, periodStart);
}

/**
 * year/month フィルタ付きで月次レポート一覧を取得
 * Enhanced with period range, status filter, and sort order
 */
export async function getMonthlyReportsListByYearMonth(
  organizationId: string,
  options?: {
    year?: number;
    month?: number;
    periodFrom?: string; // YYYY-MM-DD
    periodTo?: string;   // YYYY-MM-DD
    limit?: number;
    offset?: number;
    status?: ReportStatus;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<MonthlyReportsListResult> {
  try {
    const supabase = await createClient();
    const {
      year,
      month,
      periodFrom,
      periodTo,
      limit = 50,
      offset = 0,
      status,
      sortOrder = 'desc'
    } = options ?? {};

    let query = supabase
      .from('ai_monthly_reports')
      .select(AI_MONTHLY_REPORTS_COLUMNS, { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('period_start', { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    // Period range filter (takes precedence over year/month)
    if (periodFrom || periodTo) {
      if (periodFrom) {
        query = query.gte('period_start', periodFrom);
      }
      if (periodTo) {
        query = query.lte('period_start', periodTo);
      }
    } else if (year && month) {
      // Exact year/month filter
      const periodStart = toPeriodStart(year, month);
      query = query.eq('period_start', periodStart);
    } else if (year) {
      // Year-only filter
      query = query.gte('period_start', `${year}-01-01`).lte('period_start', `${year}-12-31`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query.returns<MonthlyReportRow[]>();

    if (error) {
      logger.error('Failed to get monthly reports list by year/month', {
        data: { error, organizationId, year, month, periodFrom, periodTo }
      });
      return { reports: [], total: 0, error: error.message };
    }

    return {
      reports: data ?? [],
      total: count ?? 0,
      error: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('getMonthlyReportsListByYearMonth error', { data: { error: message } });
    return { reports: [], total: 0, error: message };
  }
}

/**
 * 最新の月次レポートを取得
 */
export async function getLatestMonthlyReport(
  organizationId: string
): Promise<MonthlyReportResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('ai_monthly_reports')
      .select(AI_MONTHLY_REPORTS_COLUMNS)
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Failed to get latest monthly report', {
        data: { error, organizationId }
      });
      return { report: null, error: error.message };
    }

    return { report: data as MonthlyReportRow | null, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('getLatestMonthlyReport error', { data: { error: message } });
    return { report: null, error: message };
  }
}

// =====================================================
// RPC ベースの関数（DB関数を直接呼び出し）
// =====================================================

type MonthlyReportJobRow = Tables['monthly_report_jobs']['Row'];

/**
 * ジョブステータス型
 */
export type JobStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

/**
 * ジョブ一覧取得結果
 */
export interface MonthlyReportJobsResult {
  jobs: MonthlyReportJobRow[];
  error: string | null;
}

/**
 * レポート生成をキューに追加（RPC版）
 * DB関数: enqueue_monthly_report(p_org, p_start, p_end, p_meta?)
 */
export async function enqueueMonthlyReportRpc(params: {
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  meta?: Record<string, unknown>;
}): Promise<{ jobId: string | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('enqueue_monthly_report', {
      p_org: params.organizationId,
      p_start: params.periodStart,
      p_end: params.periodEnd,
      p_meta: params.meta ?? null
    });

    if (error) {
      logger.error('Failed to enqueue monthly report via RPC', {
        data: { error, ...params }
      });
      return { jobId: null, error: error.message };
    }

    return { jobId: data as string, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('enqueueMonthlyReportRpc error', { data: { error: message } });
    return { jobId: null, error: message };
  }
}

/**
 * レポート生成をキューに追加（year/month版）
 */
export async function enqueueMonthlyReportByYearMonth(params: {
  organizationId: string;
  year: number;
  month: number;
  level?: 'basic' | 'advanced';
}): Promise<{ jobId: string | null; error: string | null }> {
  const periodStart = toPeriodStart(params.year, params.month);
  const periodEnd = toPeriodEnd(params.year, params.month);
  return enqueueMonthlyReportRpc({
    organizationId: params.organizationId,
    periodStart,
    periodEnd,
    meta: params.level ? { level: params.level } : undefined
  });
}

/**
 * レポート生成を実行（RPC版）
 * DB関数: generate_monthly_report(p_org_id, p_period_start, p_period_end)
 */
export async function generateMonthlyReportRpc(params: {
  organizationId: string;
  periodStart: string;
  periodEnd: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.rpc('generate_monthly_report', {
      p_org_id: params.organizationId,
      p_period_start: params.periodStart,
      p_period_end: params.periodEnd
    });

    if (error) {
      logger.error('Failed to generate monthly report via RPC', {
        data: { error, ...params }
      });
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('generateMonthlyReportRpc error', { data: { error: message } });
    return { success: false, error: message };
  }
}

/**
 * レポート再生成をリクエスト（RPC版）
 * DB関数: request_regenerate_monthly_report(p_org_id, p_year, p_month)
 */
export async function requestRegenerateMonthlyReportRpc(params: {
  organizationId: string;
  year: number;
  month: number;
}): Promise<{ result: unknown; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('request_regenerate_monthly_report', {
      p_org_id: params.organizationId,
      p_year: params.year,
      p_month: params.month
    });

    if (error) {
      logger.error('Failed to request regenerate monthly report via RPC', {
        data: { error, ...params }
      });
      return { result: null, error: error.message };
    }

    return { result: data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('requestRegenerateMonthlyReportRpc error', { data: { error: message } });
    return { result: null, error: message };
  }
}

/**
 * 最新レポートを取得（RPC版）
 * DB関数: get_latest_monthly_report(p_org_id)
 */
export async function getLatestMonthlyReportRpc(
  organizationId: string
): Promise<MonthlyReportResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_latest_monthly_report', {
      p_org_id: organizationId
    });

    if (error) {
      logger.error('Failed to get latest monthly report via RPC', {
        data: { error, organizationId }
      });
      return { report: null, error: error.message };
    }

    return { report: data as MonthlyReportRow | null, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('getLatestMonthlyReportRpc error', { data: { error: message } });
    return { report: null, error: message };
  }
}

/**
 * 年月別レポート一覧を取得（RPC版）
 * DB関数: list_monthly_reports_by_year_month(p_org_id, p_year, p_month, p_limit?, p_before?)
 */
export async function listMonthlyReportsByYearMonthRpc(params: {
  organizationId: string;
  year: number;
  month: number;
  limit?: number;
  before?: string;
}): Promise<MonthlyReportsListResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('list_monthly_reports_by_year_month', {
      p_org_id: params.organizationId,
      p_year: params.year,
      p_month: params.month,
      p_limit: params.limit ?? 50,
      p_before: params.before ?? null
    });

    if (error) {
      logger.error('Failed to list monthly reports by year/month via RPC', {
        data: { error, ...params }
      });
      return { reports: [], total: 0, error: error.message };
    }

    const reports = (data ?? []) as MonthlyReportRow[];
    return { reports, total: reports.length, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('listMonthlyReportsByYearMonthRpc error', { data: { error: message } });
    return { reports: [], total: 0, error: message };
  }
}

// =====================================================
// ジョブ管理関数（monthly_report_jobs テーブル）
// =====================================================

/**
 * 組織のジョブ一覧を取得
 */
export async function listMonthlyReportJobs(params: {
  organizationId: string;
  limit?: number;
  status?: JobStatus;
}): Promise<MonthlyReportJobsResult> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('monthly_report_jobs')
      .select(MONTHLY_REPORT_JOBS_COLUMNS)
      .eq('organization_id', params.organizationId)
      .order('created_at', { ascending: false })
      .limit(params.limit ?? 50);

    if (params.status) {
      query = query.eq('status', params.status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to list monthly report jobs', {
        data: { error, organizationId: params.organizationId }
      });
      return { jobs: [], error: error.message };
    }

    return { jobs: data ?? [], error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('listMonthlyReportJobs error', { data: { error: message } });
    return { jobs: [], error: message };
  }
}

/**
 * 特定のジョブを取得
 */
export async function getMonthlyReportJob(
  jobId: string
): Promise<{ job: MonthlyReportJobRow | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('monthly_report_jobs')
      .select(MONTHLY_REPORT_JOBS_COLUMNS)
      .eq('id', jobId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to get monthly report job', {
        data: { error, jobId }
      });
      return { job: null, error: error.message };
    }

    return { job: data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('getMonthlyReportJob error', { data: { error: message } });
    return { job: null, error: message };
  }
}

/**
 * 処理中のジョブがあるか確認
 */
export async function hasActiveJob(
  organizationId: string
): Promise<{ hasActive: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('monthly_report_jobs')
      .select('id')
      .eq('organization_id', organizationId)
      .in('status', ['queued', 'processing'])
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Failed to check active job', {
        data: { error, organizationId }
      });
      return { hasActive: false, error: error.message };
    }

    return { hasActive: data !== null, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('hasActiveJob error', { data: { error: message } });
    return { hasActive: false, error: message };
  }
}
