/**
 * P2-5: AI引用ログの可視化ダッシュボード用型定義
 * v_ai_citations_aggregates, mv_ai_citations_org_period対応
 */

// 基本的なAI引用情報
export interface AICitationSource {
  sourceKey: string  // content_unit_id::text or uri
  title: string | null
  url: string | null
  citationsCount: number
  totalWeight: number
  totalQuotedTokens: number
  totalQuotedChars: number
  maxScore: number | null
  avgScore: number | null
  lastCitedAt: string  // ISO8601
}

// セッション単位のレスポンス（response_idごとにグループ化）
export interface SessionCitationResponse {
  responseId: string
  organizationId: string
  sessionId: string
  userId: string
  model: string
  responseCreatedAt: string  // ISO8601
  sources: AICitationSource[]
}

// セッション単位API のレスポンス型
export interface SessionCitationsResponse {
  sessionId: string
  responses: SessionCitationResponse[]
  totalResponses: number
  totalSources: number
}

// 組織×期間集計用の期間情報
export interface PeriodInfo {
  from: string  // ISO8601 date string
  to: string    // ISO8601 date string
}

// 組織×期間集計のサマリー情報
export interface OrgCitationsTotals {
  totalCitations: number
  totalWeight: number
  totalQuotedTokens: number
  totalQuotedChars: number
  uniqueSources: number
}

// 組織×期間集計API のレスポンス型
export interface OrgCitationsPeriodResponse {
  organizationId: string
  period: PeriodInfo
  sources: AICitationSource[]
  totals: OrgCitationsTotals
}

// API共通レスポンス型（Phase 2全体の形式に合わせる）
export interface AICitationsApiSuccessResponse<T> {
  success: true
  data: T
}

export interface AICitationsApiErrorResponse {
  success: false
  code: string
  message: string
  details?: string
}

export type AICitationsApiResponse<T> = 
  | AICitationsApiSuccessResponse<T> 
  | AICitationsApiErrorResponse

// API クエリパラメータ
export interface SessionCitationsQuery {
  sessionId: string
}

export interface OrgCitationsQuery {
  orgId: string
  from: string  // ISO8601 date
  to: string    // ISO8601 date
}

// ダッシュボード UI用の表示オプション
export interface CitationDisplayOptions {
  sortBy: 'maxScore' | 'citationsCount' | 'lastCitedAt'
  sortOrder: 'desc' | 'asc'
  showEmptySources: boolean
}

// ダッシュボード用の期間プリセット
export type PeriodPreset = 
  | 'last7days'
  | 'last30days' 
  | 'last90days'
  | 'custom'

export interface PeriodSelection {
  preset: PeriodPreset
  customFrom?: string  // preset='custom'の場合のみ
  customTo?: string    // preset='custom'の場合のみ
}

// フロントエンド状態管理用
export interface CitationsDashboardState {
  selectedPeriod: PeriodSelection
  displayOptions: CitationDisplayOptions
  isLoading: boolean
  error: string | null
}

// Supabase VIEW/MV の生データ型（APIで直接使用）
export interface VCitationAggregate {
  response_id: string
  organization_id: string
  session_id: string
  user_id: string
  model: string
  response_created_at: string
  source_key: string
  title: string | null
  url: string | null
  citations_count: number
  total_weight: number
  total_quoted_tokens: number
  total_quoted_chars: number
  max_score: number | null
  avg_score: number | null
  last_cited_at: string
}

export interface MVCitationOrgPeriod {
  organization_id: string
  day_bucket: string
  source_key: string
  title: string | null
  url: string | null
  citations_count: number
  total_weight: number
  total_quoted_tokens: number
  total_quoted_chars: number
  max_score: number | null
  avg_score: number | null
  last_cited_at: string
}