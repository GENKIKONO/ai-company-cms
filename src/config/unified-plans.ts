/**
 * AIOHub 統一価格設定
 * 
 * ⚠️ 価格の唯一の参照元（Single Source of Truth）
 * 全ての価格表示、Stripe設定、JSON-LD構造化データは必ずこのファイルを参照すること
 * 
 * 正しい価格体系:
 * - starter: ¥2,980/月
 * - pro: ¥8,000/月  
 * - business: ¥15,000/月
 * - enterprise: ¥30,000~/月
 */

import { PLAN_LIMITS, PLAN_FEATURES, PLAN_NAMES, type PlanType } from './plans';

import { logger } from '@/lib/log';
/**
 * 統一価格定義 - 全システムの価格参照元
 */
export const UNIFIED_PRICES = {
  trial: 0,
  starter: 2980,    // ✅ 正しい価格
  pro: 8000,        // ✅ 正しい価格
  business: 15000,  // ✅ 正しい価格
  enterprise: 30000 // ✅ 正しい価格（～表記）
} as const;

/**
 * 表示用価格フォーマット
 */
export const UNIFIED_DISPLAY_PRICES = {
  trial: '無料',
  starter: '¥2,980（税込）',
  pro: '¥8,000（税込）',
  business: '¥15,000（税込）',
  enterprise: '¥30,000〜（税込）'
} as const;

/**
 * Stripe用価格（セント変換）
 */
export const UNIFIED_STRIPE_PRICES = {
  trial: null, // 無料プランはStripe対象外
  starter: UNIFIED_PRICES.starter * 100,    // 298,000セント
  pro: UNIFIED_PRICES.pro * 100,            // 800,000セント
  business: UNIFIED_PRICES.business * 100,  // 1,500,000セント
  enterprise: UNIFIED_PRICES.enterprise * 100 // 3,000,000セント
} as const;

/**
 * 完全なプラン設定（既存設定と統合）
 */
export const UNIFIED_PLAN_CONFIG = {
  trial: {
    id: 'trial' as const,
    name: PLAN_NAMES.trial,
    price: UNIFIED_PRICES.trial,
    displayPrice: UNIFIED_DISPLAY_PRICES.trial,
    stripePrice: UNIFIED_STRIPE_PRICES.trial,
    limits: PLAN_LIMITS.trial,
    features: PLAN_FEATURES.trial,
    period: '14日間',
    stripePriceId: null as string | null  // Stripe price_id（実際の値は後で設定）
  },
  starter: {
    id: 'starter' as const,
    name: PLAN_NAMES.starter,
    price: UNIFIED_PRICES.starter,
    displayPrice: UNIFIED_DISPLAY_PRICES.starter,
    stripePrice: UNIFIED_STRIPE_PRICES.starter,
    limits: PLAN_LIMITS.starter,
    features: PLAN_FEATURES.starter,
    period: '月額',
    stripePriceId: null as string | null  // Stripe price_id（実際の値は後で設定）
  },
  pro: {
    id: 'pro' as const,
    name: PLAN_NAMES.pro,
    price: UNIFIED_PRICES.pro,
    displayPrice: UNIFIED_DISPLAY_PRICES.pro,
    stripePrice: UNIFIED_STRIPE_PRICES.pro,
    limits: PLAN_LIMITS.pro,
    features: PLAN_FEATURES.pro,
    period: '月額',
    stripePriceId: null as string | null  // Stripe price_id（実際の値は後で設定）
  },
  business: {
    id: 'business' as const,
    name: PLAN_NAMES.business,
    price: UNIFIED_PRICES.business,
    displayPrice: UNIFIED_DISPLAY_PRICES.business,
    stripePrice: UNIFIED_STRIPE_PRICES.business,
    limits: PLAN_LIMITS.business,
    features: PLAN_FEATURES.business,
    period: '月額',
    stripePriceId: null as string | null  // Stripe price_id（実際の値は後で設定）
  },
  enterprise: {
    id: 'enterprise' as const,
    name: PLAN_NAMES.enterprise,
    price: UNIFIED_PRICES.enterprise,
    displayPrice: UNIFIED_DISPLAY_PRICES.enterprise,
    stripePrice: UNIFIED_STRIPE_PRICES.enterprise,
    limits: PLAN_LIMITS.enterprise,
    features: PLAN_FEATURES.enterprise,
    period: '月額',
    isCustom: true,
    stripePriceId: null as string | null  // Stripe price_id（実際の値は後で設定）
  }
} as const;

export type UnifiedPlanType = keyof typeof UNIFIED_PLAN_CONFIG;

/**
 * 価格取得ヘルパー関数
 */
export function getUnifiedPrice(planType: PlanType): number {
  return UNIFIED_PRICES[planType];
}

/**
 * 表示価格取得ヘルパー関数
 */
export function getUnifiedDisplayPrice(planType: PlanType): string {
  return UNIFIED_DISPLAY_PRICES[planType];
}

/**
 * Stripe価格取得ヘルパー関数
 */
export function getUnifiedStripePrice(planType: PlanType): number | null {
  return UNIFIED_STRIPE_PRICES[planType];
}

/**
 * 価格整合性チェック（開発時デバッグ用）
 */
export function validatePriceConsistency(): boolean {
  const expectedPrices = {
    starter: 2980,
    pro: 8000,
    business: 15000,
    enterprise: 30000
  };

  for (const [planType, expectedPrice] of Object.entries(expectedPrices)) {
    const actualPrice = UNIFIED_PRICES[planType as PlanType];
    if (actualPrice !== expectedPrice) {
      logger.error(`価格不整合検出: ${planType} expected:${expectedPrice} actual:${actualPrice}`);
      return false;
    }
  }

  logger.info('価格整合性チェック: OK');
  return true;
}

// 開発時に価格整合性をチェック
if (process.env.NODE_ENV === 'development') {
  validatePriceConsistency();
}