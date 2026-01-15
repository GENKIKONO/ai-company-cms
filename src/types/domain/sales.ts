/**
 * Sales Materials Domain Types
 * 
 * 営業資料管理関連の専用型
 */

// Sales System Enums
export type SalesAction = 'view' | 'download';

// Core Sales Types
// NOTE: DBスキーマ (sales_materials) に合わせた型定義
export interface SalesMaterial {
  id: string;
  organization_id: string | null;
  title: string;
  description?: string | null;
  file_path: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  is_public?: boolean;
  status?: string | null;
  created_by?: string | null;
  created_at: string;
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

// Statistics and Analytics
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