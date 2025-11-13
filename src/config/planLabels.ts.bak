/**
 * プラン名の統一定数
 * 全ページで一貫した英語表記を保証
 */

export const PLAN_LABELS = {
  trial: 'Trial',
  starter: 'Starter', 
  pro: 'Pro',
  business: 'Business',
  enterprise: 'Enterprise'
} as const;

export type PlanLabelKey = keyof typeof PLAN_LABELS;

/**
 * プラン名を統一表記で取得
 */
export function getPlanLabel(planKey: string): string {
  return PLAN_LABELS[planKey as PlanLabelKey] || planKey;
}

/**
 * 価格表記の統一フォーマット
 */
export function formatPriceLabel(price: string, showTax: boolean = true): string {
  if (showTax) {
    return `${price}（税別）/月`;
  }
  return `${price}/月`;
}