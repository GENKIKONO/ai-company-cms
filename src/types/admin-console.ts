/**
 * AIOHub P3-1: Super Admin Console Types - VIEW準拠版
 * 
 * Supabase VIEWスキーマに対応：
 * - admin_alerts_latest_v1
 * - admin_jobs_recent_v1
 * - admin_summary_today_v1
 *
 * 注意事項：
 * - VIEW側のカラム定義変更時は、この型定義も一緒に更新すること
 * - パフォーマンス: alert_events/job_runs のcreated_atインデックスが必要になったら、
 *   Supabase側でDDL実行後にクエリ実行計画を再測定すること
 */

// ===== Alert Events (VIEW: admin_alerts_latest_v1) =====
export interface AdminAlertEvent {
  id: string;
  created_at: string;
  severity: string; // DB: text, UI側で 'info'|'warning'|'critical' を想定
  event_type: string;
  event_key?: string | null;
  message: string; // VIEW で投影済み（details->>'message' or event_type）
  source_table?: string | null;
  details?: Record<string, unknown>;
}

// ===== Job Runs (VIEW: admin_jobs_recent_v1) =====
export interface AdminJobRun {
  id: string;
  job_name: string;
  status: 'success' | 'error'; // DB実値準拠
  created_at: string;
  started_at?: string | null; // VIEW で投影済み
  completed_at?: string | null; // VIEW で投影済み
  error_message?: string | null; // VIEW で投影済み
  details?: Record<string, unknown>;
}

// ===== Console Summary (VIEW: admin_summary_today_v1) =====
export interface AdminConsoleSummary {
  todayAlerts: number; // today_alerts (bigint) → number
  criticalAlertsToday: number; // critical_alerts_today (bigint) → number
  failedJobsLast24h: number; // failed_jobs_24h (bigint) → number
  slowQueriesCount: number; // 将来的に pg_stat_statements 用（現在はダミー）
}

// ===== Slow Queries (将来: Edge Function + pg_stat_statements) =====
export interface SlowQueryStat {
  queryId: string; // pg_stat_statements.queryid のハッシュ値
  fingerprint: string; // 正規化されたクエリフィンガープリント（パラメータ除去済み）
  normalizedQuery: string; // マスキング済みクエリ文字列（テーブル名は維持、値は'***'）
  meanTimeMs: number; // 平均実行時間（ミリ秒）
  maxTimeMs: number; // 最大実行時間（ミリ秒）
  totalTimeMs: number; // 総実行時間（ミリ秒）
  calls: number; // 実行回数
  meanRows: number; // 平均返却行数
  lastSeenAt: string; // 最後の実行日時（ISO文字列）
  database: string; // データベース名
  // 注意: センシティブな情報（実際の値、ユーザー名等）は Edge Function側でマスキング済み
}

export interface AdminSlowQueriesResponse {
  queries: SlowQueryStat[];
  totalCount: number;
  period: {
    from: string; // 集計期間の開始
    to: string; // 集計期間の終了
  };
  lastUpdated: string; // pg_stat_statements の最終更新日時
}

// VIEW の生の行データ型（Supabase からの取得用）
export interface AdminSummaryRaw {
  today_alerts?: number | string | null;
  critical_alerts_today?: number | string | null;
  failed_jobs_24h?: number | string | null;
}

// ===== System Health =====
export interface AdminSystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'critical';
    responseTime: number; // ms
    activeConnections: number;
    details?: string;
  };
  supabase: {
    status: 'healthy' | 'warning' | 'critical';
    apiResponseTime: number; // ms
    storageStatus: 'healthy' | 'warning' | 'critical';
    details?: string;
  };
  external_services: {
    status: 'healthy' | 'warning' | 'critical';
    services: Array<{
      name: string;
      status: 'healthy' | 'warning' | 'critical';
      responseTime?: number;
      details?: string;
    }>;
  };
  overall: 'healthy' | 'warning' | 'critical';
  lastChecked: string;
}

// ===== Statistics =====
export interface AdminSystemStats {
  alerts: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recent24h: number;
  };
  jobs: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<'success' | 'error', number>;
    recent24h: number;
    failureRate: number; // 0-1
  };
  performance: {
    avgResponseTime: number; // ms
    errorRate: number; // 0-1
    uptime: number; // 0-1
  };
}

// ===== Filters =====
export interface AdminAlertFilters {
  eventType?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminJobFilters {
  jobName?: string;
  status?: 'success' | 'error';
  dateFrom?: string;
  dateTo?: string;
}

// ===== API Responses =====
export interface AdminConsoleData {
  health: AdminSystemHealth;
  stats: AdminSystemStats;
  summary: AdminConsoleSummary;
  recentAlerts: AdminAlertEvent[];
  recentJobs: AdminJobRun[];
  slowQueries: SlowQueryStat[]; // 将来: Edge Function + pg_stat_statements
}

export interface AdminAlertsResponse {
  alerts: AdminAlertEvent[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminJobsResponse {
  jobs: AdminJobRun[];
  total: number;
  page: number;
  pageSize: number;
}

// ===== Utility Types =====
export type AdminConsolePage = 'overview' | 'alerts' | 'jobs' | 'health' | 'settings';

export interface AdminConsoleConfig {
  refreshInterval: number; // ms
  maxItemsPerPage: number;
  healthCheckInterval: number; // ms
}

// ===== ヘルパー関数 =====

/**
 * Severity値の UI バッジ用正規化
 * DB値('info'/'warning'/'critical') → UI表示用
 */
export function getSeverityVariant(severity: string): 'info' | 'warning' | 'critical' {
  const normalized = severity.toLowerCase();
  switch (normalized) {
    case 'info':
    case 'low':
      return 'info';
    case 'warning':
    case 'medium':
    case 'high':
      return 'warning';
    case 'critical':
      return 'critical';
    default:
      return 'info'; // fallback
  }
}

/**
 * Job Status値の UI ラベル用正規化
 * DB値('success'/'error') → UI表示ラベル
 */
export function getStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case 'success':
      return 'Success';
    case 'error':
      return 'Failure'; // UI では "Failure" として表示
    default:
      return status;
  }
}

/**
 * 実行時間の計算
 */
export function calculateDuration(
  startedAt: string | null, 
  completedAt: string | null
): number | null {
  if (!startedAt || !completedAt) return null;
  
  try {
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    return end - start; // ms
  } catch {
    return null;
  }
}

/**
 * 実行時間のフォーマット
 */
export function formatDuration(duration: number | null): string {
  if (!duration) return 'N/A';
  
  if (duration < 1000) {
    return `${duration}ms`;
  } else if (duration < 60000) {
    return `${Math.round(duration / 1000)}s`;
  } else {
    return `${Math.round(duration / 60000)}m`;
  }
}

/**
 * VIEW 生データからサマリーオブジェクトにマッピング
 */
export function mapSummaryRowToSummary(row: AdminSummaryRaw | null): AdminConsoleSummary {
  const toNumber = (value: number | string | null | undefined): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  return {
    todayAlerts: toNumber(row?.today_alerts),
    criticalAlertsToday: toNumber(row?.critical_alerts_today),
    failedJobsLast24h: toNumber(row?.failed_jobs_24h),
    slowQueriesCount: 0, // TODO: Edge Function + pg_stat_statements 実装後に置き換え
  };
}

// ===== メンテナンスガイド =====
/**
 * P3-1 Super Admin Console - 将来の拡張・メンテナンス指針
 * 
 * 【VIEW スキーマ変更時の対応】
 * 1. Supabase 側での VIEW 定義変更後
 * 2. この型定義ファイルの対応する interface を更新
 * 3. コンポーネント側 (AlertsPanel, JobsPanel) のフィールド参照を確認
 * 4. TypeScript コンパイル通過 & 動作確認
 * 
 * 【パフォーマンス監視】
 * - データ増加に伴い VIEW のクエリプランが悪化した場合
 * - alert_events(created_at DESC), job_runs(created_at DESC) のインデックス追加検討
 * - Supabase Dashboard > Performance > Slow Query Log で監視
 * 
 * 【Edge Function 実装時】
 * - SlowQueryStat 型はそのまま利用可能
 * - fetchSlowQueriesForAdmin() 関数の TODO 部分を実装
 * - page.tsx の slowQueries 取得部分を有効化
 * 
 * 【Super Admin RLS ポリシー】
 * - app_users.role IN ('owner','admin') 条件を維持
 * - 新しいテーブル追加時は同様のポリシーパターンを適用
 */