/**
 * Feature Metadata Library - 機能メタデータ取得・ゲート情報生成
 *
 * 目的:
 * - 静的メタデータ (FEATURE_METADATA_MAP) と動的情報 (プラン・クォータ) を統合
 * - FeatureGateUI コンポーネントが必要とする情報を一括取得
 * - 管理者設定 (feature_overrides) を壊さない
 *
 * 依存関係:
 * - @/types/feature-metadata (型定義 + 静的データ)
 * - @/config/plans (PLAN_PRICES, PLAN_NAMES)
 * - @/lib/featureGate (canUseFeature, fetchOrgQuotaUsage)
 */

import {
  FEATURE_METADATA_MAP,
  PLAN_BENEFITS,
  type FeatureMetadata,
  type FeatureGateInfo,
  type QuotaInfo,
  type PlanBenefit,
  type FeatureKey,
} from '@/types/feature-metadata';
import { PLAN_PRICES, PLAN_NAMES, type PlanType } from '@/config/plans';

// =====================================================
// プラン階層定義
// =====================================================

/** プラン階層（下位 → 上位の順） */
const PLAN_HIERARCHY: PlanType[] = ['trial', 'starter', 'pro', 'business', 'enterprise'];

/**
 * プランの階層レベルを取得
 * @param plan プラン種別
 * @returns 階層レベル（0 = trial, 4 = enterprise）
 */
function getPlanLevel(plan: PlanType): number {
  const level = PLAN_HIERARCHY.indexOf(plan);
  return level >= 0 ? level : 0;
}

/**
 * プランAがプランB以上かどうかを判定
 */
export function isPlanAtLeast(plan: PlanType, minimumPlan: PlanType): boolean {
  return getPlanLevel(plan) >= getPlanLevel(minimumPlan);
}

// =====================================================
// 静的メタデータ取得
// =====================================================

/**
 * 機能キーからメタデータを取得
 * @param featureKey 機能キー（例: 'ai_reports'）
 * @returns メタデータ、または null（未定義の場合）
 */
export function getFeatureMetadata(featureKey: string): FeatureMetadata | null {
  return FEATURE_METADATA_MAP[featureKey] ?? null;
}

/**
 * 全機能のメタデータを取得
 */
export function getAllFeatureMetadata(): Record<string, FeatureMetadata> {
  return FEATURE_METADATA_MAP;
}

/**
 * カテゴリで絞り込んだメタデータを取得
 */
export function getFeatureMetadataByCategory(
  category: FeatureMetadata['category']
): FeatureMetadata[] {
  return Object.values(FEATURE_METADATA_MAP).filter(
    (meta) => meta.category === category
  );
}

// =====================================================
// アップグレード先プラン推論
// =====================================================

/**
 * 現在のプランから、指定機能が利用可能な次のプランを取得
 *
 * @param currentPlan 現在のプラン
 * @param featureKey 機能キー
 * @returns アップグレード先プラン、または null（既に利用可能な場合）
 */
export function getNextPlanWithFeature(
  currentPlan: PlanType,
  featureKey: string
): PlanType | null {
  const metadata = getFeatureMetadata(featureKey);
  if (!metadata) return null;

  const currentLevel = getPlanLevel(currentPlan);
  const requiredLevel = getPlanLevel(metadata.availableFrom);

  // 既に利用可能な場合
  if (currentLevel >= requiredLevel) {
    return null;
  }

  // 必要なプランを返す
  return metadata.availableFrom;
}

/**
 * 指定機能に対するアップグレード情報を取得
 */
export function getUpgradeInfo(
  currentPlan: PlanType,
  featureKey: string
): {
  upgradePlan: PlanType | null;
  upgradePlanName: string | null;
  upgradePlanPrice: number | null;
  benefits: PlanBenefit[];
} {
  const upgradePlan = getNextPlanWithFeature(currentPlan, featureKey);

  if (!upgradePlan) {
    return {
      upgradePlan: null,
      upgradePlanName: null,
      upgradePlanPrice: null,
      benefits: [],
    };
  }

  return {
    upgradePlan,
    upgradePlanName: PLAN_NAMES[upgradePlan],
    upgradePlanPrice: PLAN_PRICES[upgradePlan],
    benefits: PLAN_BENEFITS[upgradePlan] || [],
  };
}

// =====================================================
// 動的ゲート情報取得（サーバーサイド専用）
// =====================================================

/**
 * 組織の機能ゲート情報を取得（サーバーサイド専用）
 *
 * 注意: この関数はサーバーサイドでのみ呼び出し可能
 * クライアントからは /api/dashboard/init 経由で取得する
 *
 * @param orgId 組織ID
 * @param featureKey 機能キー
 * @param currentPlan 現在のプラン（省略時は判定のみ）
 * @returns FeatureGateInfo
 */
export async function getFeatureGateInfo(
  orgId: string,
  featureKey: string,
  currentPlan: PlanType
): Promise<FeatureGateInfo> {
  // 静的メタデータを取得
  const metadata = getFeatureMetadata(featureKey);
  if (!metadata) {
    // 未定義の機能キーの場合はフォールバック
    return {
      available: false,
      metadata: {
        key: featureKey,
        displayName: featureKey,
        description: '',
        category: 'settings',
        controlType: 'on_off',
        availableFrom: 'enterprise',
      },
      currentPlan,
      currentPlanName: PLAN_NAMES[currentPlan],
    };
  }

  // サーバーサイドで機能利用可否を判定
  let available = false;
  let quota: QuotaInfo | undefined;

  try {
    // 動的インポートでサーバーサイドモジュールを読み込み
    const { canUseFeature, fetchOrgQuotaUsage } = await import('@/lib/featureGate');

    // 機能利用可否を判定（管理者オーバーライドを含む）
    available = await canUseFeature(orgId, featureKey);

    // クォータ型の機能の場合、使用量も取得
    if (metadata.controlType === 'limit_number') {
      const quotaResult = await fetchOrgQuotaUsage(orgId, featureKey);
      if (quotaResult.data) {
        const data = quotaResult.data;
        quota = {
          used: data.usage.usedInWindow,
          limit: data.limits.effectiveLimit,
          unlimited: data.limits.unlimited,
          resetDate: data.window.end?.toISOString(),
          period: data.window.type,
        };

        // クォータ上限到達時は available を false に
        if (!data.limits.unlimited && data.usage.usedInWindow >= data.limits.effectiveLimit) {
          // ただし、機能自体が無効化されている場合のみ
          // (limit_number型は機能自体はアクセス可能でクォータのみ制限される場合がある)
        }
      }
    }
  } catch (err) {
    // サーバーサイドモジュール読み込み失敗時はフォールバック
    // プラン階層から判定
    available = isPlanAtLeast(currentPlan, metadata.availableFrom);
    console.warn('[feature-metadata] Dynamic import failed, falling back to plan hierarchy:', err);
  }

  // アップグレード情報を取得
  const upgradeInfo = available
    ? { upgradePlan: null, upgradePlanName: null, upgradePlanPrice: null, benefits: [] }
    : getUpgradeInfo(currentPlan, featureKey);

  return {
    available,
    metadata,
    currentPlan,
    currentPlanName: PLAN_NAMES[currentPlan],
    upgradePlan: upgradeInfo.upgradePlan ?? undefined,
    upgradePlanName: upgradeInfo.upgradePlanName ?? undefined,
    upgradePlanPrice: upgradeInfo.upgradePlanPrice ?? undefined,
    quota,
  };
}

/**
 * 複数機能のゲート情報を一括取得（サーバーサイド専用）
 *
 * @param orgId 組織ID
 * @param featureKeys 機能キー配列
 * @param currentPlan 現在のプラン
 * @returns FeatureGateInfo の配列
 */
export async function getMultipleFeatureGateInfo(
  orgId: string,
  featureKeys: string[],
  currentPlan: PlanType
): Promise<Record<string, FeatureGateInfo>> {
  const results: Record<string, FeatureGateInfo> = {};

  // 並列で取得
  await Promise.all(
    featureKeys.map(async (key) => {
      results[key] = await getFeatureGateInfo(orgId, key, currentPlan);
    })
  );

  return results;
}

// =====================================================
// クライアントサイド用ヘルパー（静的情報のみ）
// =====================================================

/**
 * プラン別の特典リストを取得
 */
export function getPlanBenefits(plan: PlanType): PlanBenefit[] {
  return PLAN_BENEFITS[plan] || [];
}

/**
 * 機能に対する特典を強調表示したリストを取得
 */
export function getPlanBenefitsWithHighlight(
  plan: PlanType,
  featureKey: string
): PlanBenefit[] {
  const benefits = PLAN_BENEFITS[plan] || [];
  const metadata = getFeatureMetadata(featureKey);
  if (!metadata) return benefits;

  // 対象機能を先頭に移動し、isTargetFeature をマーク
  const targetBenefit = benefits.find(
    (b) => b.text.includes(metadata.displayName) || b.isTargetFeature
  );

  if (targetBenefit) {
    return [
      { ...targetBenefit, isTargetFeature: true },
      ...benefits.filter((b) => b !== targetBenefit),
    ];
  }

  return benefits;
}

/**
 * プランの価格を取得
 */
export function getPlanPrice(plan: PlanType): number {
  return PLAN_PRICES[plan];
}

/**
 * プランの表示名を取得
 */
export function getPlanDisplayName(plan: PlanType): string {
  return PLAN_NAMES[plan];
}

/**
 * 全プランの情報を取得（比較表示用）
 */
export function getAllPlansInfo(): Array<{
  plan: PlanType;
  name: string;
  price: number;
  benefits: PlanBenefit[];
}> {
  return PLAN_HIERARCHY.map((plan) => ({
    plan,
    name: PLAN_NAMES[plan],
    price: PLAN_PRICES[plan],
    benefits: PLAN_BENEFITS[plan] || [],
  }));
}

// =====================================================
// エクスポート型
// =====================================================

export type { FeatureMetadata, FeatureGateInfo, QuotaInfo, PlanBenefit, FeatureKey };
