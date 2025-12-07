/**
 * P2-7: AIインタビュー × 組織アナリティクス型定義
 * Supabase VIEW/MATERIALIZED VIEW からのデータを正規化したJSON型
 */

export type InterviewAnalyticsPeriod = '7d' | '30d' | '90d';

export type InterviewSessionStatus = 'draft' | 'in_progress' | 'completed';
export type InterviewContentType = 'service' | 'product' | 'post' | 'news' | 'faq' | 'case_study';

// 日別メトリクス（mv_ai_interview_org_daily_metrics の1行に相当）
export interface InterviewDailyMetric {
  day: string; // ISO date (YYYY-MM-DD)
  sessionCount: number;
  completedSessionCount: number;
  completionRate: number | null;
  avgQuestionCount: number | null;
  aiUsedSessionCount: number;
  aiCallCount: number;
  citationsItemCount: number;
  quotedTokensSum: number;
  lastSessionAt: string | null; // ISO datetime
}

// API レスポンス（成功時）
export interface InterviewAnalyticsResponse {
  success: true;
  orgId: string;
  period: InterviewAnalyticsPeriod;
  from: string; // ISO date
  to: string;   // ISO date
  days: InterviewDailyMetric[];
  totals: {
    sessionCount: number;
    completedSessionCount: number;
    completionRate: number | null;
    avgQuestionCount: number | null;
    aiUsedSessionCount: number;
    aiCallCount: number;
    citationsItemCount: number;
    quotedTokensSum: number;
  };
  metadata: {
    dataSource: 'materialized_view' | 'view' | 'fallback';
    queryTimeMs: number;
    recordCount: number;
  };
}

// API レスポンス（エラー時）
export interface InterviewAnalyticsError {
  success: false;
  code: string;
  message: string;
  detail?: unknown;
}

export type InterviewAnalyticsApiResponse = InterviewAnalyticsResponse | InterviewAnalyticsError;

// Supabase からの生データ型（mv_ai_interview_org_daily_metrics）
export interface SupabaseOrgDailyMetric {
  organization_id: string;
  day: string; // date型はstring化される
  session_count: number;
  completed_session_count: number;
  completion_rate: number | null;
  avg_question_count: number | null;
  ai_used_session_count: number;
  ai_call_count: number;
  citations_item_count: number;
  quoted_tokens_sum: number;
  last_session_at: string | null; // timestamp型はISO string化される
}

// Supabase からの生データ型（v_ai_interview_session_metrics）
export interface SupabaseSessionMetric {
  session_id: string;
  organization_id: string;
  created_at: string;
  day: string;
  status: InterviewSessionStatus;
  content_type: InterviewContentType;
  question_count: number;
  ai_response_count: number;
  ai_used: boolean;
  citations_item_count: number;
  quoted_tokens_sum: number;
  has_generated_content: boolean;
}

// API クエリパラメータ
export interface InterviewAnalyticsQuery {
  orgId: string;
  period?: InterviewAnalyticsPeriod;
}

// UI 状態管理用
export interface InterviewAnalyticsDashboardState {
  selectedPeriod: InterviewAnalyticsPeriod;
  isLoading: boolean;
  error: string | null;
  data: InterviewAnalyticsResponse | null;
  lastRefreshedAt: Date | null;
}

// チャート用データ変換型
export interface ChartDataPoint {
  date: string; // 'MM/DD' format for display
  sessionCount: number;
  aiCallCount: number;
  completionRate: number;
  quotedTokens: number;
}

// サマリカード用データ型
export interface AnalyticsSummary {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isIncrease: boolean;
  };
  icon: 'sessions' | 'completion' | 'questions' | 'ai';
  format: 'number' | 'percentage' | 'decimal';
}

// 期間選択オプション
export interface PeriodOption {
  value: InterviewAnalyticsPeriod;
  label: string;
  days: number;
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: '7d', label: '7日間', days: 7 },
  { value: '30d', label: '30日間', days: 30 },
  { value: '90d', label: '90日間', days: 90 }
];

// データ変換ヘルパー関数の型定義
export interface DataTransformUtils {
  calculateTotals: (days: InterviewDailyMetric[]) => InterviewAnalyticsResponse['totals'];
  formatChartData: (days: InterviewDailyMetric[]) => ChartDataPoint[];
  generateSummaryCards: (totals: InterviewAnalyticsResponse['totals'], period: InterviewAnalyticsPeriod) => AnalyticsSummary[];
  formatNumber: (value: number) => string;
  formatPercentage: (value: number | null) => string;
}

// エラーコード定数
export const INTERVIEW_ANALYTICS_ERROR_CODES = {
  ORG_NOT_FOUND: 'ORG_NOT_FOUND',
  INVALID_PERIOD: 'INVALID_PERIOD',
  DATA_SOURCE_ERROR: 'DATA_SOURCE_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  QUERY_TIMEOUT: 'QUERY_TIMEOUT'
} as const;

export type InterviewAnalyticsErrorCode = typeof INTERVIEW_ANALYTICS_ERROR_CODES[keyof typeof INTERVIEW_ANALYTICS_ERROR_CODES];

// クエリ最適化用の設定
export interface QueryConfig {
  preferMaterializedView: boolean;
  maxRetries: number;
  timeoutMs: number;
  enableFallback: boolean;
}

export const DEFAULT_QUERY_CONFIG: QueryConfig = {
  preferMaterializedView: true,
  maxRetries: 2,
  timeoutMs: 10000,
  enableFallback: true
};