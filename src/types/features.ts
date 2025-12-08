/**
 * Supabaseベースの機能フラグ／プラン権限の型定義
 * 
 * NOTE: Supabase の feature_registry / plan_features テーブルと厳密に整合性を保つ
 * 2024年12月時点での実データに基づく定義
 */

// Supabase の feature_registry.feature_key に対応するキー一覧（実データベース）
// ※ 以下は Supabase で確認済みの全feature_key
// 2024年12月追加: embeds (limit_number) / ai_interview (on_off) も正式登録済み
export type SupabaseFeatureKey =
  | 'advanced_analytics'
  | 'advanced_permissions'
  | 'ai_bot_analytics'
  | 'ai_interview'           // ✅ 2024年12月 正式登録 (control_type: on_off)
  | 'ai_reports'
  | 'ai_visibility_analytics'
  | 'audit_logging'
  | 'basic_analytics'
  | 'basic_brand_settings'
  | 'case_studies'
  | 'custom_brand_colors'
  | 'embeds'                 // ✅ 2024年12月 正式登録 (control_type: limit_number)
  | 'faqs'
  | 'material_download_tracking'
  | 'materials'
  | 'organization_profile'
  | 'posts'
  | 'services'
  | 'structured_data_output'
  | 'system_monitoring'
  | 'team_management'
  | 'verified_badge';

// TODO: [FEATURE_KEY_MISMATCH] 既存コードで使用されているが Supabase に存在しない feature_key
// 段階移行のため一時的に保持、将来的に Supabase ベースに統一すること
export type LegacyFeatureKey =
  | 'ai_visibility'        // → ai_visibility_analytics に統一予定
  | 'business_matching'    // → 未使用なら削除、使用中なら Supabase に追加検討
  | 'service_gallery'     // → 未使用なら削除
  | 'service_video'       // → 未使用なら削除
  | 'faq_module'          // → faqs に統一予定
  | 'qa_items'            // → posts または独立機能として Supabase 追加検討
  | 'approval_flow'       // → advanced_permissions に統合検討
  | 'embed_widget';       // → embeds と重複、統一検討
  // NOTE: embeds / ai_interview は SupabaseFeatureKey に移動済み（2024年12月正式登録）

// 統一型（段階移行用）
export type FeatureKey = SupabaseFeatureKey | LegacyFeatureKey;

// organizations.feature_flags(JSONB) の型安全なラッパー
// NOTE: 既存の Record<string, unknown> から段階移行するための過渡期型
export type FeatureFlags = {
  [K in FeatureKey]?: boolean | null;
} & {
  // 既存の未知キーも壊さないためのフォールバック
  // TODO: [FEATURE_MIGRATION] 全機能移行後は this index signature を削除
  [key: string]: unknown;
};

// Supabase plan_features.plan_type の実データ
export type SupabasePlanType = 'starter' | 'pro' | 'business' | 'enterprise';

// TODO: [PLAN_TYPE_MISMATCH] 既存コードで使用されているが Supabase に存在しない plan_type
export type LegacyPlanType = 'trial' | 'free';

// 統一型（段階移行用）
export type PlanType = SupabasePlanType | LegacyPlanType;

// Supabase feature_registry.control_type の実データ
export type FeatureControlType = 'on_off' | 'limit_number';

// Supabase plan_features.config_value の実構造に基づく正規化型

// control_type = 'on_off' の場合: {"enabled": boolean}
export interface OnOffFeatureConfig {
  controlType: 'on_off';
  enabled: boolean;
}

// control_type = 'limit_number' の場合: {"limit": number} (無制限は -1)
export interface LimitNumberFeatureConfig {
  controlType: 'limit_number';
  limit: number;
  unlimited: boolean; // limit === -1 の派生フラグ
}

// 正規化された機能設定（Supabase 実構造ベース）
export type NormalizedFeatureConfig = OnOffFeatureConfig | LimitNumberFeatureConfig;

// 組織の機能設定マップ
export type NormalizedFeatureMap = Partial<Record<FeatureKey, NormalizedFeatureConfig>>;

// =============================================================================
// get_effective_org_features RPC 戻り値型
// =============================================================================

// RPC戻り値用の拡張型（source フィールドを含む）
export interface RpcOnOffFeatureConfig {
  controlType: 'on_off';
  enabled: boolean;
  source: 'plan' | 'entitlements' | 'feature_flags';
}

export interface RpcLimitNumberFeatureConfig {
  controlType: 'limit_number';
  limit: number; // -1 は無制限
  source: 'plan' | 'entitlements' | 'feature_flags';
}

export type RpcFeatureConfig = RpcOnOffFeatureConfig | RpcLimitNumberFeatureConfig;

// get_effective_org_features RPC の戻り値構造
export interface EffectiveOrgFeaturesResponse {
  plan: SupabasePlanType; // 'free' は 'starter' に正規化済み
  features: Record<string, RpcFeatureConfig>; // feature_key → config のマップ
  version: number; // 常に 1 の想定
  updated_at: string; // ISO8601 形式
}

// TODO: [LEGACY_FEATURE_CONFIG] 下記は既存コードとの互換性のため保持、将来削除予定
// 現在のコードが期待する柔軟な構造（段階移行用）
export interface FeatureConfig {
  enabled: boolean;
  limit?: number | null;
  level?: string | null;
  // TODO: [SUPABASE_MISMATCH] 'limits' プロパティは Supabase に存在しない
  // 既存の effective-features.ts で使用されているため一時保持
  limits?: any;
  [key: string]: any;
}

// =============================================================================
// 正規化ヘルパー関数型
// =============================================================================

// Supabase plan_features テーブルの行データ型
export interface PlanFeatureRow {
  plan_type: SupabasePlanType;
  feature_key: FeatureKey;
  config_value: Record<string, any>; // Supabase の JSONB
}

// feature_registry テーブルの行データ型
export interface FeatureRegistryRow {
  feature_key: FeatureKey;
  control_type: FeatureControlType;
  description?: string;
}

// =============================================================================
// Quota / Usage 関連型定義（Phase 4-A）
// =============================================================================

// get_org_quota_usage RPC 生レスポンス型（snake_case のまま）
export interface OrgQuotaUsageRpcResponse {
  organization_id: string;
  feature: SupabaseFeatureKey;
  window: {
    type: string;          // 現状 "calendar_month"
    start: string | null;  // ISO8601 or null
    end: string | null;    // ISO8601 or null
  };
  limits: {
    effective_limit: number;                // -1 は無制限
    unlimited: boolean;                     // limit = -1 の場合 true
    source: 'plan' | 'entitlements';        // feature_flags は対象外
  };
  usage: {
    used_in_window: number;
    remaining: number | null;               // unlimited=true の場合 null 想定
  };
  meta?: {
    plan?: SupabasePlanType | null;
  } | null;
  version: number;
  updated_at: string;                       // ISO8601
}

// アプリ内で使いやすい正規化型（camelCase / Date 変換）
export interface NormalizedOrgQuotaUsage {
  organizationId: string;
  feature: SupabaseFeatureKey;
  window: {
    type: 'calendar_month' | string;
    start: Date | null;
    end: Date | null;
  };
  limits: {
    effectiveLimit: number;                 // -1 をそのまま保持
    unlimited: boolean;
    source: 'plan' | 'entitlements';
  };
  usage: {
    usedInWindow: number;
    remaining: number | null;
  };
  plan: SupabasePlanType | null;
  version: number;
  updatedAt: Date;
}