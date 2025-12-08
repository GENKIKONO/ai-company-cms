/**
 * Phase 7-A: CMS / Site Settings 型定義
 * Supabase の「正」のスキーマに合わせた型定義
 */

// ===== CMS Site Settings =====
// Supabase の「正」: cms_site_settings テーブル
export interface CmsSiteSettingsRow {
  id: string;
  organization_id: string; // UNIQUE constraint
  logo_url?: string | null;
  hero_image_url?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string[] | null; // 配列型
  theme_color?: string | null;
  created_at: string;
  updated_at: string;
}

// Insert 型
export type CmsSiteSettingsInsert = Omit<CmsSiteSettingsRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

// Update 型
export type CmsSiteSettingsUpdate = Partial<Omit<CmsSiteSettingsRow, 'id' | 'organization_id' | 'created_at'>> & {
  updated_at?: string;
};

// ===== Organization Site Visibility Flags =====
// Supabase の「正」: organizations テーブルの show_* 系カラム
export interface OrganizationSiteVisibilityFlags {
  show_services?: boolean;
  show_posts?: boolean;
  show_case_studies?: boolean;
  show_faqs?: boolean;
  show_qa?: boolean;
  show_news?: boolean;
  show_partnership?: boolean;
  // TODO: [SUPABASE_CMS_MIGRATION] 他にも show_* フラグがあるかもしれません
}

// ===== 統合 DTO =====
// UI で使うための合成型
export interface SiteSettingsDTO extends CmsSiteSettingsRow, OrganizationSiteVisibilityFlags {
  // 追加のメタデータ（必要に応じて）
}

// ===== Public Content Tables =====
// Supabase の「正」: public_*_tbl 系テーブル
export interface PublicPostRow {
  id: string;
  organization_id: string;
  title: string;
  content?: string | null;
  slug?: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  // TODO: [SUPABASE_CMS_MIGRATION] 実際のカラムを確認して調整
}

export interface PublicNewsRow {
  id: string;
  organization_id: string;
  title: string;
  content?: string | null;
  slug?: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  // TODO: [SUPABASE_CMS_MIGRATION] 実際のカラムを確認して調整
}

export interface PublicServiceRow {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  slug?: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  // TODO: [SUPABASE_CMS_MIGRATION] 実際のカラムを確認して調整
}

export interface PublicProductRow {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  slug?: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  // TODO: [SUPABASE_CMS_MIGRATION] 実際のカラムを確認して調整
}

export interface PublicCaseStudyRow {
  id: string;
  organization_id: string;
  title: string;
  problem?: string | null;
  solution?: string | null;
  result?: string | null;
  slug?: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  // TODO: [SUPABASE_CMS_MIGRATION] 実際のカラムを確認して調整
}

export interface PublicFaqRow {
  id: string;
  organization_id: string;
  question: string;
  answer?: string | null;
  category?: string | null;
  slug?: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  // TODO: [SUPABASE_CMS_MIGRATION] 実際のカラムを確認して調整
}

// ===== CMS Sections (既存と同じだが型安全性向上) =====
export interface CmsSectionRow {
  id?: string;
  page_key: string;
  section_key: string;
  section_type: string;
  title?: string | null;
  content: Record<string, any>;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CmsSectionInsert = Omit<CmsSectionRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CmsSectionUpdate = Partial<Omit<CmsSectionRow, 'id'>> & {
  updated_at?: string;
};

// ===== CMS Assets (既存と同じだが型安全性向上) =====
export interface CmsAssetRow {
  id: string;
  filename: string;
  original_name?: string | null;
  file_path: string;
  file_size?: number | null;
  mime_type?: string | null;
  alt_text?: string | null;
  description?: string | null;
  tags?: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
}

export type CmsAssetInsert = Omit<CmsAssetRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CmsAssetUpdate = Partial<Omit<CmsAssetRow, 'id' | 'created_at'>> & {
  updated_at?: string;
};

// ===== Legacy Compatibility =====
// 既存コードとの互換性のための型 (徐々に廃止予定)
// TODO: [SUPABASE_CMS_MIGRATION] これらの型は段階的に廃止
export interface LegacyCMSSettings {
  [key: string]: any;
  // key-value 形式の旧設定
}

export interface LegacyCMSSection {
  section_key: string;
  section_type: string;
  title?: string;
  content: Record<string, any>;
  display_order: number;
  is_active: boolean;
}

// ===== API Response Types =====
export interface CmsSiteSettingsApiResponse {
  success: boolean;
  data?: CmsSiteSettingsRow;
  error?: string;
}

export interface CmsSiteSettingsListApiResponse {
  success: boolean;
  data?: CmsSiteSettingsRow[];
  total?: number;
  error?: string;
}

export interface CmsSectionApiResponse {
  success: boolean;
  data?: CmsSectionRow;
  error?: string;
  message?: string;
}

export interface CmsSectionListApiResponse {
  success: boolean;
  data?: CmsSectionRow[];
  total?: number;
  error?: string;
  message?: string;
}

export interface CmsAssetApiResponse {
  success: boolean;
  data?: CmsAssetRow;
  error?: string;
  message?: string;
}

export interface CmsAssetListApiResponse {
  success: boolean;
  data?: CmsAssetRow[];
  total?: number;
  pagination?: {
    limit: number;
    offset: number;
    has_more: boolean;
  };
  error?: string;
  message?: string;
}

// ===== Utility Types =====
export type PublicContentTableNames = 
  | 'public_posts_tbl'
  | 'public_news_tbl' 
  | 'public_services_tbl'
  | 'public_products_tbl'
  | 'public_case_studies_tbl'
  | 'public_faqs_tbl';

export type PublicContentRow = 
  | PublicPostRow
  | PublicNewsRow
  | PublicServiceRow
  | PublicProductRow
  | PublicCaseStudyRow
  | PublicFaqRow;

// マッピング用ヘルパー型
export interface PublicContentTableMap {
  'public_posts_tbl': PublicPostRow;
  'public_news_tbl': PublicNewsRow;
  'public_services_tbl': PublicServiceRow;
  'public_products_tbl': PublicProductRow;
  'public_case_studies_tbl': PublicCaseStudyRow;
  'public_faqs_tbl': PublicFaqRow;
}