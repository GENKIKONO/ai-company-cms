/**
 * Reports Domain Types
 *
 * レポートシステム関連の専用型
 *
 * DB実体: ai_monthly_reports テーブル（RLS有効）
 * - monthly_reports ビューは存在しない（直接 ai_monthly_reports を参照）
 * - month_bucket は period_start から BEFORE INSERT トリガで自動算出（制約には使用しない）
 * - ユニーク制約: (organization_id, period_start, period_end)
 * - ステータス遷移: pending → generating → completed/failed（DBトリガで強制）
 * - Realtime: org:{orgId}:monthly_reports チャンネルで status 更新を通知
 */

import type { Json } from '../supabase';

// Report System Enums
export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';
export type ReportLevel = 'basic' | 'advanced';

// Monthly Report Metrics (stored in metrics JSONB column)
export interface MonthlyReportMetrics {
  ai_visibility_score: number;
  total_bot_hits: number;
  unique_bots: number;
  analyzed_urls: number;
  top_performing_urls: number;
  improvement_needed_urls: number;
  file_url?: string; // Supabase Storage URL (stored in metrics for now)
  file_size?: number; // bytes
}

// Monthly Reports - maps to ai_monthly_reports table
export interface MonthlyReport {
  id: string;
  organization_id: string;
  period_start: string; // DATE format: 'YYYY-MM-01'
  period_end: string;   // DATE format: 'YYYY-MM-DD' (last day of month)
  month_bucket?: string; // Auto-computed from period_start by DB trigger
  plan_id: string;
  level: ReportLevel;
  status: ReportStatus;
  summary_text: string;
  metrics: MonthlyReportMetrics;
  sections?: Json | null;
  suggestions?: Json | null;
  created_at: string;
  updated_at: string;
}

// Legacy type alias for backward compatibility
/** @deprecated Use MonthlyReport instead */
export interface LegacyMonthlyReport {
  id: string;
  organization_id: string;
  year: number;
  month: number;
  status: ReportStatus;
  format: 'html' | 'pdf';
  file_url?: string;
  file_size?: number;
  data_summary: MonthlyReportMetrics;
  generated_at?: string;
  sent_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Helper functions for period conversion
export function toPeriodStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export function toPeriodEnd(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

export function fromPeriodStart(periodStart: string): { year: number; month: number } {
  const [year, month] = periodStart.split('-').map(Number);
  return { year, month };
}