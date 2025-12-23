/**
 * Monthly Reports Page Types
 *
 * 変更点（リファクタリング）:
 * - helpers は @/lib/reports から再エクスポート
 * - ViewModel 変換関数のみこのファイルに残す
 */

// Re-export from service layer
export {
  toPeriodStart,
  toPeriodEnd,
  fromPeriodStart,
  urlParamToPeriod,
  periodToUrlParam,
  getPreviousPeriod,
  createPeriodSelection,
  formatPeriodLabel,
  formatFileSize,
  levelToMeta,
  metaToLevel,
  type ReportLevel,
  type ReportMeta,
  type PeriodSelection
} from '@/lib/reports';

// Re-export DB types
export type {
  MonthlyReportRow,
  MonthlyReportJobRow,
  ReportStatus,
  JobStatus as DbJobStatus, // DB型（running を含む）
} from '@/lib/reports';

// =====================================================
// View State
// =====================================================

export type ViewState = 'loading' | 'empty' | 'error' | 'ready';

// =====================================================
// ViewModel-specific Job Status (DB 'running' → UI 'processing')
// =====================================================

export type JobStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

// =====================================================
// Report Metrics
// =====================================================

export interface ReportMetrics {
  aiVisibilityScore: number;
  totalBotHits: number;
  uniqueBots: number;
  analyzedUrls: number;
  topPerformingUrls: number;
  improvementNeededUrls: number;
  fileUrl?: string;
  fileSize?: number;
}

// =====================================================
// Month-over-Month Comparison
// =====================================================

export interface MonthComparison {
  current: ReportMetrics;
  previous: ReportMetrics | null;
  changes: {
    aiVisibilityScore: number | null;
    totalBotHits: number | null;
    analyzedUrls: number | null;
  };
}

// =====================================================
// Job View Model
// =====================================================

export interface JobViewModel {
  id: string;
  status: 'queued' | 'processing' | 'succeeded' | 'failed';
  attempts: number;
  lastError: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

// =====================================================
// Report View Model
// =====================================================

export interface ReportViewModel {
  id: string;
  periodStart: string;
  periodEnd: string;
  year: number;
  month: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  level: 'basic' | 'advanced';
  metrics: ReportMetrics;
  summaryText: string;
  createdAt: string;
  updatedAt: string;
  // Extended fields for detail view
  topBots?: Array<{ name: string; hits: number }>;
  topUrls?: Array<{ path: string; hits: number; score: number }>;
}

// =====================================================
// Action Types
// =====================================================

export type ReportAction =
  | { type: 'GENERATE'; payload: { year: number; month: number; level: 'basic' | 'advanced' } }
  | { type: 'REGENERATE'; payload: { year: number; month: number } }
  | { type: 'ENQUEUE'; payload: { year: number; month: number; level: 'basic' | 'advanced' } };

// =====================================================
// Transform Functions
// =====================================================

import { fromPeriodStart, type MonthlyReportRow, type MonthlyReportJobRow } from '@/lib/reports';

/**
 * Transform DB Row to Report ViewModel
 */
export function toReportViewModel(row: MonthlyReportRow): ReportViewModel {
  const { year, month } = fromPeriodStart(row.period_start);
  const metrics = (row.metrics as Record<string, unknown>) ?? {};

  // level は DB カラムから直接取得（meta は ai_monthly_reports にはない）
  const levelValue = row.level as string;
  const level: ReportViewModel['level'] = levelValue === 'advanced' ? 'advanced' : 'basic';

  return {
    id: row.id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    year,
    month,
    status: row.status as ReportViewModel['status'],
    level,
    metrics: {
      aiVisibilityScore: (metrics.ai_visibility_score as number) ?? 0,
      totalBotHits: (metrics.total_bot_hits as number) ?? 0,
      uniqueBots: (metrics.unique_bots as number) ?? 0,
      analyzedUrls: (metrics.analyzed_urls as number) ?? 0,
      topPerformingUrls: (metrics.top_performing_urls as number) ?? 0,
      improvementNeededUrls: (metrics.improvement_needed_urls as number) ?? 0,
      fileUrl: metrics.file_url as string | undefined,
      fileSize: metrics.file_size as number | undefined
    },
    summaryText: row.summary_text || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Extended fields from metrics if available
    topBots: (metrics.top_bots as Array<{ name: string; hits: number }>) ?? undefined,
    topUrls: (metrics.top_urls as Array<{ path: string; hits: number; score: number }>) ?? undefined
  };
}

/**
 * Transform DB Row to Job ViewModel
 * Note: DB uses 'running' but ViewModel uses 'processing' for UI consistency
 */
export function toJobViewModel(row: MonthlyReportJobRow): JobViewModel {
  // Map DB status to ViewModel status
  const dbStatus = row.status as string;
  let viewStatus: JobViewModel['status'];

  switch (dbStatus) {
    case 'queued':
      viewStatus = 'queued';
      break;
    case 'running':
      viewStatus = 'processing';
      break;
    case 'succeeded':
      viewStatus = 'succeeded';
      break;
    case 'failed':
    case 'cancelled':
    case 'timeout':
    case 'skipped':
    default:
      viewStatus = 'failed';
      break;
  }

  return {
    id: row.id,
    status: viewStatus,
    attempts: row.attempts,
    lastError: row.last_error,
    scheduledAt: row.scheduled_at ?? null,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at
  };
}

/**
 * Calculate month-over-month changes
 */
export function calculateComparison(
  current: ReportMetrics,
  previous: ReportMetrics | null
): MonthComparison {
  if (!previous) {
    return {
      current,
      previous: null,
      changes: {
        aiVisibilityScore: null,
        totalBotHits: null,
        analyzedUrls: null
      }
    };
  }

  return {
    current,
    previous,
    changes: {
      aiVisibilityScore: current.aiVisibilityScore - previous.aiVisibilityScore,
      totalBotHits: current.totalBotHits - previous.totalBotHits,
      analyzedUrls: current.analyzedUrls - previous.analyzedUrls
    }
  };
}

// =====================================================
// Status Label Helpers
// =====================================================

export function getStatusLabel(status: ReportViewModel['status']): string {
  const labels: Record<ReportViewModel['status'], string> = {
    pending: '保留中',
    generating: '生成中',
    completed: '完了',
    failed: '失敗'
  };
  return labels[status];
}

export function getJobStatusLabel(status: JobViewModel['status']): string {
  const labels: Record<JobViewModel['status'], string> = {
    queued: 'キュー待ち',
    processing: '処理中',
    succeeded: '成功',
    failed: '失敗'
  };
  return labels[status];
}
