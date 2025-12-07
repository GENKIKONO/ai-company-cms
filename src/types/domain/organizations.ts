/**
 * Organization Domain Types
 * 
 * 組織・パートナー関連のUI専用型とフォーム型
 */

import type { OrganizationStatus, PartnershipType, UserRole } from '../utils/database'

// Organization Form Data (UI specific)
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

// Partner Form Data
export interface PartnerFormData {
  name: string;
  description?: string;
  website_url?: string;
  contact_email?: string;
  partnership_type?: PartnershipType;
  contract_start_date?: string;
  contract_end_date?: string;
}

// Organization with Owner Details (UI specific)
export interface OrganizationWithOwner {
  // Organization fields will be from Supabase types
  // Owner details (FK ambiguity resolution)
  owner_email?: string;
  owner_full_name?: string;
  owner_avatar_url?: string;
  owner_role?: UserRole;
  [key: string]: any; // TODO: Replace with proper Supabase Organization type
}