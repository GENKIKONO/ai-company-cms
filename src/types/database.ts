// データベース型定義

export type UserRole = 'admin' | 'editor' | 'viewer';
export type UserSegment = 'test_user' | 'early_user' | 'normal_user';
export type OrganizationStatus = 'draft' | 'waiting_approval' | 'public_unverified' | 'published' | 'paused' | 'archived';
export type PartnershipType = 'strategic' | 'technology' | 'distribution' | 'investment';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface AppUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  segment?: UserSegment;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  name: string;
  description?: string;
  website_url?: string;
  logo_url?: string;
  brand_logo_url?: string;
  contact_email?: string;
  partnership_type?: PartnershipType;
  contract_start_date?: string;
  contract_end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  legal_form?: string;
  representative_name?: string;
  corporate_number?: string;
  verified?: boolean;
  established_at?: string | null;
  capital?: number;
  employees?: number;
  address_country: string;
  address_region?: string;
  address_locality?: string;
  address_postal_code?: string;
  address_street?: string;
  lat?: number;
  lng?: number;
  telephone?: string;
  email?: string;
  email_public: boolean;
  url?: string;
  logo_url?: string;
  same_as?: string[];
  industries?: string[];
  status: OrganizationStatus;
  is_published: boolean;
  partner_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  keywords?: string[];
  website?: string;
  website_url?: string;
  size?: number;
  // Enhanced organization settings (I1)
  favicon_url?: string;
  brand_color_primary?: string;
  brand_color_secondary?: string;
  social_media?: SocialMediaLinks;
  business_hours?: BusinessHours[];
  timezone?: string;
  languages_supported?: string[];
  certifications?: string[];
  awards?: string[];
  company_culture?: string;
  mission_statement?: string;
  vision_statement?: string;
  values?: string[];
  services?: Service[];
  case_studies?: CaseStudy[];
  faqs?: FAQ[];
  posts?: Post[];
  // Feature flags and entitlements
  feature_flags?: Record<string, any>;
  entitlements?: Record<string, any>;
  // Stripe subscription fields
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan?: 'trial' | 'starter' | 'pro' | 'business' | 'enterprise';
  subscription_status?: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'paused';
  current_period_end?: string;
  trial_end_date?: string;
  // Section visibility controls
  show_services?: boolean;
  show_posts?: boolean;
  show_case_studies?: boolean;
  show_faqs?: boolean;
  show_qa?: boolean;
  show_news?: boolean;
  show_partnership?: boolean;
  show_contact?: boolean;
}

export interface Service {
  id: string;
  organization_id: string;
  name: string;
  price?: number; // Price in cents/yen (nullable)
  duration_months?: number; // Duration in months (nullable)
  category?: string;
  description?: string;
  features?: string[]; // List of service features
  media?: ServiceMedia[]; // Associated media (images, videos)
  image_url?: string; // Service main image URL
  video_url?: string; // Service video URL (YouTube or external)
  cta_text?: string; // Call-to-action text
  cta_url?: string; // Call-to-action URL
  status?: 'draft' | 'published'; // Service publication status
  is_published: boolean; // Whether the service is publicly visible
  created_by?: string; // User who created this service
  created_at: string;
  updated_at: string;
}

export interface ServiceMedia {
  type: 'image' | 'video';
  url: string;
  alt_text?: string;
  caption?: string;
}

export interface SocialMediaLinks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  github?: string;
  note?: string;
  qiita?: string;
  zenn?: string;
}

export interface BusinessHours {
  day: DayOfWeek;
  is_open: boolean;
  open_time?: string; // HH:MM format
  close_time?: string; // HH:MM format
  break_start?: string; // HH:MM format
  break_end?: string; // HH:MM format
}

export interface Post {
  id: string;
  organization_id: string; // 統一: organization_idを使用（org_idは廃止）
  title: string;
  slug: string;
  content?: string; // content_markdownとcontent_htmlを統合
  content_markdown?: string;
  content_html?: string;
  status: 'draft' | 'published';
  is_published: boolean; // 公開フラグ
  published_at?: string;
  created_by?: string; // 作成者
  created_at: string;
  updated_at: string;
}

export interface CaseStudy {
  id: string;
  organization_id: string;
  title: string;
  problem?: string;
  solution?: string;
  result?: string;
  tags?: string[]; // Array of tags (nullable)
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  organization_id: string;
  question: string;
  answer: string;
  category?: string;
  sort_order: number;
  status?: 'draft' | 'published'; // FAQ publication status
  is_published: boolean; // Whether the FAQ is publicly visible
  created_by?: string; // User who created this FAQ
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id?: string;
  session_id?: string;
  event_name: string;
  event_properties?: Record<string, any>;
  page_url?: string;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
}

export interface Partnership {
  id: string;
  organization_a_id: string;
  organization_b_id: string;
  partnership_type: PartnershipType;
  description?: string;
  started_at?: string;
  ended_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface News {
  id: string;
  organization_id: string;
  title: string;
  content?: string;
  summary?: string;
  category?: string;
  published_date?: string;
  url?: string;
  image_url?: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  organization_id: string;
  created_at: string;
}

export interface UserSavedSearch {
  id: string;
  user_id: string;
  name: string;
  search_params: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// APIレスポンス型定義
export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Single-Org Mode API レスポンス型定義
export interface MyOrganizationResponse {
  data: Organization | null;
  message?: string;
}

export interface MyOrganizationCreateResponse {
  data: Organization;
}

export interface MyOrganizationUpdateResponse {
  data: Organization;
}

export interface MyOrganizationDeleteResponse {
  message: string;
}

export interface MyOrganizationErrorResponse {
  error: string;
  message: string;
}

// フォーム型定義（基本スキーマのみ - 本番DB存在フィールド）
export interface OrganizationFormData {
  name: string;
  slug: string;
  description: string;
  legal_form?: string;
  representative_name?: string;
  corporate_number?: string;
  verified?: boolean;
  established_at?: string;
  capital?: number;
  employees?: number;
  address_country: string;
  address_region?: string;
  address_locality?: string;
  address_postal_code?: string;
  address_street?: string;
  lat?: number;
  lng?: number;
  telephone?: string;
  email?: string;
  email_public: boolean;
  url?: string;
  logo_url?: string;
  same_as?: string[];
  industries?: string[];
  status?: OrganizationStatus;
  plan?: 'trial' | 'starter' | 'pro' | 'business' | 'enterprise';
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  // Section visibility controls
  show_services?: boolean;
  show_posts?: boolean;
  show_case_studies?: boolean;
  show_faqs?: boolean;
  show_qa?: boolean;
  show_news?: boolean;
  show_partnership?: boolean;
  show_contact?: boolean;
}

export interface PartnerFormData {
  name: string;
  description?: string;
  website_url?: string;
  contact_email?: string;
  partnership_type?: PartnershipType;
  contract_start_date?: string;
  contract_end_date?: string;
}

export interface ServiceFormData {
  name: string;
  price?: number;
  duration_months?: number;
  category?: string;
  description?: string;
  features?: string[];
  media?: ServiceMedia[];
  image_url?: string;
  video_url?: string;
  cta_text?: string;
  cta_url?: string;
  status?: 'draft' | 'published';
  is_published?: boolean;
}

export interface PostFormData {
  title: string;
  slug?: string;
  content?: string;
  content_markdown?: string;
  status: 'draft' | 'published';
  is_published?: boolean;
}

export interface CaseStudyFormData {
  title: string;
  problem?: string;
  solution?: string;
  result?: string;
  tags?: string[];
}

export interface FAQFormData {
  question: string;
  answer: string;
  category?: string;
  sort_order?: number;
  status?: 'draft' | 'published';
  is_published?: boolean;
}

// Q&A Knowledge System Types
export type QAVisibility = 'global' | 'org';
export type QAEntryVisibility = 'public' | 'private';
export type QAEntryStatus = 'draft' | 'published' | 'archived';
export type QALogAction = 'create' | 'update' | 'publish' | 'unpublish' | 'archive' | 'delete' | 'category_create' | 'category_update' | 'category_delete';

export interface QACategory {
  id: string;
  organization_id?: string;
  name: string;
  slug: string;
  description?: string;
  visibility: QAVisibility;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface QAEntry {
  id: string;
  organization_id: string;
  category_id?: string;
  question: string;
  answer: string;
  tags: string[];
  visibility: QAEntryVisibility;
  status: QAEntryStatus;
  published_at?: string;
  last_edited_by: string;
  last_edited_at: string;
  created_at: string;
  updated_at: string;
  content_hash?: string;
  refresh_suggested_at?: string;
  jsonld_cache?: any;
  search_vector?: string;
}

export interface QAContentLog {
  id: string;
  organization_id: string;
  qa_entry_id?: string;
  category_id?: string;
  action: QALogAction;
  actor_user_id: string;
  changes?: any;
  note?: string;
  metadata?: any;
  created_at: string;
}

export interface QAQuestionTemplate {
  id: string;
  category_id?: string;
  template_text: string;
  description?: string;
  tags: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Monthly Reports Types
export type ReportStatus = 'generating' | 'completed' | 'failed';
export type ReportFormat = 'html' | 'pdf';

export interface MonthlyReport {
  id: string;
  organization_id: string;
  year: number;
  month: number; // 1-12
  status: ReportStatus;
  format: ReportFormat;
  file_url?: string; // Supabase Storage URL
  file_size?: number; // bytes
  data_summary: {
    ai_visibility_score: number;
    total_bot_hits: number;
    unique_bots: number;
    analyzed_urls: number;
    top_performing_urls: number;
    improvement_needed_urls: number;
  };
  generated_at?: string;
  sent_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Q&A Extended Types (with joined data)
export interface QAEntryWithCategory extends QAEntry {
  qa_categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// Q&A Form Data Types
export interface QACategoryFormData {
  name: string;
  slug: string;
  description?: string;
  visibility: QAVisibility;
  sort_order?: number;
  is_active?: boolean;
}

export interface QAEntryFormData {
  category_id?: string;
  question: string;
  answer: string;
  tags?: string[];
  visibility?: QAEntryVisibility;
  status?: QAEntryStatus;
}

// Subscription types
export interface Subscription {
  id: string;
  organization_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: 'active' | 'pending' | 'paused' | 'cancelled';
  plan_id: string;
  current_period_start: string;
  current_period_end: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StripeCustomer {
  id: string;
  organization_id: string;
  stripe_customer_id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// organizations_with_owner view型定義 (PGRST201エラー回避用)
export interface OrganizationWithOwner extends Organization {
  // Owner詳細情報 (FK曖昧性エラー回避のため明示的列)
  owner_email?: string;
  owner_full_name?: string;
  owner_avatar_url?: string;
  owner_role?: UserRole;
}

// Sales Materials Types
export type SalesAction = 'view' | 'download';

export interface SalesMaterial {
  id: string;
  organization_id: string;
  title: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface SalesMaterialStat {
  id: string;
  material_id: string;
  user_id?: string;
  company_id?: string;
  action: SalesAction;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
}

export interface SalesMaterialStatsSummary {
  material_id: string;
  material_title: string;
  organization_name: string;
  total_views: number;
  total_downloads: number;
  unique_viewers: number;
  unique_downloaders: number;
  last_viewed_at?: string;
  last_downloaded_at?: string;
}

export interface SalesMaterialDailyStats {
  date: string;
  material_id: string;
  views: number;
  downloads: number;
  unique_views: number;
  unique_downloads: number;
}

// Q&A Stats Types
export type QAStatsAction = 'view';

export interface QAViewStat {
  id: string;
  qna_id: string;
  user_id?: string;
  company_id?: string;
  action: QAStatsAction;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
}

export interface QAStatsSummary {
  qna_id: string;
  question: string;
  organization_name: string;
  category_name?: string;
  total_views: number;
  unique_viewers: number;
  last_viewed_at?: string;
}

export interface QADailyStats {
  date: string;
  qna_id: string;
  views: number;
  unique_views: number;
}

// Questions Box Types
export type QuestionStatus = 'open' | 'answered' | 'closed';

export interface Question {
  id: string;
  company_id: string;
  user_id: string;
  question_text: string;
  status: QuestionStatus;
  answer_text?: string;
  created_at: string;
  answered_at?: string;
  answered_by?: string;
}

export interface QuestionWithDetails extends Question {
  user_email?: string;
  user_full_name?: string;
  company_name?: string;
  answerer_name?: string;
}

export interface QuestionFormData {
  company_id: string;
  question_text: string;
}

export interface QuestionAnswerData {
  answer_text: string;
}