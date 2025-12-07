/**
 * 組織機能制御モジュールの統一エクスポート
 */

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