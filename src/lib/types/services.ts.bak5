/**
 * Services型定義
 * Database Schema準拠 + 将来拡張対応
 */

export interface Service {
  id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  organization_id: string | null;
  created_at: string;
  updated_at: string;
  
  // 将来追加予定フィールド（null安全）
  category?: string | null;
  features?: string[] | null;
  price?: number | null;
  cta_url?: string | null;
  cta_text?: string | null;
  media?: any | null; // JSONB型
}

export interface PublicServiceResponse {
  services: Service[];
  total: number;
}

export interface ServiceCreateInput {
  name: string;
  description?: string | null;
  organization_id: string;
  status?: 'draft' | 'published';
  category?: string | null;
  features?: string[] | null;
  price?: number | null;
  cta_url?: string | null;
  cta_text?: string | null;
}

export interface ServiceUpdateInput extends Partial<ServiceCreateInput> {
  id: string;
}