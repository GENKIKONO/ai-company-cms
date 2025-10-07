/**
 * LuxuCare CMS プラン設定
 * 料金・制限・機能の一元管理
 */

export const PLAN_LIMITS = {
  free: { services: 1 },
  standard: { services: 50 },
  enterprise: { services: Number.POSITIVE_INFINITY }
} as const;

export const PLAN_PRICES = {
  free: 0,
  standard: 9800,
  enterprise: null // お問い合わせ
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

/**
 * プラン名（表示用）
 */
export const PLAN_NAMES = {
  free: '無料プラン',
  standard: 'スタンダード',
  enterprise: 'エンタープライズ'
} as const;

/**
 * プラン機能リスト
 */
export const PLAN_FEATURES = {
  free: [
    '基本的な企業情報管理',
    'サービス登録：1件まで',
    'SEO最適化',
    'AIが読み取りやすい構造で自動出力'
  ],
  standard: [
    'サービス登録：50件まで',
    'AIが読み取りやすい構造で自動出力',
    '詳細分析・レポート',
    'メールサポート'
  ],
  enterprise: [
    'すべての機能',
    'カスタム機能開発',
    '専任サポート',
    'SLA保証'
  ]
} as const;

/**
 * 価格表示フォーマッター
 */
export function formatPrice(planType: PlanType): string {
  const price = PLAN_PRICES[planType];
  if (price === null) return 'お問い合わせ';
  if (price === 0) return '無料';
  return `¥${price.toLocaleString()}/月`;
}

/**
 * サービス制限チェック
 */
export function isServiceLimitReached(planType: PlanType, currentCount: number): boolean {
  const limit = PLAN_LIMITS[planType].services;
  return currentCount >= limit;
}

/**
 * サービス制限メッセージ
 */
export function getServiceLimitMessage(planType: PlanType): string {
  const limit = PLAN_LIMITS[planType].services;
  if (limit === Number.POSITIVE_INFINITY) return '';
  return `ご契約プラン（${PLAN_NAMES[planType]}）の上限に達しています（サービス登録上限: ${limit}件）。`;
}