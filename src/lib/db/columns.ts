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

// =============================================================================
// AI Interview Sessions
// =============================================================================

export const aiInterviewSessionColumns =
  'id, user_id, organization_id, title, description, status, content_type, created_at, updated_at' as const;

// =============================================================================
// AI Visibility Logs
// =============================================================================

export const aiVisibilityLogColumns =
  'id, url, user_agent, timestamp, severity_level, response_time_ms, issues' as const;

// =============================================================================
// Ops Audit
// =============================================================================

export const opsAuditColumns =
  'id, action, target_type, target_id, user_id, metadata, created_at' as const;

// =============================================================================
// Schema Diff
// =============================================================================

/** v_schema_diff_recent ビュー */
export const schemaDiffRecentColumns =
  'id, environment, diff_at, severity, summary' as const;

// =============================================================================
// Feature Overrides
// =============================================================================

export const featureOverrideColumns =
  'id, organization_id, feature_key, is_enabled, config, expires_at, created_at, updated_at, updated_by' as const;

// =============================================================================
// Job Runs
// =============================================================================

export const jobRunsColumns =
  'id, job_name, status, started_at, finished_at, duration_ms, meta, error_message, created_at' as const;

// =============================================================================
// User Subscriptions
// =============================================================================

export const userSubscriptionColumns =
  'id, user_id, plan_id, status, starts_at, ends_at, canceled_at, stripe_subscription_id, stripe_customer_id, created_at, updated_at' as const;

// =============================================================================
// Public Services JSONLD View
// =============================================================================

export const publicServicesJsonldColumns =
  'id, name, description, url, provider, price, offers' as const;

// =============================================================================
// Partners
// =============================================================================

export const partnerColumns =
  'id, name, description, website_url, logo_url, brand_logo_url, contact_email, partnership_type, contract_start_date, contract_end_date, is_active, created_at, updated_at' as const;

// =============================================================================
// AI Citations Views
// =============================================================================

export const aiCitationsAggregateColumns =
  'response_id, organization_id, session_id, user_id, model, response_created_at, source_key, title, url, citations_count, total_weight, total_quoted_tokens, total_quoted_chars, max_score, avg_score, last_cited_at' as const;

export const aiCitationsOrgPeriodColumns =
  'organization_id, day_bucket, source_key, title, url, citations_count, total_weight, total_quoted_tokens, total_quoted_chars, max_score, avg_score, last_cited_at' as const;

// =============================================================================
// File Metadata
// =============================================================================

export const fileMetadataColumns =
  'id, bucket_id, object_path, language_code, display_name, metadata, created_by, created_at' as const;

// =============================================================================
// AI Monthly Reports
// =============================================================================

export const aiMonthlyReportColumns =
  'id, organization_id, plan_id, level, period_start, period_end, status, summary_text, metrics, sections, suggestions, created_at, updated_at' as const;

// =============================================================================
// User Violation Stats View
// =============================================================================

export const userViolationStatsColumns =
  'user_id, total_violations, violations_3y, violations_2y, violations_1y, violations_6m, high_violations_1y, last_violation_at, last_violation_rule' as const;

// =============================================================================
// SEO Search Console Metrics
// =============================================================================

export const seoSearchConsoleMetricsColumns =
  'id, organization_id, url, search_query, clicks, impressions, ctr, average_position, date_recorded, created_at' as const;

// =============================================================================
// Questions
// =============================================================================

export const questionColumns =
  'id, company_id, user_id, question_text, status, answer_text, created_at, answered_at, answered_by' as const;
