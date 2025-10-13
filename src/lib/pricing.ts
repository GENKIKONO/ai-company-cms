/**
 * 価格フォーマッタと新価格体系管理
 */

// 新価格体系（環境変数から価格を取得、デフォルトあり）
const BASIC_PRICE = Number(process.env.BASIC_PRICE) || 5000;
const BUSINESS_PRICE = Number(process.env.BUSINESS_PRICE) || 15000;
const ENTERPRISE_PRICE_FROM = Number(process.env.ENTERPRISE_PRICE_FROM) || 30000;
const CURRENCY = process.env.CURRENCY || 'JPY';

/**
 * 日本円を税込み表記でフォーマット
 */
export function formatJPY(n: number): string {
  return `¥${n.toLocaleString('ja-JP')}`;
}

/**
 * プラン価格情報を取得
 */
export function getBasicPrice(): number {
  return BASIC_PRICE;
}

export function getBusinessPrice(): number {
  return BUSINESS_PRICE;
}

export function getEnterprisePrice(): number {
  return ENTERPRISE_PRICE_FROM;
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
  basic: {
    price: BASIC_PRICE,
    name: 'Basic',
    displayPrice: formatJPY(BASIC_PRICE)
  },
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