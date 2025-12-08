/**
 * 組織機能制御モジュールの統一エクスポート
 */

// 既存の非同期DB参照ヘルパー（get_effective_org_features RPC使用）
export {
  getEffectiveOrgFeatures,
  canUseFeature,
  getFeatureLimit,
  getFeatureLevel,
  isFeatureLimitReached,
  normalizeFeatureKey,
  type EffectiveOrgFeatures,
  type FeatureConfig,
  type FeatureKey,
} from './effective-features';

// Phase 3-D: 新規RPC統合API（RPC優先、フォールバック付き）
export {
  fetchEffectiveOrgFeatures,
  normalizeEffectiveOrgFeaturesResponse,
  canUseFeatureFromOrgAsync,
  getMultipleFeatureFlagsFromOrgAsync,
} from './effective-features';

// 新規: 型安全な同期ヘルパー（organizations行データ直接使用）
// NOTE: [足場づくり] 新規コード推奨、既存コードの段階移行用
export {
  getFeatureFlagFromOrg,
  getPlanFromOrg,
  getMultipleFeatureFlagsFromOrg,
  isPlanFeatureEnabled,
  canUseFeatureFromOrg,
} from './features';

// Phase 4-A: Quota/Usage インフラ（Supabase get_org_quota_usage RPC使用）
export {
  fetchOrgQuotaUsage,
  isFeatureQuotaLimitReached,
} from './quota';