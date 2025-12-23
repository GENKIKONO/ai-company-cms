/**
 * AI Citations Types - DB実装準拠版
 * model_name, content_unit_id, bigint→string対応
 */

import { z } from 'zod';

// bigint対応: DB返却値はstring, UI表示もstring
export const BigIntStringSchema = z.string().refine((val) => {
  const num = parseInt(val, 10);
  return !isNaN(num) && num >= 0;
}, { message: "Valid positive integer string required" });

// 基本的なAI引用情報 (bigint → string)
export interface AICitationSource {
  sourceKey: string  // content_unit_id::text or cu.url or uri
  title: string | null
  url: string | null
  citationsCount: string // bigint → string
  totalWeight: string    // numeric → string  
  totalQuotedTokens: string // bigint → string
  totalQuotedChars: string  // bigint → string
  maxScore: string | null   // numeric → string
  avgScore: string | null   // numeric → string
  lastCitedAt: string  // ISO8601
}

export const AICitationSourceSchema = z.object({
  sourceKey: z.string(),
  title: z.string().nullable(),
  url: z.string().nullable(),
  citationsCount: BigIntStringSchema,
  totalWeight: BigIntStringSchema,
  totalQuotedTokens: BigIntStringSchema, 
  totalQuotedChars: BigIntStringSchema,
  maxScore: BigIntStringSchema.nullable(),
  avgScore: BigIntStringSchema.nullable(),
  lastCitedAt: z.string().datetime(),
});

// セッション単位のレスポンス（response_idごとにグループ化）
export interface SessionCitationResponse {
  responseId: string
  organizationId: string
  sessionId: string
  userId: string
  model: string  // model_name AS model (互換)
  responseCreatedAt: string  // ISO8601
  sources: AICitationSource[]
}

export const SessionCitationResponseSchema = z.object({
  responseId: z.string().uuid(),
  organizationId: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  model: z.string(),
  responseCreatedAt: z.string().datetime(),
  sources: z.array(AICitationSourceSchema),
});

// セッション単位API のレスポンス型
export interface SessionCitationsResponse {
  sessionId: string
  responses: SessionCitationResponse[]
  totalResponses: number
  totalSources: number
}

export const SessionCitationsResponseSchema = z.object({
  sessionId: z.string().uuid(),
  responses: z.array(SessionCitationResponseSchema),
  totalResponses: z.number().int().min(0),
  totalSources: z.number().int().min(0),
});

// 組織×期間集計用の期間情報  
export interface PeriodInfo {
  from: string  // ISO8601 date string
  to: string    // ISO8601 date string
}

export const PeriodInfoSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD format required"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD format required"),
});

// 組織×期間集計のサマリー情報
export interface OrgCitationsTotals {
  totalCitations: string // bigint → string
  totalWeight: string    // numeric → string
  totalQuotedTokens: string // bigint → string 
  totalQuotedChars: string  // bigint → string
  uniqueSources: number     // UI計算値
}

export const OrgCitationsTotalsSchema = z.object({
  totalCitations: BigIntStringSchema,
  totalWeight: BigIntStringSchema,
  totalQuotedTokens: BigIntStringSchema,
  totalQuotedChars: BigIntStringSchema,
  uniqueSources: z.number().int().min(0),
});

// 組織×期間集計API のレスポンス型
export interface OrgCitationsPeriodResponse {
  organizationId: string
  period: PeriodInfo
  sources: AICitationSource[]
  totals: OrgCitationsTotals
}

export const OrgCitationsPeriodResponseSchema = z.object({
  organizationId: z.string().uuid(),
  period: PeriodInfoSchema,
  sources: z.array(AICitationSourceSchema),
  totals: OrgCitationsTotalsSchema,
});

// API共通レスポンス型
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
  | AICitationsApiErrorResponse;

// API クエリパラメータ
export interface SessionCitationsQuery {
  sessionId: string
}

export const SessionCitationsQuerySchema = z.object({
  sessionId: z.string().uuid(),
});

export interface OrgCitationsQuery {
  orgId: string
  from: string  // ISO8601 date
  to: string    // ISO8601 date  
}

export const OrgCitationsQuerySchema = z.object({
  orgId: z.string().uuid(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD format required"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD format required"),
}).refine((data) => data.from <= data.to, {
  message: "from date must be before or equal to to date"
});

// Supabase VIEW の生データ型（APIで直接使用）
export interface VCitationAggregate {
  response_id: string
  organization_id: string
  session_id: string
  user_id: string
  model: string // model_name AS model
  response_created_at: string
  source_key: string
  title: string | null
  url: string | null
  citations_count: string    // bigint → string
  total_weight: string       // numeric → string
  total_quoted_tokens: string // bigint → string
  total_quoted_chars: string  // bigint → string
  max_score: string | null    // numeric → string
  avg_score: string | null    // numeric → string
  last_cited_at: string
}

export const VCitationAggregateSchema = z.object({
  response_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  session_id: z.string().uuid(),
  user_id: z.string().uuid(),
  model: z.string(),
  response_created_at: z.string().datetime(),
  source_key: z.string(),
  title: z.string().nullable(),
  url: z.string().nullable(),
  citations_count: BigIntStringSchema,
  total_weight: BigIntStringSchema,
  total_quoted_tokens: BigIntStringSchema,
  total_quoted_chars: BigIntStringSchema,
  max_score: BigIntStringSchema.nullable(),
  avg_score: BigIntStringSchema.nullable(),
  last_cited_at: z.string().datetime(),
});

export interface MVCitationOrgPeriod {
  organization_id: string
  day_bucket: string
  source_key: string
  title: string | null
  url: string | null
  citations_count: string    // bigint → string
  total_weight: string       // numeric → string
  total_quoted_tokens: string // bigint → string
  total_quoted_chars: string  // bigint → string
  max_score: string | null    // numeric → string
  avg_score: string | null    // numeric → string
  last_cited_at: string
}

export const MVCitationOrgPeriodSchema = z.object({
  organization_id: z.string().uuid(),
  day_bucket: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD format required"),
  source_key: z.string(),
  title: z.string().nullable(),
  url: z.string().nullable(),
  citations_count: BigIntStringSchema,
  total_weight: BigIntStringSchema,
  total_quoted_tokens: BigIntStringSchema,
  total_quoted_chars: BigIntStringSchema,
  max_score: BigIntStringSchema.nullable(),
  avg_score: BigIntStringSchema.nullable(),
  last_cited_at: z.string().datetime(),
});

// ログ記録用型（INSERT時の互換性維持）
export interface LogAiResponseParams {
  sessionId: string;
  organizationId: string | null;
  userId: string;
  modelName: string;  // model_name 列に対応
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  success: boolean;
  citations?: Array<{
    type: string;
    contentUnitId?: string | null;  // content_unit_id に対応
    uri?: string | null;
    title?: string | null;
    snippet?: string | null;
    meta?: any;
  }>;
  error?: any;
}

export const LogAiResponseParamsSchema = z.object({
  sessionId: z.string().uuid(),
  organizationId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  modelName: z.string().min(1),
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  durationMs: z.number().int().min(0),
  success: z.boolean(),
  citations: z.array(z.object({
    type: z.string(),
    contentUnitId: z.string().nullable(),
    uri: z.string().nullable(),
    title: z.string().nullable(),
    snippet: z.string().nullable(),
    meta: z.any().optional(),
  })).optional(),
  error: z.any().optional(),
});

// UI表示用ヘルパー関数
export function formatBigIntString(value: string | null): string {
  if (!value || value === 'null') return '0';
  return parseInt(value, 10).toLocaleString();
}

export function parseBigIntString(value: string | null): number {
  if (!value || value === 'null') return 0;
  return parseInt(value, 10);
}

// ダッシュボード表示用
export interface CitationDisplayOptions {
  sortBy: 'maxScore' | 'citationsCount' | 'lastCitedAt'
  sortOrder: 'desc' | 'asc'
  showEmptySources: boolean
}

export const CitationDisplayOptionsSchema = z.object({
  sortBy: z.enum(['maxScore', 'citationsCount', 'lastCitedAt']),
  sortOrder: z.enum(['desc', 'asc']),
  showEmptySources: z.boolean(),
});

export type PeriodPreset = 
  | 'last7days'
  | 'last30days' 
  | 'last90days'
  | 'custom';

export interface PeriodSelection {
  preset: PeriodPreset
  customFrom?: string  // preset='custom'の場合のみ
  customTo?: string    // preset='custom'の場合のみ
}

export const PeriodSelectionSchema = z.object({
  preset: z.enum(['last7days', 'last30days', 'last90days', 'custom']),
  customFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  customTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine((data) => {
  if (data.preset === 'custom') {
    return data.customFrom && data.customTo && data.customFrom <= data.customTo;
  }
  return true;
}, {
  message: "Custom period requires valid from and to dates"
});

export interface CitationsDashboardState {
  selectedPeriod: PeriodSelection
  displayOptions: CitationDisplayOptions
  isLoading: boolean
  error: string | null
}