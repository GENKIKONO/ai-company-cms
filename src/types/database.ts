// データベース型定義

export interface AppUser {
  id: string;
  email: string;
  role: 'admin' | 'partner_admin' | 'org_owner';
  partner_id?: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  logo_url?: string;
  brand_logo_url?: string;
  description?: string;
  commission_rate: number;
  status: 'active' | 'inactive' | 'pending';
  contract_start?: string;
  contract_end?: string;
  billing_info?: Record<string, any>;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
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
  status: 'draft' | 'waiting_approval' | 'published' | 'paused' | 'archived';
  partner_id?: string;
  created_at: string;
  updated_at: string;
  last_accessed?: string;
  view_count?: number;
  services?: Service[];
  case_studies?: CaseStudy[];
  faqs?: FAQ[];
}

export interface Service {
  id: string;
  org_id: string;
  name: string;
  description: string;
  features?: string[];
  price_range?: string;
  url?: string;
  category?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CaseStudy {
  id: string;
  org_id: string;
  title: string;
  problem?: string;
  solution?: string;
  outcome?: string;
  metrics?: Record<string, string | number>;
  client_name?: string;
  client_industry?: string;
  is_anonymous: boolean;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  org_id: string;
  question: string;
  answer: string;
  category?: string;
  order_index?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  event_name: string;
  organization_id?: string;
  partner_id?: string;
  user_id?: string;
  properties?: Record<string, any>;
  timestamp: string;
  user_agent?: string;
  ip_address?: string;
  referrer?: string;
}

export interface Revenue {
  id: string;
  partner_id: string;
  organization_id: string;
  amount: number;
  commission_amount: number;
  commission_rate: number;
  period_start: string;
  period_end: string;
  status: 'pending' | 'paid' | 'cancelled';
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
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  description?: string;
  commission_rate: number;
  contract_start?: string;
  contract_end?: string;
}

export interface ServiceFormData {
  name: string;
  description: string;
  features?: string[];
  price_range?: string;
  url?: string;
  category?: string;
}

export interface CaseStudyFormData {
  title: string;
  problem?: string;
  solution?: string;
  outcome?: string;
  metrics?: Record<string, string | number>;
  client_name?: string;
  client_industry?: string;
  is_anonymous: boolean;
}

export interface FAQFormData {
  question: string;
  answer: string;
  category?: string;
  order_index?: number;
}