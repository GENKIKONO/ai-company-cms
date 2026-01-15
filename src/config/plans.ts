/**
 * AIOHub プラン設定
 * 料金・制限・機能の一元管理
 * 
 * TODO: [SUPABASE_PLAN_MISMATCH] 下記設定は Supabase plan_features テーブルと矛盾する部分があります
 * - plan_type: Supabase には 'trial' は存在せず starter/pro/business/enterprise のみ
 * - 無制限表現: Supabase では -1、コードでは Number.POSITIVE_INFINITY
 * - feature_key 名称: Supabase の実 feature_key と一部不一致（qa_items等）
 * Phase 3-D で plan_features ベースに段階移行予定（既存挙動は保持）
 */

export const PLAN_LIMITS = {
  // TODO: [PLAN_TYPE_MISMATCH] 'trial' は Supabase plan_features に存在しない
  // 既存コードで使用中のため保持、将来的に starter に統合検討
  trial: {
    services: 5,
    materials: 10,
    embeds: 1,
    external_links: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,
    category_tags: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,
    logo_size: 'medium',
    verified_badge: false,
    ai_reports: false,
    system_monitoring: false,
    // TODO: [FEATURE_KEY_MISMATCH] 'qa_items' は Supabase feature_registry に存在しない
    // Supabase では 'posts' として管理、または独立機能として追加検討
    qa_items: 10,  // Trial: 10項目まで
    case_studies: 5,  // 導入事例制限
    posts: 10,  // 記事制限
    faqs: 10,  // FAQ制限
    trial_days: 14,  // 14日間トライアル
    structured_score: true,  // 構造化スコア表示
    approval_flow: false,  // 承認フロー機能
    team_management: false  // チーム権限管理
  },
  starter: {
    services: 5,
    materials: 10,
    embeds: 1,
    external_links: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,
    category_tags: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,
    logo_size: 'medium',
    verified_badge: false,
    ai_reports: false,
    system_monitoring: false,
    qa_items: 10,  // Starter: 10項目まで
    case_studies: 5,  // 導入事例制限
    posts: 10,  // 記事制限
    faqs: 10,  // FAQ制限
    structured_score: true,  // 構造化スコア表示
    approval_flow: false,  // 承認フロー機能
    team_management: false  // チーム権限管理
  },
  pro: {
    services: 20,
    materials: 10,
    embeds: 5,
    external_links: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,
    category_tags: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,
    logo_size: 'medium',
    verified_badge: false,
    ai_reports: true,
    system_monitoring: false,
    qa_items: 50,  // Pro: 50項目まで
    case_studies: 20,  // 導入事例制限
    posts: 100,  // 記事制限
    faqs: 50,  // FAQ制限
    structured_score: true,  // 構造化スコア表示
    approval_flow: false,  // 承認フロー機能
    team_management: false  // チーム権限管理
  },
  business: { 
    services: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */, 
    materials: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */, 
    embeds: 20,
    external_links: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,
    category_tags: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,
    logo_size: 'large',
    verified_badge: true,
    ai_reports: 'advanced',
    system_monitoring: true,
    qa_items: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,  // Business: 無制限
    case_studies: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,  // 導入事例無制限
    posts: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,  // 記事無制限
    faqs: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,  // FAQ無制限
    approval_flow: true,  // 承認フロー機能
    auth_badges: true,  // 認証バッジ機能
    search_console: false,  // Search Console連携（未実装）
    structured_score: true,  // 構造化スコア表示
    ai_visibility_reports: true,  // AI Visibilityレポート
    team_management: true  // チーム権限管理
  },
  enterprise: { 
    services: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */, 
    materials: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */, 
    embeds: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,
    external_links: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,
    category_tags: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,
    logo_size: 'large_svg',
    verified_badge: true,
    ai_reports: 'advanced',
    system_monitoring: true,
    qa_items: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,
    case_studies: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,  // 導入事例無制限
    posts: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,  // 記事無制限
    faqs: Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */,  // FAQ無制限
    approval_flow: true,
    auth_badges: true,
    search_console: true,
    custom_features: true,  // カスタム機能開発
    dedicated_support: true,  // 専任サポート
    sla_guarantee: true,  // SLA保証
    team_management: true  // チーム権限管理
  }
} as const;

export const PLAN_PRICES = {
  trial: 0,
  starter: 2980,
  pro: 8000,
  business: 15000,
  enterprise: 30000 // ¥30,000〜
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

/**
 * プラン名（表示用）
 */
export const PLAN_NAMES = {
  trial: 'トライアル',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
  enterprise: 'Enterprise'
} as const;

/**
 * プラン機能リスト
 */
export const PLAN_FEATURES = {
  trial: [
    'ロゴ・企業情報を構造化公開（JSON‑LD）',
    'サービス登録：5件まで',
    'Q&A項目：10件まで',
    'Hub内構造化＋自社サイト埋め込み',
    'SEO最適化・構造化データ自動生成',
    '構造化スコア表示',
    'メールサポート',
    '14日間無料'
  ],
  starter: [
    'ロゴ・企業情報を構造化公開（JSON‑LD）',
    'サービス登録：5件まで',
    'Q&A項目：10件まで',
    'Hub内構造化＋自社サイト埋め込み',
    'SEO最適化・構造化データ自動生成',
    '構造化スコア表示',
    'メールサポート'
  ],
  pro: [
    'Starterプランのすべての機能に加えて',
    'サービス登録：20件まで',
    'Q&A項目：50件まで',
    '営業資料添付（最大10個）',
    'AI Visibility分析レポート',
    '外部リンク表示機能',
    'カテゴリタグ検索対応',
    '優先サポート'
  ],
  business: [
    'Proプランのすべての機能に加えて',
    'サービス登録：無制限',
    'Q&A項目：無制限',
    '営業資料添付（無制限）',
    'Verified法人バッジ',
    'AI解析レポート（拡張版）',
    'ブランド分析・競合監視',
    'チーム権限管理',
    'カスタム機能開発相談',
    '専任サポート・個別相談'
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
 * TODO: [SUPABASE_FEATURE_MIGRATION] 以下の静的プラン判定関数群を canUseFeatureFromOrg ベースに段階移行
 * 
 * 現在の静的関数:
 * - isServiceLimitReached, isMaterialLimitReached, isEmbedLimitReached など
 * - isVerifiedBadgeAllowed, getAIReportsLevel, isSystemMonitoringAllowed など
 * 
 * 将来の方針:
 * - get_effective_org_features RPC + canUseFeatureFromOrg で動的判定に移行
 * - 既存の静的チェック関数は段階的に非推奨化
 * - 新規開発では canUseFeatureFromOrg を使用
 */

/**
 * 価格表示フォーマッター
 */
export function formatPrice(planType: PlanType): string {
  const price = PLAN_PRICES[planType];
  if (price === null) return 'お問い合わせ';
  if (price === 0) return '無料';
  return `¥${price.toLocaleString()}/月（税込）`;
}

// TODO: [UNIFICATION_CANDIDATE] 以下の重複パターン関数は effective-features の isFeatureLimitReached で統一可能
// Phase 3-B で @/lib/org-features/effective-features.ts に移行予定

/**
 * 汎用制限チェック関数（重複パターンの統一）
 * @private 内部実装用 - 将来的に effective-features へ移行
 */
function isGenericLimitReached(planType: PlanType, featureKey: keyof typeof PLAN_LIMITS[PlanType], currentCount: number): boolean {
  const limit = (PLAN_LIMITS[planType] as any)[featureKey];
  return currentCount >= limit;
}

/**
 * 汎用制限メッセージ生成（重複パターンの統一）
 * @private 内部実装用 - 将来的に effective-features へ移行
 */
function getGenericLimitMessage(planType: PlanType, featureKey: keyof typeof PLAN_LIMITS[PlanType], limitName: string, unit: string): string {
  const limit = (PLAN_LIMITS[planType] as any)[featureKey];
  if (limit === Number.POSITIVE_INFINITY /* TODO: [UNLIMITED_MISMATCH] Supabase では -1 */) return '';
  return `ご契約プラン（${PLAN_NAMES[planType]}）の上限に達しています（${limitName}上限: ${limit}${unit}）。`;
}

/**
 * TODO: [SUPABASE_FEATURE_MIGRATION] 静的制限チェックを get_org_quota_usage ベースに移行検討
 * 現在: PLAN_LIMITS 静的定義 + planType による制限チェック
 * 将来: isFeatureQuotaLimitReached(organizationId, 'services') に統一可能
 * 
 * サービス制限チェック
 */
export function isServiceLimitReached(planType: PlanType, currentCount: number): boolean {
  return isGenericLimitReached(planType, 'services', currentCount);
}

/**
 * サービス制限メッセージ
 */
export function getServiceLimitMessage(planType: PlanType): string {
  return getGenericLimitMessage(planType, 'services', 'サービス登録', '件');
}

/**
 * TODO: [SUPABASE_FEATURE_MIGRATION] 静的制限チェックを get_org_quota_usage ベースに移行検討
 * 現在: PLAN_LIMITS 静的定義 + planType による制限チェック
 * 将来: isFeatureQuotaLimitReached(organizationId, 'materials') に統一可能
 * 
 * 営業資料制限チェック
 */
export function isMaterialLimitReached(planType: PlanType, currentCount: number): boolean {
  return isGenericLimitReached(planType, 'materials', currentCount);
}

/**
 * 営業資料制限メッセージ
 */
export function getMaterialLimitMessage(planType: PlanType): string {
  return getGenericLimitMessage(planType, 'materials', '営業資料添付', '個');
}

/**
 * TODO: [SUPABASE_FEATURE_MIGRATION] 静的制限チェックを get_org_quota_usage ベースに移行検討
 * 現在: PLAN_LIMITS 静的定義 + planType による制限チェック
 * 将来: isFeatureQuotaLimitReached(organizationId, 'embeds') に統一可能（Phase 5-Aで既に API レベルは移行済み）
 * 
 * 外部埋め込み制限チェック
 */
export function isEmbedLimitReached(planType: PlanType, currentCount: number): boolean {
  return isGenericLimitReached(planType, 'embeds', currentCount);
}

/**
 * 外部埋め込み制限メッセージ
 */
export function getEmbedLimitMessage(planType: PlanType): string {
  return getGenericLimitMessage(planType, 'embeds', '外部埋め込み', '個');
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
  return isGenericLimitReached(planType, 'qa_items', currentCount);
}

/**
 * Q&A項目制限メッセージ
 */
export function getQALimitMessage(planType: PlanType): string {
  return getGenericLimitMessage(planType, 'qa_items', 'Q&A項目', '件');
}

/**
 * 記事制限チェック
 */
export function isPostLimitReached(planType: PlanType, currentCount: number): boolean {
  return isGenericLimitReached(planType, 'posts', currentCount);
}

/**
 * 記事制限メッセージ
 */
export function getPostLimitMessage(planType: PlanType): string {
  const limit = PLAN_LIMITS[planType].posts;
  // 特殊ケース: 記事は一部プランで完全無効
  if (limit === 0) return `記事機能は${PLAN_NAMES.pro}以上のプランで利用可能です。`;
  return getGenericLimitMessage(planType, 'posts', '記事', '件');
}

/**
 * 有料プランかどうかチェック
 */
export function isPaidPlan(planType: PlanType): boolean {
  return PLAN_PRICES[planType] > 0;
}

/**
 * プラン機能マッピング
 */
import { FEATURES } from './features';

export const PLAN_FEATURE_MAP = {
  trial: [
    FEATURES.structuredData,
    FEATURES.pricingModule,
  ],
  starter: [
    FEATURES.structuredData,
    FEATURES.pricingModule,
    FEATURES.orgDirectory,
  ],
  pro: [
    FEATURES.structuredData,
    FEATURES.pricingModule,
    FEATURES.orgDirectory,
    FEATURES.faqModule,
    FEATURES.hearingService,
  ],
  business: [
    FEATURES.structuredData,
    FEATURES.pricingModule,
    FEATURES.orgDirectory,
    FEATURES.faqModule,
    FEATURES.hearingService,
    FEATURES.aiCrawlCheck,
    FEATURES.aiVisibilityScore,
  ],
} as const;