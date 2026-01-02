/**
 * Supabase select() 用の共通カラム定義
 *
 * 目的:
 * - select('*') を排除し、必要最小限のカラムを明示
 * - 型安全性の向上（database.generated.ts と併用）
 * - 重複するカラム定義の一元管理
 *
 * 使用例:
 * import { organizationColumns } from '@/lib/db/columns'
 * const { data } = await supabase.from('organizations').select(organizationColumns)
 */

// =============================================================================
// Organizations
// =============================================================================

/** 組織一覧表示用（最小限） */
export const organizationColumnsLite =
  'id, name, slug, status, is_published, logo_url' as const;

/** 組織詳細表示用 */
export const organizationColumns =
  'id, name, slug, status, is_published, logo_url, description, legal_form, representative_name, capital, employees, address_country, address_region, address_locality, address_postal_code, address_street, telephone, email, url, industries, created_at, updated_at' as const;

/** 組織のJSON-LD用 */
export const organizationColumnsJsonLd =
  'id, name, slug, description, logo_url, address_country, address_region, address_locality, address_postal_code, address_street, telephone, email, url, same_as, lat, lng' as const;

// =============================================================================
// Users / Profiles
// =============================================================================

/** プロフィール基本 */
export const profileColumns =
  'id, full_name, avatar_url, created_at' as const;

/** ユーザー詳細（管理者用） */
export const userColumnsAdmin =
  'id, email, display_name, avatar_url, phone, role, plan, email_verified, phone_verified, created_at, updated_at, last_sign_in_at' as const;

// =============================================================================
// Services
// =============================================================================

/** サービス一覧用 */
export const serviceColumnsLite =
  'id, organization_id, name, slug, summary, price, category, is_published, created_at' as const;

/** サービス詳細用 */
export const serviceColumns =
  'id, organization_id, name, slug, summary, description, price, price_range, duration_months, category, features, image_url, video_url, cta_text, cta_url, is_published, status, created_by, created_at, updated_at' as const;

// =============================================================================
// Posts
// =============================================================================

/** 投稿一覧用 */
export const postColumnsLite =
  'id, organization_id, title, slug, status, is_published, published_at, created_at' as const;

/** 投稿詳細用 */
export const postColumns =
  'id, organization_id, title, slug, content, content_markdown, content_html, status, is_published, published_at, created_by, created_at, updated_at' as const;

// =============================================================================
// FAQs
// =============================================================================

export const faqColumns =
  'id, organization_id, service_id, question, answer, category, order_index, is_published, created_at, updated_at' as const;

// =============================================================================
// Case Studies
// =============================================================================

export const caseStudyColumns =
  'id, organization_id, service_id, title, slug, client_name, client_industry, client_size, challenge, solution, results, testimonial, images, is_published, created_at, updated_at' as const;

// =============================================================================
// Q&A
// =============================================================================

export const qaEntryColumns =
  'id, organization_id, category_id, question, answer, tags, visibility, status, published_at, last_edited_by, last_edited_at, created_at, updated_at, content_hash' as const;

export const qaCategoryColumns =
  'id, organization_id, name, slug, description, visibility, sort_order, is_active, created_at, updated_at' as const;

// =============================================================================
// Billing / Plans
// =============================================================================

export const planColumns =
  'id, name, slug, description, status, sort_order, monthly_price, yearly_price, stripe_price_id_monthly, stripe_price_id_yearly, created_at, updated_at' as const;

export const subscriptionColumns =
  'id, organization_id, plan_id, status, current_period_start, current_period_end, stripe_subscription_id, stripe_customer_id, cancel_at_period_end, created_at, updated_at' as const;

// =============================================================================
// Analytics
// =============================================================================

export const analyticsInterviewDailyColumns =
  'organization_id, day, session_count, completed_session_count, completion_rate, avg_question_count, ai_used_session_count, ai_call_count, citations_item_count, quoted_tokens_sum, last_session_at' as const;

// =============================================================================
// CMS
// =============================================================================

export const cmsSectionColumns =
  'id, page_key, section_key, section_type, title, content, display_order, is_active, created_at, updated_at' as const;

export const cmsSiteSettingColumns =
  'id, key, value, description, data_type, is_public, created_at, updated_at' as const;

export const cmsAssetColumns =
  'id, filename, original_name, file_path, file_size, mime_type, alt_text, description, tags, is_active, created_at' as const;

// =============================================================================
// Jobs / Pipelines
// =============================================================================

export const embeddingJobColumns =
  'id, organization_id, source_table, source_id, source_field, content_hash, chunk_count, embedding_model, status, priority, error_message, retry_count, scheduled_at, started_at, completed_at, created_at, updated_at' as const;

export const translationJobColumns =
  'id, organization_id, source_table, source_id, source_field, source_lang, target_lang, source_text, translated_text, status, translation_service, error_message, retry_count, priority, scheduled_at, started_at, completed_at, created_at, updated_at' as const;
