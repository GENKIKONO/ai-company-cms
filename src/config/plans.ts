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
    ai_reports: false,
    system_monitoring: false,
    qa_items: 5,  // Q&A項目制限追加
    case_studies: 2,  // 導入事例制限追加
    posts: 5,  // 記事制限追加
    faqs: 5  // FAQ制限追加
  },
  basic: { 
    services: 10, 
    materials: 5, 
    embeds: 5,
    external_links: Number.POSITIVE_INFINITY,
    category_tags: Number.POSITIVE_INFINITY,
    logo_size: 'medium',
    verified_badge: false,
    ai_reports: false,
    system_monitoring: false,
    qa_items: 20,  // Basic: 20項目まで
    case_studies: 10,  // 導入事例制限
    posts: 50,  // 記事制限
    faqs: 20  // FAQ制限
  },
  business: { 
    services: 50, 
    materials: 20, 
    embeds: 20,
    external_links: Number.POSITIVE_INFINITY,
    category_tags: Number.POSITIVE_INFINITY,
    logo_size: 'large',
    verified_badge: true,
    ai_reports: 'basic',
    system_monitoring: true,
    qa_items: Number.POSITIVE_INFINITY,  // Business: 無制限
    case_studies: Number.POSITIVE_INFINITY,  // 導入事例無制限
    posts: Number.POSITIVE_INFINITY,  // 記事無制限
    faqs: Number.POSITIVE_INFINITY,  // FAQ無制限
    approval_flow: true,  // 承認フロー機能
    auth_badges: true,  // 認証バッジ機能
    search_console: false  // Search Console連携（未実装）
  },
  enterprise: { 
    services: Number.POSITIVE_INFINITY, 
    materials: Number.POSITIVE_INFINITY, 
    embeds: Number.POSITIVE_INFINITY,
    external_links: Number.POSITIVE_INFINITY,
    category_tags: Number.POSITIVE_INFINITY,
    logo_size: 'large_svg',
    verified_badge: true,
    ai_reports: 'advanced',
    system_monitoring: true,
    qa_items: Number.POSITIVE_INFINITY,
    case_studies: Number.POSITIVE_INFINITY,  // 導入事例無制限
    posts: Number.POSITIVE_INFINITY,  // 記事無制限
    faqs: Number.POSITIVE_INFINITY,  // FAQ無制限
    approval_flow: true,
    auth_badges: true,
    search_console: true,
    custom_features: true,  // カスタム機能開発
    dedicated_support: true,  // 専任サポート
    sla_guarantee: true  // SLA保証
  }
} as const;

export const PLAN_PRICES = {
  free: 0,
  basic: 5000,
  business: 15000,
  enterprise: 30000 // ¥30,000〜
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

/**
 * プラン名（表示用）
 */
export const PLAN_NAMES = {
  free: 'Free',
  basic: 'Basic',
  business: 'Business',
  enterprise: 'Enterprise'
} as const;

/**
 * プラン機能リスト
 */
export const PLAN_FEATURES = {
  free: [
    '基本的な企業情報管理',
    'サービス登録：1件まで',
    'Q&A項目：5件まで',
    'SEO最適化・構造化データ出力',
    '外部埋め込み：1個まで',
    '小サイズ企業ロゴ',
    'Hub上での公開のみ'
  ],
  basic: [
    'サービス登録：10件まで',
    'Q&A項目：20件まで',
    '営業資料添付（最大5個）',
    '外部リンク表示機能',
    'カテゴリタグ検索対応',
    '外部埋め込み：5個まで',
    '中サイズ企業ロゴ',
    'メールサポート'
  ],
  business: [
    'サービス登録：50件まで',
    'Q&A項目：無制限',
    '営業資料添付（最大20個）',
    '外部埋め込み：20個まで',
    '大サイズ企業ロゴ',
    'Verified法人バッジ',
    '承認フロー機能',
    '認証バッジ機能',
    'AI解析レポート（基本版）',
    'システム監視機能',
    '優先サポート'
  ],
  enterprise: [
    'すべての機能無制限',
    'SVG対応大サイズロゴ',
    'AI解析レポート（拡張版）',
    'カスタム機能開発',
    '専任サポート',
    'SLA保証',
    'ホワイトラベル対応',
    'API優先アクセス'
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

/**
 * ✅ システム監視機能チェック
 */
export function isSystemMonitoringAllowed(planType: PlanType): boolean {
  return PLAN_LIMITS[planType].system_monitoring;
}

/**
 * ✅ システム監視制限メッセージ
 */
export function getSystemMonitoringLimitMessage(planType: PlanType): string {
  if (isSystemMonitoringAllowed(planType)) return '';
  return `システム監視機能は${PLAN_NAMES.business}以上のプランで利用可能です。`;
}

/**
 * Q&A項目制限チェック
 */
export function isQALimitReached(planType: PlanType, currentCount: number): boolean {
  const limit = PLAN_LIMITS[planType].qa_items;
  return currentCount >= limit;
}

/**
 * Q&A項目制限メッセージ
 */
export function getQALimitMessage(planType: PlanType): string {
  const limit = PLAN_LIMITS[planType].qa_items;
  if (limit === Number.POSITIVE_INFINITY) return '';
  return `ご契約プラン（${PLAN_NAMES[planType]}）の上限に達しています（Q&A項目上限: ${limit}件）。`;
}