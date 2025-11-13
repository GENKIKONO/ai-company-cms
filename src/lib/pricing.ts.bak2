/**
 * 価格フォーマッタ - config/plans.ts のラッパー
 * 旧コードとの互換性のために残存
 */

import { PLAN_PRICES, PLAN_NAMES } from '@/config/plans';

/**
 * 日本円を税込み表記でフォーマット
 */
export function formatJPY(n: number): string {
  return `¥${n.toLocaleString('ja-JP')}（税込）`;
}

/**
 * 旧PRICING_CONFIG互換性用ラッパー
 * 注意: 新規開発では @/config/plans の PLAN_PRICES を直接使用してください
 */
export const PRICING_CONFIG = {
  trial: {
    price: PLAN_PRICES.trial,
    name: PLAN_NAMES.trial,
    displayPrice: PLAN_PRICES.trial === 0 ? '無料' : formatJPY(PLAN_PRICES.trial)
  },
  starter: {
    price: PLAN_PRICES.starter,
    name: PLAN_NAMES.starter,
    displayPrice: formatJPY(PLAN_PRICES.starter)
  },
  pro: {
    price: PLAN_PRICES.pro,
    name: PLAN_NAMES.pro,
    displayPrice: formatJPY(PLAN_PRICES.pro)
  },
  business: {
    price: PLAN_PRICES.business,
    name: PLAN_NAMES.business,
    displayPrice: formatJPY(PLAN_PRICES.business)
  },
  enterprise: {
    priceFrom: PLAN_PRICES.enterprise,
    name: PLAN_NAMES.enterprise,
    displayPrice: `${formatJPY(PLAN_PRICES.enterprise)}〜`
  }
} as const;