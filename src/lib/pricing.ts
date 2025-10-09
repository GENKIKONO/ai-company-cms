/**
 * 価格フォーマッタとキャンペーン管理
 */

// 環境変数から価格を取得（デフォルトあり）
const CAMPAIGN_STARTER_PRICE = Number(process.env.CAMPAIGN_STARTER_PRICE) || 9800;
const STARTER_LIST_PRICE = Number(process.env.STARTER_LIST_PRICE) || 14800;
const BUSINESS_PRICE = Number(process.env.BUSINESS_PRICE) || 34800;
const ENTERPRISE_PRICE_FROM = Number(process.env.ENTERPRISE_PRICE_FROM) || 50000;
const CURRENCY = process.env.CURRENCY || 'JPY';

/**
 * 日本円を税込み表記でフォーマット
 */
export function formatJPY(n: number): string {
  return `¥${n.toLocaleString('ja-JP')}`;
}

/**
 * Starterプランのキャンペーン情報を取得
 */
export function getCampaignStarter(): {
  campaign: number;
  list: number;
  isCampaign: boolean;
} {
  return {
    campaign: CAMPAIGN_STARTER_PRICE,
    list: STARTER_LIST_PRICE,
    isCampaign: CAMPAIGN_STARTER_PRICE < STARTER_LIST_PRICE
  };
}

/**
 * 全プランの価格情報
 */
export const PRICING_CONFIG = {
  free: {
    price: 0,
    name: 'Free',
    displayPrice: '¥0'
  },
  starter: getCampaignStarter(),
  business: {
    price: BUSINESS_PRICE,
    name: 'Business',
    displayPrice: formatJPY(BUSINESS_PRICE)
  },
  enterprise: {
    priceFrom: ENTERPRISE_PRICE_FROM,
    name: 'Enterprise',
    displayPrice: `${formatJPY(ENTERPRISE_PRICE_FROM)}〜`
  }
} as const;