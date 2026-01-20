/**
 * Public VIEW Contracts - Single Source of Truth
 *
 * このファイルは公開VIEWのカラム定義を一元管理します。
 * APIルートはこのファイルを参照してSELECT文を構築してください。
 *
 * ⚠️ 重要:
 * - VIEWの変更時はこのファイルを必ず更新すること
 * - DBを変更せずにAPIを修正する場合、このファイルが正となる
 * - CIでAPIのSELECTがこの契約に準拠しているかチェックされる
 *
 * 最終更新: 2026-01-20
 * 確認方法: Supabase SQL Editor で以下を実行
 *   SELECT table_name, string_agg(column_name, ', ' ORDER BY ordinal_position)
 *   FROM information_schema.columns
 *   WHERE table_schema = 'public' AND table_name LIKE 'v_%_public'
 *   GROUP BY table_name;
 */

// ============================================
// v_organizations_public
// ============================================
export const V_ORGANIZATIONS_PUBLIC_COLUMNS = [
  'id',
  'name',
  'slug',
  'description',
  'email',
  'email_public',
  'telephone',
  'logo_url',
  'website_url',
  'url',
  'meta_title',
  'meta_description',
  'meta_keywords',
  'industries',
  'same_as',
  'status',
  'is_published',
  'verified',
  'show_services',
  'show_posts',
  'show_case_studies',
  'show_faqs',
  'show_qa',
  'show_news',
  'show_partnership',
  'show_contact',
  'created_at',
  'updated_at',
] as const;

export type VOrganizationsPublicColumn = typeof V_ORGANIZATIONS_PUBLIC_COLUMNS[number];

/** 一覧API用（軽量） */
export const V_ORGANIZATIONS_PUBLIC_SELECT_LIST = `
  id, name, slug, description, logo_url, website_url,
  show_services, show_posts, show_case_studies, show_faqs
`.trim();

/** 詳細API用（フル） */
export const V_ORGANIZATIONS_PUBLIC_SELECT_DETAIL = V_ORGANIZATIONS_PUBLIC_COLUMNS.join(', ');

// ============================================
// v_services_public
// ============================================
export const V_SERVICES_PUBLIC_COLUMNS = [
  'id',
  'organization_id',
  'name',
  'description',
  'price_range',
  'url',
  'logo_url',
  'screenshots',
  'categories',
  'created_at',
  'updated_at',
  'organization_slug',
  'organization_name',
] as const;

export type VServicesPublicColumn = typeof V_SERVICES_PUBLIC_COLUMNS[number];

export const V_SERVICES_PUBLIC_SELECT = `
  id, organization_id, name, description, price_range, url, logo_url,
  screenshots, categories, created_at, updated_at
`.trim();

// ============================================
// v_case_studies_public
// ============================================
export const V_CASE_STUDIES_PUBLIC_COLUMNS = [
  'id',
  'organization_id',
  'title',
  'slug',
  'summary',
  'published_at',
  'created_at',
  'updated_at',
  'organization_slug',
  'organization_name',
] as const;

export type VCaseStudiesPublicColumn = typeof V_CASE_STUDIES_PUBLIC_COLUMNS[number];

export const V_CASE_STUDIES_PUBLIC_SELECT = `
  id, organization_id, title, slug, summary, published_at, created_at, updated_at
`.trim();

// ============================================
// v_posts_public
// ============================================
export const V_POSTS_PUBLIC_COLUMNS = [
  'id',
  'organization_id',
  'title',
  'slug',
  'summary',
  'published_at',
  'created_at',
  'updated_at',
  'organization_slug',
  'organization_name',
] as const;

export type VPostsPublicColumn = typeof V_POSTS_PUBLIC_COLUMNS[number];

export const V_POSTS_PUBLIC_SELECT = `
  id, organization_id, title, slug, summary, published_at, created_at, updated_at
`.trim();

// ============================================
// v_faqs_public
// ============================================
export const V_FAQS_PUBLIC_COLUMNS = [
  'id',
  'organization_id',
  'question',
  'answer',
  'published_at',
  'created_at',
  'updated_at',
  'organization_slug',
  'organization_name',
] as const;

export type VFaqsPublicColumn = typeof V_FAQS_PUBLIC_COLUMNS[number];

export const V_FAQS_PUBLIC_SELECT = `
  id, organization_id, question, answer, published_at, created_at, updated_at
`.trim();

// ============================================
// Blocklist (sanitize用 - 万一のためのセーフティネット)
// ============================================
export const ORGANIZATION_BLOCKED_KEYS = [
  'created_by',
  'user_id',
  'feature_flags',
  'plan',
  'plan_id',
  'discount_group',
  'original_signup_campaign',
  'entitlements',
  'partner_id',
  'trial_end',
  'data_status',
  'verified_by',
  'verified_at',
  'verification_source',
  'content_hash',
  'source_urls',
  'archived',
  'deleted_at',
] as const;

/**
 * オブジェクトから秘匿キーを削除する（保険用sanitize）
 */
export function sanitizeForPublic<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key of ORGANIZATION_BLOCKED_KEYS) {
    delete sanitized[key];
  }
  return sanitized;
}

// ============================================
// Validation Helper
// ============================================

/**
 * SELECTするカラムがVIEW契約に含まれているか検証
 * @param selectColumns カンマ区切りのSELECT文字列
 * @param allowedColumns 許可されたカラム配列
 * @returns 不正なカラムの配列（空なら全て有効）
 */
export function validateSelectColumns(
  selectColumns: string,
  allowedColumns: readonly string[]
): string[] {
  const requested = selectColumns
    .split(',')
    .map(c => c.trim())
    .filter(c => c.length > 0);

  const invalid = requested.filter(col => !allowedColumns.includes(col));
  return invalid;
}
