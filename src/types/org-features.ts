/**
 * 組織機能制御の型定義
 *
 * EffectiveOrgFeatures は /src/lib/featureGate.ts からre-export
 * 他モジュールで型のみを使いたい場合はここから import
 */

export type {
  EffectiveOrgFeatures,
  FeatureConfig,
  OrgFeatureKey as FeatureKey,  // エイリアスを元の名前で再エクスポート
} from '@/lib/featureGate';

/**
 * フォールバック情報を含むメタデータ
 */
export interface FeatureFallbackMeta {
  source: 'rpc' | 'entitlements_fallback' | 'plan_limits_fallback';
  retrieved_at: string;
  organization_id: string;
}

/**
 * 機能チェック結果（デバッグ用）
 */
export interface FeatureCheckResult {
  orgId: string;
  featureKey: string;
  normalizedKey: string | null;
  enabled: boolean;
  limit: number | null;
  level: string | null;
  source: FeatureFallbackMeta['source'];
  checkedAt: string;
}