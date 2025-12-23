/**
 * RPC Function Types
 *
 * Supabase auto-generated types (supabase.ts) に含まれていないRPC関数の型定義
 * DBに関数追加後、supabase gen types で再生成されるまでの補助として使用
 *
 * 確認済み RPC関数 (2024-12 Supabase Assistant で検証):
 * - increment_org_interview_stats(p_org_id uuid, p_interview_count int, p_message_count int) RETURNS void
 *   └─ SECURITY DEFINER, authenticated/anon に EXECUTE 権限あり（anon は REVOKE 推奨済み）
 *
 * 未確認 RPC関数 (DBに存在しない可能性):
 * - get_plan_features(p_org_id uuid) RETURNS jsonb
 * - count_report_regenerations(p_org_id uuid, p_period_start date, p_period_end date) RETURNS int
 * - fn_build_monthly_kpis(p_org_id uuid, p_period_start date, p_period_end date) RETURNS jsonb
 * - auto_block_ip(p_ip_address text, p_reason text, p_duration_hours int) RETURNS uuid
 *
 * 実装済み（型定義のみ）:
 * - increment_used_count(p_code text) RETURNS void
 */

// =====================================================
// get_plan_features (未確認: DBに存在しない可能性)
// =====================================================

export interface GetPlanFeaturesArgs {
  p_org_id: string;
}

export interface PlanFeaturesResult {
  monthly_report?: boolean;
  advanced_analytics?: boolean;
  ai_starter?: boolean;
  ai_pro?: boolean;
  max_team_members?: number;
  [key: string]: unknown;
}

// =====================================================
// count_report_regenerations (未確認: DBに存在しない可能性)
// =====================================================

export interface CountReportRegenerationsArgs {
  p_org_id: string;
  p_period_start: string; // date format: 'YYYY-MM-DD'
  p_period_end: string;   // date format: 'YYYY-MM-DD'
}

// Returns: number (int)

// =====================================================
// increment_used_count
// =====================================================

export interface IncrementUsedCountArgs {
  p_code: string; // org_group_invites.code
}

// Returns: void
// Throws exception if:
// - code not found
// - code expired
// - max uses reached

// =====================================================
// fn_build_monthly_kpis (未確認: DBに存在しない可能性)
// =====================================================

export interface FnBuildMonthlyKpisArgs {
  p_org_id: string;
  p_period_start: string; // date format: 'YYYY-MM-DD'
  p_period_end: string;   // date format: 'YYYY-MM-DD'
}

export interface MonthlyKpisResult {
  order_count: number;
  revenue_cents: number; // bigint as number
  ai_usage_events: number;
  [key: string]: unknown;
}

// =====================================================
// auto_block_ip (未確認: DBに存在しない可能性)
// =====================================================

export interface AutoBlockIpArgs {
  p_ip_address: string;  // inet型として保存
  p_reason: string;      // ブロック理由
  p_duration_hours?: number; // 省略時は永久ブロック
}

/**
 * auto_block_ip の戻り値
 * ブロック成功時: 新規作成された ip_blocklist レコードの id (uuid)
 * 既存ブロック時: 既存レコードの id
 */
export type AutoBlockIpResult = string; // uuid

// =====================================================
// increment_org_interview_stats (確認済み: SECURITY DEFINER)
// =====================================================

export interface IncrementOrgInterviewStatsArgs {
  p_org_id: string;
  p_interview_count?: number; // デフォルト: 0
  p_message_count?: number;   // デフォルト: 0
}

// Returns: void (organization_ai_usage の該当行を増分)

// =====================================================
// Views (DB実装済み)
// =====================================================

/**
 * user_organizations View
 * ユーザーの所属組織一覧
 */
export interface UserOrganizationRow {
  user_id: string;
  organization_id: string;
  role: string;
  name: string;
  slug: string;
  plan_id: string | null;
  feature_flags: Record<string, unknown> | null;
  entitlements: Record<string, unknown> | null;
  is_published: boolean;
  org_created_at: string;
}

/**
 * view_org_plans View
 * 組織とプラン機能のマッピング
 */
export interface ViewOrgPlansRow {
  organization_id: string;
  plan_id: string;
  features: Record<string, unknown>;
}

// =====================================================
// Helper Types for API responses
// =====================================================

/**
 * Reports API - Plan features check result
 */
export interface PlanFeaturesCheckResult {
  monthlyReport: boolean;
  advancedAnalytics: boolean;
  [key: string]: unknown;
}

/**
 * Reports API - Regeneration cap check result
 */
export interface RegenCapCheckResult {
  ok: boolean;
  message?: string;
  count?: number;
}

/**
 * Monthly Report Job Result (Edge Function response)
 */
export interface ReportJobResult {
  status: 'ok' | 'skipped' | 'error';
  reportId?: string;
  jobId?: string;
  organizationId: string;
  period: {
    monthBucket: string;
    periodStart: string;
    periodEnd: string;
  };
  currentStatus?: string;
  message: string;
}

// =====================================================
// RPC Function Signatures (for reference/documentation)
// =====================================================

/**
 * Supabase RPC function signatures
 *
 * Usage:
 * ```typescript
 * const { data, error } = await supabase.rpc('get_plan_features', { p_org_id: orgId });
 * const features = data as PlanFeaturesResult;
 * ```
 */
export type RpcFunctions = {
  get_plan_features: {
    Args: GetPlanFeaturesArgs;
    Returns: Record<string, unknown>; // jsonb
  };
  count_report_regenerations: {
    Args: CountReportRegenerationsArgs;
    Returns: number;
  };
  increment_used_count: {
    Args: IncrementUsedCountArgs;
    Returns: null; // void in PostgreSQL
  };
  fn_build_monthly_kpis: {
    Args: FnBuildMonthlyKpisArgs;
    Returns: MonthlyKpisResult;
  };
  auto_block_ip: {
    Args: AutoBlockIpArgs;
    Returns: AutoBlockIpResult; // uuid
  };
  increment_org_interview_stats: {
    Args: IncrementOrgInterviewStatsArgs;
    Returns: null; // void in PostgreSQL
  };
};

// =====================================================
// Type Predicates (Type Guards)
// =====================================================

/**
 * Type predicate for PlanFeaturesResult
 * jsonb → PlanFeaturesResult の型ガード
 */
export function isPlanFeaturesMap(value: unknown): value is PlanFeaturesResult {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  // PlanFeaturesResult はインデックスシグネチャを持つため、
  // オブジェクトであれば型として互換
  return true;
}

/**
 * Type predicate for MonthlyKpisResult
 * jsonb → MonthlyKpisResult の型ガード
 */
export function isMonthlyKpis(value: unknown): value is MonthlyKpisResult {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  // 必須フィールドの存在チェック
  return (
    typeof obj.order_count === 'number' &&
    typeof obj.revenue_cents === 'number' &&
    typeof obj.ai_usage_events === 'number'
  );
}

/**
 * Type predicate for UserOrganizationRow
 */
export function isUserOrganizationRow(value: unknown): value is UserOrganizationRow {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.user_id === 'string' &&
    typeof obj.organization_id === 'string' &&
    typeof obj.role === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.slug === 'string'
  );
}

/**
 * Type predicate for ViewOrgPlansRow
 */
export function isViewOrgPlansRow(value: unknown): value is ViewOrgPlansRow {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.organization_id === 'string' &&
    typeof obj.plan_id === 'string' &&
    obj.features !== null &&
    typeof obj.features === 'object'
  );
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * snake_case → camelCase 変換
 * DB側 jsonb のキーをコード側のキャメルケースに変換
 */
export function snakeToCamel<T extends Record<string, unknown>>(
  obj: Record<string, unknown>
): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result as T;
}

/**
 * 日付フォーマット検証 (YYYY-MM-DD)
 */
export function isValidDateFormat(value: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(value)) {
    return false;
  }
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * RPC引数の日付バリデーション
 */
export function validatePeriodArgs(
  periodStart: string,
  periodEnd: string
): { valid: boolean; error?: string } {
  if (!isValidDateFormat(periodStart)) {
    return { valid: false, error: 'Invalid period_start format (expected YYYY-MM-DD)' };
  }
  if (!isValidDateFormat(periodEnd)) {
    return { valid: false, error: 'Invalid period_end format (expected YYYY-MM-DD)' };
  }
  if (new Date(periodStart) > new Date(periodEnd)) {
    return { valid: false, error: 'period_start must be before period_end' };
  }
  return { valid: true };
}
