/**
 * 課金・プラン管理ユーティリティ
 *
 * 【役割分担】
 * - このモジュール: Admin CRUD、プラン管理、サブスクリプション、アナリティクス
 * - featureGate.ts: 機能ゲート、クォータ判定、ランタイム強制
 *
 * 【DB依存関係】
 * - RPC: is_site_admin() → boolean
 * - RPC: get_current_plan_for_user(user_id uuid) → uuid (plan_id)
 * - テーブル: plans, features, plan_features_v2, feature_limits_v2
 * - テーブル: user_subscriptions, feature_flags, usage_counters, analytics_events
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getUserWithClient } from '@/lib/core/auth-state';

// =============================================================================
// Re-exports from featureGate (統一API)
// =============================================================================
// 機能ゲート・クォータ関連は featureGate.ts が正規のソース
export {
  // Types
  type QuotaResult,
  type QuotaResultCode,
  type EffectiveFeature,
  type FeatureSet,
  type Subject,
  // ★ NEW: Subject型API（推奨）
  getEffectiveFeatures,
  canExecute,
  clearSubjectCache,
  // ★ DEPRECATED: 旧API（互換性のため残存）
  /** @deprecated use getEffectiveFeatures(subject) */
  getFeatureSetForUser,
  /** @deprecated use getEffectiveFeatures(subject) */
  isFeatureEnabled as checkFeatureEnabled,
  /** @deprecated use getEffectiveFeatures(subject) */
  getFeatureConfig as getFeatureConfigFromGate,
  /** @deprecated use getEffectiveFeatures(subject) */
  getFeatureLimit,
  /** @deprecated use canExecute(subject, ...) */
  checkAndConsumeQuota as checkAndConsumeQuotaUnified,
  /** @deprecated use canExecute(subject, ...) */
  guardWithQuota as guardWithQuotaUnified,
  /** @deprecated use getEffectiveFeatures(subject) */
  guardWithFeature,
  /** @deprecated use clearSubjectCache(subject) */
  clearFeatureCache,
  // Errors
  QuotaError,
  FeatureDisabledError as FeatureGateDisabledError,
} from '@/lib/featureGate';

// =============================================================================
// Types
// =============================================================================

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'active' | 'deprecated' | 'draft';
  sort_order: number;
  monthly_price: number | null;
  yearly_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface Feature {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string | null;
  status: 'active' | 'deprecated' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface PlanFeature {
  id: string;
  plan_id: string;
  feature_id: string;
  is_enabled: boolean;
  is_required: boolean;
  display_order: number;
  default_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FeatureLimit {
  id: string;
  plan_id: string;
  feature_id: string;
  limit_key: string;
  limit_value: number;
  period: 'monthly' | 'yearly' | 'lifetime' | null;
  reset_day: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';
  starts_at: string;
  ends_at: string | null;
  canceled_at: string | null;
  org_id: string | null; // 将来のorg課金用
  created_at: string;
  updated_at: string;
}

export interface FeatureConfig {
  enabled: boolean;
  config: Record<string, unknown>;
  limits: Record<string, number>;
}

/**
 * @deprecated QuotaResult from featureGate.ts を使用してください
 */
export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number | null;
  limit: number | null;
  period: string | null;
}

// =============================================================================
// Server-side Utilities
// =============================================================================

/**
 * サイト管理者かどうかをチェック
 * DBの `is_site_admin()` 関数を呼び出し（Core経由）
 *
 * @deprecated `@/lib/core/auth-state` の `isSiteAdminWithClient` を使用してください
 * @param supabase - Supabaseクライアント
 * @returns サイト管理者であればtrue
 */
export { isSiteAdminWithClient as isSiteAdmin } from '@/lib/core/auth-state';

/**
 * サイト管理者権限を要求（権限がない場合はエラーをスロー）
 *
 * @param supabase - Supabaseクライアント
 * @throws SiteAdminRequiredError - サイト管理者でない場合
 */
export async function requireSiteAdmin(supabase: SupabaseClient): Promise<void> {
  const { isSiteAdminWithClient } = await import('@/lib/core/auth-state');
  const isAdmin = await isSiteAdminWithClient(supabase);
  if (!isAdmin) {
    throw new SiteAdminRequiredError();
  }
}

/**
 * 現在のプランIDを取得
 *
 * @param supabase - Supabaseクライアント
 * @param userId - ユーザーID（省略時は現在のユーザー）
 * @param orgId - 組織ID（将来のマルチテナンシ用、現在は未使用）
 * @returns プランID または null
 */
export async function getCurrentPlanId(
  supabase: SupabaseClient,
  userId?: string,
  orgId?: string | null
): Promise<string | null> {
  try {
    // userIdが指定されていない場合は現在のユーザーを取得（Core正本経由）
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await getUserWithClient(supabase);
      if (!user) return null;
      targetUserId = user.id;
    }

    // orgIdが指定されている場合は組織のプランを取得（将来対応）
    // 現在はユーザーのプランのみ対応
    const { data, error } = await supabase.rpc('get_current_plan_for_user', {
      user_id: targetUserId,
      // p_org_id: orgId || null, // RPC側対応後に有効化
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[billing] getCurrentPlanId RPC error:', error);
      return null;
    }

    return data as string | null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[billing] getCurrentPlanId error:', err);
    return null;
  }
}

/**
 * 現在のプラン情報を取得
 *
 * @param supabase - Supabaseクライアント
 * @param userId - ユーザーID（省略時は現在のユーザー）
 * @param orgId - 組織ID（将来のマルチテナンシ用）
 * @returns プラン情報 または null
 */
export async function getCurrentPlan(
  supabase: SupabaseClient,
  userId?: string,
  orgId?: string | null
): Promise<Plan | null> {
  const planId = await getCurrentPlanId(supabase, userId, orgId);
  if (!planId) return null;

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[billing] getCurrentPlan error:', error);
    return null;
  }

  return data as Plan;
}

/**
 * 機能設定を取得
 *
 * @deprecated getFeatureConfigFromGate または getFeatureSetForUser を使用してください
 * @param supabase - Supabaseクライアント
 * @param featureKey - 機能キー
 * @param userId - ユーザーID（省略時は現在のユーザー）
 * @param _orgId - 組織ID（将来のマルチテナンシ用、現在は未使用）
 * @returns 機能設定 または null
 */
export async function getFeatureConfig(
  supabase: SupabaseClient,
  featureKey: string,
  userId?: string,
  _orgId?: string | null
): Promise<FeatureConfig | null> {
  try {
    // userIdが指定されていない場合は現在のユーザーを取得（Core正本経由）
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await getUserWithClient(supabase);
      if (!user) return null;
      targetUserId = user.id;
    }

    const { data, error } = await supabase.rpc('get_feature_config', {
      user_id: targetUserId,
      feature_key: featureKey,
    });

    if (error) {
      console.error('[billing] getFeatureConfig RPC error:', error);
      return null;
    }

    // nullの場合は機能が無効
    if (!data) {
      return null;
    }

    // RPC結果をFeatureConfigに変換
    return data as FeatureConfig;
  } catch (err) {
    console.error('[billing] getFeatureConfig error:', err);
    return null;
  }
}

/**
 * 機能が有効かどうかをチェック
 *
 * @deprecated checkFeatureEnabled (from featureGate.ts) を使用してください
 * @param supabase - Supabaseクライアント
 * @param featureKey - 機能キー
 * @param userId - ユーザーID（省略時は現在のユーザー）
 * @param orgId - 組織ID（将来のマルチテナンシ用）
 * @returns 有効であればtrue
 */
export async function isFeatureEnabled(
  supabase: SupabaseClient,
  featureKey: string,
  userId?: string,
  orgId?: string | null
): Promise<boolean> {
  // 統一版を内部で使用
  const { isFeatureEnabled: unifiedCheck } = await import('@/lib/featureGate');
  return unifiedCheck(supabase, featureKey, userId, orgId);
}

/**
 * クォータをチェックして消費
 *
 * @deprecated checkAndConsumeQuotaUnified を使用してください（QuotaResult返却）
 * @param supabase - Supabaseクライアント
 * @param featureKey - 機能キー
 * @param amount - 消費量（デフォルト: 1）
 * @param userId - ユーザーID（省略時は現在のユーザー）
 * @param orgId - 組織ID（将来のマルチテナンシ用）
 * @returns 消費成功であればtrue
 */
export async function checkAndConsumeQuota(
  supabase: SupabaseClient,
  featureKey: string,
  amount: number = 1,
  userId?: string,
  orgId?: string | null
): Promise<boolean> {
  // 統一版を内部で使用
  const { checkAndConsumeQuota: unifiedCheck } = await import('@/lib/featureGate');
  const result = await unifiedCheck(supabase, featureKey, amount, userId, orgId);
  return result.ok;
}

/**
 * クォータガード（APIルート用）
 * クォータを消費できない場合はQuotaExceededErrorをスロー
 *
 * @deprecated guardWithQuotaUnified を使用してください（QuotaError、QuotaResult返却）
 * @param supabase - Supabaseクライアント
 * @param featureKey - 機能キー
 * @param amount - 消費量（デフォルト: 1）
 * @param userId - ユーザーID（省略時は現在のユーザー）
 * @param orgId - 組織ID（将来のマルチテナンシ用）
 * @throws QuotaExceededError - クォータ超過時
 */
export async function guardWithQuota(
  supabase: SupabaseClient,
  featureKey: string,
  amount: number = 1,
  userId?: string,
  orgId?: string | null
): Promise<void> {
  // 統一版を内部で使用し、旧エラー形式に変換
  const { checkAndConsumeQuota: unifiedCheck } = await import('@/lib/featureGate');
  const result = await unifiedCheck(supabase, featureKey, amount, userId, orgId);
  if (!result.ok) {
    throw new QuotaExceededError(featureKey);
  }
}

// =============================================================================
// Analytics Events
// =============================================================================

/**
 * アナリティクスイベントを記録
 * クォータ消費型イベントはDB側で自動記録されるため、無料/表示系イベント用
 *
 * @param supabase - Supabaseクライアント
 * @param eventKey - イベントキー（snake_case）
 * @param properties - プロパティ（8KB以内、PIIなし）
 * @param featureId - 機能ID（オプション）
 */
export async function logAnalyticsEvent(
  supabase: SupabaseClient,
  eventKey: string,
  properties: Record<string, unknown> = {},
  featureId?: string
): Promise<void> {
  try {
    // PIIチェック（簡易）
    const propsString = JSON.stringify(properties);
    if (propsString.length > 8192) {
      console.warn('[billing] Analytics event properties too large, truncating');
      properties = { error: 'properties_truncated' };
    }

    // Core正本経由でユーザー取得
    const user = await getUserWithClient(supabase);
    if (!user) {
      console.warn('[billing] Cannot log analytics event: no authenticated user');
      return;
    }

    const { error } = await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_key: eventKey,
      feature_id: featureId || null,
      properties,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[billing] Failed to log analytics event:', error);
    }
  } catch (err) {
    console.error('[billing] logAnalyticsEvent error:', err);
  }
}

// =============================================================================
// Error Classes
// =============================================================================

/**
 * サイト管理者権限が必要なエラー
 */
export class SiteAdminRequiredError extends Error {
  code = 'SITE_ADMIN_REQUIRED';
  status = 403;

  constructor() {
    super('サイト管理者権限が必要です');
    this.name = 'SiteAdminRequiredError';
  }
}

/**
 * クォータ超過エラー
 * @deprecated QuotaError (from featureGate.ts) を使用してください
 */
export class QuotaExceededError extends Error {
  code = 'QUOTA_EXCEEDED';
  status = 429;
  featureKey: string;

  constructor(featureKey: string) {
    super(`クォータ上限に達しました: ${featureKey}`);
    this.name = 'QuotaExceededError';
    this.featureKey = featureKey;
  }
}

/**
 * 機能無効エラー
 * @deprecated FeatureGateDisabledError (from featureGate.ts) を使用してください
 */
export class FeatureDisabledError extends Error {
  code = 'FEATURE_DISABLED';
  status = 403;
  featureKey: string;

  constructor(featureKey: string) {
    super(`この機能は利用できません: ${featureKey}`);
    this.name = 'FeatureDisabledError';
    this.featureKey = featureKey;
  }
}

// =============================================================================
// Re-exports
// =============================================================================

/**
 * @deprecated `@/lib/core/auth-state` の `isSiteAdminWithClient` を使用してください
 */
export { isSiteAdminWithClient as checkSiteAdmin } from '@/lib/core/auth-state';
