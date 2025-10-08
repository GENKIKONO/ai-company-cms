// データベース型定義

export type UserRole = 'admin' | 'editor' | 'viewer';
export type OrganizationStatus = 'draft' | 'published' | 'archived';
export type PartnershipType = 'strategic' | 'technology' | 'distribution' | 'investment';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface AppUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
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
  plan?: 'free' | 'basic' | 'pro';
  subscription_status?: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'paused';
  current_period_end?: string;
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
  cta_text?: string; // Call-to-action text
  cta_url?: string; // Call-to-action URL
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
  organization_id: string;
  title: string;
  slug: string;
  content_markdown?: string;
  content_html?: string;
  status: 'draft' | 'published';
  published_at?: string;
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
  telephone?: string;
  email?: string;
  email_public: boolean;
  url?: string;
  logo_url?: string;
  same_as?: string[];
  industries?: string[];
  status?: OrganizationStatus;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
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
  cta_text?: string;
  cta_url?: string;
}

export interface PostFormData {
  title: string;
  slug: string;
  content_markdown?: string;
  status: 'draft' | 'published';
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
}

// Subscription types
export interface Subscription {
  id: string;
  org_id: string;
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