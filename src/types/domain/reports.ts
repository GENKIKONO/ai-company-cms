/**
 * Reports Domain Types
 * 
 * レポートシステム関連の専用型
 */

// Report System Enums
export type ReportStatus = 'generating' | 'completed' | 'failed';
export type ReportFormat = 'html' | 'pdf';

// Monthly Reports
export interface MonthlyReport {
  id: string;
  organization_id: string;
  year: number;
  month: number; // 1-12
  status: ReportStatus;
  format: ReportFormat;
  file_url?: string; // Supabase Storage URL
  file_size?: number; // bytes
  data_summary: {
    ai_visibility_score: number;
    total_bot_hits: number;
    unique_bots: number;
    analyzed_urls: number;
    top_performing_urls: number;
    improvement_needed_urls: number;
  };
  generated_at?: string;
  sent_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}