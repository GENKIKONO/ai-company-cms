/**
 * Q&A System Domain Types
 * 
 * Q&Aナレッジシステム関連の専用型
 */

// Q&A System Enums
export type QAVisibility = 'global' | 'org';
export type QAEntryVisibility = 'public' | 'private';
export type QAEntryStatus = 'draft' | 'published' | 'archived';
export type QALogAction = 'create' | 'update' | 'publish' | 'unpublish' | 'archive' | 'delete' | 'category_create' | 'category_update' | 'category_delete';

// Core Q&A Types
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

// Extended Types with Joins
export interface QAEntryWithCategory extends QAEntry {
  qa_categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// Form Data Types
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

// Stats Types
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