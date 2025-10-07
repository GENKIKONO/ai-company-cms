/**
 * LuxuCare CMS プラン設定
 * 料金・制限・機能の一元管理
 */

export const PLAN_LIMITS = {
  free: { 
    services: 1, 
    materials: 0, 
    embeds: 1,
    external_links: 0,
    category_tags: 0,
    logo_size: 'small',
    verified_badge: false,
    ai_reports: false
  },
  standard: { 
    services: 50, 
    materials: 10, 
    embeds: 10,
    external_links: Number.POSITIVE_INFINITY,
    category_tags: Number.POSITIVE_INFINITY,
    logo_size: 'large',
    verified_badge: true,
    ai_reports: 'basic'
  },
  enterprise: { 
    services: Number.POSITIVE_INFINITY, 
    materials: Number.POSITIVE_INFINITY, 
    embeds: Number.POSITIVE_INFINITY,
    external_links: Number.POSITIVE_INFINITY,
    category_tags: Number.POSITIVE_INFINITY,
    logo_size: 'large_svg',
    verified_badge: true,
    ai_reports: 'advanced'
  }
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
    'SEO最適化・構造化データ出力',
    '外部埋め込み：1個まで',
    '小サイズ企業ロゴ'
  ],
  standard: [
    'サービス登録：50件まで',
    '営業資料添付（最大10個）',
    '外部リンク表示機能',
    'カテゴリタグ検索対応',
    '外部埋め込み：10個まで',
    '大サイズ企業ロゴ',
    'Verified法人バッジ',
    'AI解析レポート（基本版）',
    'メールサポート'
  ],
  enterprise: [
    'すべての機能無制限',
    'SVG対応大サイズロゴ',
    'AI解析レポート（拡張版）',
    'カスタム機能開発',
    '専任サポート',
    'SLA保証',
    'ホワイトラベル対応'
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

/**
 * 営業資料制限チェック
 */
export function isMaterialLimitReached(planType: PlanType, currentCount: number): boolean {
  const limit = PLAN_LIMITS[planType].materials;
  return currentCount >= limit;
}

/**
 * 営業資料制限メッセージ
 */
export function getMaterialLimitMessage(planType: PlanType): string {
  const limit = PLAN_LIMITS[planType].materials;
  if (limit === Number.POSITIVE_INFINITY) return '';
  return `ご契約プラン（${PLAN_NAMES[planType]}）の上限に達しています（営業資料添付上限: ${limit}個）。`;
}

/**
 * 外部埋め込み制限チェック
 */
export function isEmbedLimitReached(planType: PlanType, currentCount: number): boolean {
  const limit = PLAN_LIMITS[planType].embeds;
  return currentCount >= limit;
}

/**
 * 外部埋め込み制限メッセージ
 */
export function getEmbedLimitMessage(planType: PlanType): string {
  const limit = PLAN_LIMITS[planType].embeds;
  if (limit === Number.POSITIVE_INFINITY) return '';
  return `ご契約プラン（${PLAN_NAMES[planType]}）の上限に達しています（外部埋め込み上限: ${limit}個）。`;
}

/**
 * 外部リンク表示制限チェック
 */
export function isExternalLinksAllowed(planType: PlanType): boolean {
  return PLAN_LIMITS[planType].external_links > 0;
}

/**
 * カテゴリタグ検索制限チェック
 */
export function isCategoryTagsAllowed(planType: PlanType): boolean {
  return PLAN_LIMITS[planType].category_tags > 0;
}

/**
 * ロゴサイズ取得
 */
export function getLogoSizeLimit(planType: PlanType): string {
  return PLAN_LIMITS[planType].logo_size;
}

/**
 * Verified法人バッジ表示チェック
 */
export function isVerifiedBadgeAllowed(planType: PlanType): boolean {
  return PLAN_LIMITS[planType].verified_badge;
}

/**
 * AI解析レポート機能チェック
 */
export function getAIReportsLevel(planType: PlanType): string | boolean {
  return PLAN_LIMITS[planType].ai_reports;
}