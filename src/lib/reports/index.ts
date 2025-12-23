/**
 * Monthly Reports - Public API
 *
 * サービス層のエントリーポイント
 * - helpers: period/level/meta 変換ヘルパ
 * - client: クライアント側 Supabase RPC 呼び出し
 * - realtime: Realtime 購読フック
 * - server: サーバー側専用（API route 等）
 *
 * 将来の reports スキーマ移行時:
 * - このバレルの export は変更不要
 * - 内部実装（client.ts, server.ts）で RPC 名を調整
 */

// Helpers (shared)
export {
  toPeriodStart,
  toPeriodEnd,
  fromPeriodStart,
  urlParamToPeriod,
  periodToUrlParam,
  getPreviousPeriod,
  levelToMeta,
  metaToLevel,
  createPeriodSelection,
  formatPeriodLabel,
  formatFileSize,
  type ReportLevel,
  type ReportMeta,
  type PeriodSelection
} from './helpers';

// Client Service (browser-safe, RPC direct)
export {
  getReportsList,
  getReportByPeriod,
  getLatestReport,
  getJobsList,
  checkActiveJob,
  enqueueReport,
  requestRegenerate,
  getReportTopic,
  getJobTopic,
  type MonthlyReportRow,
  type MonthlyReportJobRow,
  type ReportStatus,
  type JobStatus,
  type ReportResult,
  type ReportsListResult,
  type JobsListResult,
  type EnqueueResult,
  type ActionResult,
} from './client';

// Realtime Hooks (Final Version with setAuth, retry, deduplication)
export {
  useReportRealtime,
  useJobRealtime,
  useCombinedRealtime,
  type RealtimeState,
  type UseReportRealtimeOptions,
  type UseJobRealtimeOptions,
  type UseCombinedRealtimeOptions,
  type CombinedRealtimeState
} from './realtime';

// Server Service は別途 import
// import { ... } from '@/lib/reports/monthly-report-service';
