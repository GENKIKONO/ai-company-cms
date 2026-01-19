/**
 * 🔒 Public API Contract - 公開データの安全性を保証する契約定義
 *
 * このファイルは以下を一元管理します：
 * 1. 公開APIで返却を許可するカラム（Allowlist）
 * 2. 絶対に公開してはいけないカラム（Blocklist）
 * 3. 公開判定条件（3点セット）
 *
 * 全ての公開APIはこの契約を参照してデータを返却すること。
 */

// ============================================
// 🔒 BLOCKLIST: 絶対に公開してはいけないカラム
// ============================================

/**
 * organizationsテーブルで公開禁止のカラム
 * これらはユーザー識別・課金・内部運用に関する情報
 */
export const ORGANIZATION_BLOCKED_COLUMNS = [
  // ユーザー識別情報
  'created_by',
  'user_id',

  // 課金・プラン情報
  'plan',
  'plan_id',
  'discount_group',
  'original_signup_campaign',
  'entitlements',
  'trial_end',

  // 内部運用情報
  'feature_flags',
  'partner_id',
  'data_status',

  // 検証関連（内部プロセス）
  'verified_by',
  'verified_at',
  'verification_source',

  // システム内部
  'content_hash',
  'source_urls',
  'archived',
  'deleted_at',

  // DBに存在しないカラム（エラー防止）
  'keywords',
] as const;

/**
 * servicesテーブルで公開禁止のカラム
 */
export const SERVICE_BLOCKED_COLUMNS = [
  'created_by',
  'deleted_at',
] as const;

/**
 * postsテーブルで公開禁止のカラム
 */
export const POST_BLOCKED_COLUMNS = [
  'created_by',
  'deleted_at',
] as const;

/**
 * case_studiesテーブルで公開禁止のカラム
 */
export const CASE_STUDY_BLOCKED_COLUMNS = [
  'created_by',
  'deleted_at',
] as const;

/**
 * faqsテーブルで公開禁止のカラム
 */
export const FAQ_BLOCKED_COLUMNS = [
  'created_by',
  'deleted_at',
] as const;

// ============================================
// ✅ ALLOWLIST: 公開を許可するカラム
// ============================================

/**
 * organizationsテーブルで公開を許可するカラム
 * select() で使用する
 */
export const ORGANIZATION_PUBLIC_COLUMNS = `
  id, name, slug, description,
  legal_form, representative_name, corporate_number,
  established_at, capital, employees,
  address_country, address_region, address_locality, address_postal_code, address_street,
  lat, lng,
  telephone, email, email_public, url, logo_url, website_url,
  industries, same_as,
  status, is_published,
  created_at, updated_at,
  meta_title, meta_description, meta_keywords,
  verified,
  show_services, show_posts, show_case_studies, show_faqs, show_qa, show_news, show_partnership, show_contact
`;

/**
 * servicesテーブルで公開を許可するカラム
 */
export const SERVICE_PUBLIC_COLUMNS = `
  id, name, price, duration_months, category, description, features,
  image_url, video_url, cta_text, cta_url, created_at, updated_at
`;

/**
 * postsテーブルで公開を許可するカラム
 */
export const POST_PUBLIC_COLUMNS = `
  id, title, slug, content_markdown, content_html, status,
  published_at, created_at, updated_at
`;

/**
 * case_studiesテーブルで公開を許可するカラム
 */
export const CASE_STUDY_PUBLIC_COLUMNS = `
  id, title, problem, solution, result, tags, created_at, updated_at
`;

/**
 * faqsテーブルで公開を許可するカラム
 */
export const FAQ_PUBLIC_COLUMNS = `
  id, question, answer, category, sort_order, created_at, updated_at
`;

// ============================================
// 🔍 公開判定条件（3点セット）
// ============================================

/**
 * コンテンツ公開判定の標準条件
 * 全ての公開APIでこの条件を適用すること
 */
export const PUBLIC_FILTER_CONDITIONS = {
  /** is_published = true */
  isPublished: true,
  /** published_at IS NULL OR published_at <= NOW() */
  publishedAtOrNull: (nowISO: string) => `published_at.is.null,published_at.lte.${nowISO}`,
  /** deleted_at IS NULL */
  notDeleted: null,
} as const;

// ============================================
// 🛡️ Sanitize関数
// ============================================

/**
 * オブジェクトから禁止キーを削除する汎用sanitize関数
 * allowlistベースの select を使用した上で、保険として適用する
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  blockedKeys: readonly string[]
): T {
  const sanitized = { ...obj };
  for (const key of blockedKeys) {
    delete sanitized[key];
  }
  return sanitized;
}

/**
 * organizationオブジェクト専用のsanitize
 */
export function sanitizeOrganization<T extends Record<string, unknown>>(org: T): T {
  return sanitizeObject(org, ORGANIZATION_BLOCKED_COLUMNS);
}

/**
 * serviceオブジェクト専用のsanitize
 */
export function sanitizeService<T extends Record<string, unknown>>(service: T): T {
  return sanitizeObject(service, SERVICE_BLOCKED_COLUMNS);
}

/**
 * 配列内の全オブジェクトをsanitizeする
 */
export function sanitizeArray<T extends Record<string, unknown>>(
  items: T[],
  blockedKeys: readonly string[]
): T[] {
  return items.map(item => sanitizeObject(item, blockedKeys));
}

// ============================================
// 📋 エクスポート（型定義）
// ============================================

export type BlockedOrganizationColumn = typeof ORGANIZATION_BLOCKED_COLUMNS[number];
export type BlockedServiceColumn = typeof SERVICE_BLOCKED_COLUMNS[number];
export type BlockedPostColumn = typeof POST_BLOCKED_COLUMNS[number];
export type BlockedCaseStudyColumn = typeof CASE_STUDY_BLOCKED_COLUMNS[number];
export type BlockedFaqColumn = typeof FAQ_BLOCKED_COLUMNS[number];
