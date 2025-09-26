// データベース型定義

export type UserRole = 'admin' | 'editor' | 'viewer';
export type OrganizationStatus = 'draft' | 'published' | 'archived';
export type PartnershipType = 'strategic' | 'technology' | 'distribution' | 'investment';

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
  founded?: string;
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
  partner_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  services?: Service[];
  case_studies?: CaseStudy[];
  faqs?: FAQ[];
}

export interface Service {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  features?: string[];
  categories?: string[];
  price_range?: string;
  url?: string;
  logo_url?: string;
  screenshots?: string[];
  supported_platforms?: string[];
  api_available: boolean;
  free_trial: boolean;
  created_at: string;
  updated_at: string;
}

export interface CaseStudy {
  id: string;
  organization_id: string;
  service_id?: string;
  title: string;
  problem?: string;
  solution?: string;
  outcome?: string;
  metrics?: Record<string, any>;
  client_name?: string;
  client_industry?: string;
  client_size?: string;
  is_anonymous: boolean;
  published_date?: string;
  url?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  organization_id: string;
  service_id?: string;
  question: string;
  answer: string;
  category?: string;
  order_index: number;
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

// フォーム型定義
export interface OrganizationFormData {
  name: string;
  slug: string;
  description: string;
  legal_form?: string;
  representative_name?: string;
  founded?: string;
  capital?: number;
  employees?: number;
  address_country: string;
  address_region?: string;
  address_locality?: string;
  street_address?: string;
  postal_code?: string;
  telephone?: string;
  email?: string;
  email_public: boolean;
  url?: string;
  logo_url?: string;
  same_as?: string[];
  industries?: string[];
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
  description?: string;
  features?: string[];
  categories?: string[];
  price_range?: string;
  url?: string;
  supported_platforms?: string[];
  api_available: boolean;
  free_trial: boolean;
}

export interface CaseStudyFormData {
  title: string;
  problem?: string;
  solution?: string;
  outcome?: string;
  metrics?: Record<string, any>;
  client_name?: string;
  client_industry?: string;
  client_size?: string;
  is_anonymous: boolean;
  published_date?: string;
  url?: string;
  service_id?: string;
}

export interface FAQFormData {
  question: string;
  answer: string;
  category?: string;
  order_index?: number;
  service_id?: string;
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