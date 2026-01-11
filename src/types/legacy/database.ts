/**
 * Legacy Database Types
 * 
 * これらの型はSupabase自動生成型で置き換え予定
 * 新規開発では使用しないこと
 * 
 * @deprecated Use types from @/types/supabase instead
 */

// Legacy User Type
export interface AppUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'editor' | 'viewer'; // Will be from Supabase enum
  segment?: string;
  created_at: string;
  updated_at: string;
  last_active?: string;
  email_verified: boolean;
}

// Legacy Partner Type
export interface Partner {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  website_url?: string;
  contact_email?: string;
  partnership_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  created_at: string;
  updated_at: string;
}

// Legacy Organization Type - Use OrganizationWithLegacyFields for compatibility
export type Organization = import('../utils/database').OrganizationWithLegacyFields;

// Legacy Service Type
// NOTE: Dashboard reads from v_dashboard_services_secure which aliases name as title
export interface Service {
  id: string;
  organization_id: string;
  title: string; // View alias: name AS title
  name?: string; // Base table column (for backward compat)
  slug?: string;
  price?: number;
  duration_months?: number;
  category?: string;
  description?: string;
  summary?: string;
  features?: string[];
  image_url?: string;
  video_url?: string;
  cta_text?: string;
  cta_url?: string;
  status: string;
  is_published?: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  sort_order?: number;
}

// Legacy FAQ Type
export interface FAQ {
  id: string;
  organization_id: string;
  question: string;
  answer: string;
  category?: string;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Legacy Case Study Type
export interface CaseStudy {
  id: string;
  organization_id: string;
  title: string;
  problem?: string;
  solution?: string;
  result?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  sort_order: number;
}

// Legacy Post Type
export interface Post {
  id: string;
  organization_id: string;
  title: string;
  slug: string;
  content?: string;
  content_markdown?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  sort_order: number;
  published_at?: string;
}