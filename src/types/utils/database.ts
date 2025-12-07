/**
 * Supabase型からの派生型ユーティリティ
 * supabase.tsから型を取得し、便利な派生型を作成
 */

// Supabaseの型定義をインポート（現在は既存のファイルを参照）
import { Database } from '../supabase'

// 基本的な型エイリアス
export type Tables = Database['public']['Tables']
export type Views = Database['public']['Views']
export type Functions = Database['public']['Functions']

// テーブル型の便利なエイリアス
export type TableRow<T extends keyof Tables> = Tables[T]['Row']
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert']
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update']

// よく使用されるテーブルの型エイリアス
export type User = TableRow<'users'>
export type Organization = TableRow<'organizations'>
export type OrganizationMember = TableRow<'organization_members'>
export type Service = TableRow<'services'>
export type FAQ = TableRow<'faqs'>
export type CaseStudy = TableRow<'case_studies'>
export type Post = TableRow<'posts'>

// AI関連テーブル
export type AIInterviewAxis = TableRow<'ai_interview_axes'>
export type AICitation = TableRow<'ai_citations_responses'>

// Insert型（作成時用）
export type UserInsert = TableInsert<'users'>
export type OrganizationInsert = TableInsert<'organizations'>
export type ServiceInsert = TableInsert<'services'>
export type FAQInsert = TableInsert<'faqs'>
export type CaseStudyInsert = TableInsert<'case_studies'>
export type PostInsert = TableInsert<'posts'>

export type AIInterviewAxisInsert = TableInsert<'ai_interview_axes'>

// Update型（更新時用）
export type UserUpdate = TableUpdate<'users'>
export type OrganizationUpdate = TableUpdate<'organizations'>
export type ServiceUpdate = TableUpdate<'services'>
export type FAQUpdate = TableUpdate<'faqs'>
export type CaseStudyUpdate = TableUpdate<'case_studies'>
export type PostUpdate = TableUpdate<'posts'>

// JOIN系の型（よく使われる結合パターン）
export interface OrganizationWithMembers extends Organization {
  organization_members: OrganizationMember[]
}

export interface UserWithOrganization extends User {
  organization: Organization | null
}

export interface ServiceWithOrganization extends Service {
  organization: Organization
}

// 部分的な型（フォーム等で使用）
export type OrganizationFormFields = Pick<Organization, 'name' | 'description' | 'url' | 'logo_url'>
export type ServiceFormFields = Pick<Service, 'name' | 'description'>
export type FAQFormFields = Pick<FAQ, 'question' | 'answer' | 'category'>
export type CaseStudyFormFields = Pick<CaseStudy, 'title' | 'content'>

// 公開用の型（内部フィールドを除外）
export type PublicOrganization = Omit<Organization, 'created_by' | 'updated_at'>
export type PublicUser = Omit<User, 'email' | 'created_at'>

// ステータス別の型フィルタ
export type PublishedOrganization = Organization & { status: 'published' }

// 検索・フィルタ用の型
export interface DatabaseSearchFilters {
  query?: string
  status?: string[]
  category?: string[]
  dateRange?: {
    from: string
    to: string
  }
  limit?: number
  offset?: number
}

// ソート用の型
export type SortDirection = 'asc' | 'desc'
export interface SortOptions<T> {
  field: keyof T
  direction: SortDirection
}

// Migrated from database.ts - Utility Types and Enums

// User Role Types (legacy from database.ts)
export type UserRole = 'admin' | 'editor' | 'viewer';

// User Segment Types
export type UserSegment = 
  | 'potential_customer'    // 見込み客
  | 'current_customer'      // 既存顧客
  | 'partner'              // パートナー
  | 'investor'             // 投資家
  | 'job_applicant'        // 求職者
  | 'media'               // メディア
  | 'other';              // その他

// Organization Status
export type OrganizationStatus = 
  | 'active'              // アクティブ
  | 'pending'             // 承認待ち
  | 'suspended'           // 停止中
  | 'archived'            // アーカイブ
  | 'draft'               // 下書き
  | 'published';          // 公開済み

// Partnership Types
export type PartnershipType = 
  | 'technology'          // 技術パートナー
  | 'channel'             // チャネルパートナー
  | 'strategic'           // 戦略パートナー
  | 'integration'         // 連携パートナー
  | 'reseller';           // リセラー

// Service Media Types
export interface ServiceMedia {
  type: 'image' | 'video' | 'document';
  url: string;
  title?: string;
  description?: string;
}

// Convenience types bridging legacy and Supabase schemas
export type SupabaseOrganization = Organization;

// Extended Service type with legacy fields for backward compatibility
export type ServiceWithLegacyFields = Service & {
  media?: ServiceMedia[] | null;
  price?: number | null;
  cta_url?: string | null;
};

// Extended Organization type with legacy fields for backward compatibility
export type OrganizationWithLegacyFields = Organization & {
  status?: OrganizationStatus;
  plan?: 'trial' | 'starter' | 'pro' | 'business' | 'enterprise';
  subscription_status?: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'paused';
  current_period_end?: string;
  trial_end_date?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  show_services?: boolean;
  show_posts?: boolean;
  show_case_studies?: boolean;
  show_faqs?: boolean;
  show_qa?: boolean;
  show_news?: boolean;
  show_partnership?: boolean;
  show_contact?: boolean;
  keywords?: string[] | null;
  languages_supported?: string[] | null;
  mission_statement?: string | null;
  vision_statement?: string | null;
  company_culture?: string | null;
  timezone?: string | null;
  business_hours?: any[] | null;
  social_media?: Record<string, string> | null;
  favicon_url?: string | null;
  brand_color_primary?: string | null;
  brand_color_secondary?: string | null;
  // Additional fields for search display
  industries?: string[] | null;
  awards?: string[] | null;
  certifications?: string[] | null;
  values?: string[] | null;
  // Relations that might be joined
  services?: any[];
  faqs?: any[];
  case_studies?: any[];
  posts?: any[];
};