/**
 * Q&A統計機能の型定義とユーティリティ関数
 * 管理者・企業担当者専用の詳細分析とエクスポート機能
 */

import { normalizeUserAgent, anonymizeIP, validateDateRange, getPresetDateRange, getDefaultDateRange, generateCSV, createErrorResponse, createSuccessResponse, debugLog } from './material-stats';

// =================================
// Q&A Stats 型定義
// =================================

export interface QAStatsTotals {
  views: number;
  entries: number; // 総Q&A数
}

export interface QAStatsDailyPoint {
  date: string; // YYYY-MM-DD
  views: number;
  unique_views: number;
}

export interface QAStatsSummary {
  qnaId: string;
  question: string;
  categoryName?: string;
  organizationName: string;
  views: number;
  uniqueViews: number;
  lastActivityAt: string;
}

export interface QAStatsTopEntry {
  qnaId: string;
  question: string;
  categoryName?: string;
  score: number; // views (単純な閲覧数ベース)
  views: number;
  uniqueViews: number;
}

export interface QAStatsResponse {
  totals: QAStatsTotals;
  daily: QAStatsDailyPoint[];
  byQNA: QAStatsSummary[];
  topEntries: QAStatsTopEntry[];
  userAgents: {
    Chrome: number;
    Safari: number;
    Firefox: number;
    Edge: number;
    Other: number;
  };
  period: {
    from: string;
    to: string;
  };
}

export interface QAStatsFilters {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  qnaId?: string;
  categoryId?: string;
  organizationId?: string; // 企業別フィルタ用
}

export interface QACSVExportOptions {
  type: 'daily' | 'byQNA';
  filters: QAStatsFilters;
}

// =================================
// Questions 型定義
// =================================

export interface QuestionStats {
  total: number;
  open: number;
  answered: number;
  closed: number;
}

export interface QuestionsByCompany {
  companyId: string;
  companyName: string;
  questionCount: number;
  openCount: number;
  answeredCount: number;
  lastQuestionAt?: string;
}

export interface QuestionsFilters {
  status?: 'open' | 'answered' | 'closed';
  companyId?: string;
  userId?: string;
  from?: string;
  to?: string;
}

// =================================
// ユーティリティ関数
// =================================

/**
 * Q&A人気度スコア計算 (単純な閲覧数ベース)
 */
export function calculateQAPopularityScore(views: number, uniqueViews: number): number {
  return views + (uniqueViews * 0.5); // ユニーク閲覧に若干の重み
}

/**
 * Q&A日別CSVデータ生成
 */
export function generateQADailyCSV(dailyData: QAStatsDailyPoint[]): string {
  const headers = ['日付', '閲覧数', 'ユニーク閲覧数'];
  const mappedData = dailyData.map(item => ({
    '日付': item.date,
    '閲覧数': item.views,
    'ユニーク閲覧数': item.unique_views
  }));
  
  return generateCSV(mappedData, headers);
}

/**
 * Q&A別CSVデータ生成
 */
export function generateQAEntriesCSV(qnaData: QAStatsSummary[]): string {
  const headers = ['Q&A_ID', '質問', 'カテゴリ', '企業名', '閲覧数', 'ユニーク閲覧数', '最終アクティビティ', '人気度スコア'];
  const mappedData = qnaData.map(item => ({
    'Q&A_ID': item.qnaId,
    '質問': item.question.length > 50 ? item.question.substring(0, 50) + '...' : item.question,
    'カテゴリ': item.categoryName || '未分類',
    '企業名': item.organizationName,
    '閲覧数': item.views,
    'ユニーク閲覧数': item.uniqueViews,
    '最終アクティビティ': item.lastActivityAt.split('T')[0], // 日付部分のみ
    '人気度スコア': calculateQAPopularityScore(item.views, item.uniqueViews)
  }));
  
  return generateCSV(mappedData, headers);
}

/**
 * 質問箱CSVデータ生成
 */
export function generateQuestionsCSV(questions: any[]): string {
  const headers = ['質問ID', '企業名', '質問者', '質問内容', 'ステータス', '投稿日', '回答日', '回答者'];
  const mappedData = questions.map(item => ({
    '質問ID': item.id,
    '企業名': item.company_name || '不明',
    '質問者': item.user_full_name || item.user_email || '匿名',
    '質問内容': item.question_text.length > 100 ? item.question_text.substring(0, 100) + '...' : item.question_text,
    'ステータス': item.status === 'open' ? '未回答' : item.status === 'answered' ? '回答済み' : '完了',
    '投稿日': item.created_at.split('T')[0],
    '回答日': item.answered_at ? item.answered_at.split('T')[0] : '',
    '回答者': item.answerer_name || ''
  }));
  
  return generateCSV(mappedData, headers);
}

/**
 * Q&A統計用ファイル名生成
 */
export function generateQAExportFileName(type: 'daily' | 'byQNA' | 'questions', from: string, to: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  let typeLabel = '';
  
  switch (type) {
    case 'daily':
      typeLabel = 'Q&A日別統計';
      break;
    case 'byQNA':
      typeLabel = 'Q&A別統計';
      break;
    case 'questions':
      typeLabel = '質問箱データ';
      break;
  }
  
  return `Q&A統計_${typeLabel}_${from}_${to}_${timestamp}.csv`;
}

/**
 * 質問ステータス変換（日本語表示用）
 */
export function translateQuestionStatus(status: string): string {
  switch (status) {
    case 'open':
      return '未回答';
    case 'answered':
      return '回答済み';
    case 'closed':
      return '完了';
    default:
      return status;
  }
}

/**
 * Q&A カテゴリフィルター用オプション生成
 */
export function generateCategoryOptions(categories: any[]): Array<{value: string, label: string}> {
  return [
    { value: '', label: '全カテゴリ' },
    ...categories.map(cat => ({
      value: cat.id,
      label: cat.name
    }))
  ];
}

/**
 * 企業フィルター用オプション生成
 */
export function generateCompanyOptions(companies: any[]): Array<{value: string, label: string}> {
  return [
    { value: '', label: '全企業' },
    ...companies.map(comp => ({
      value: comp.id,
      label: comp.name
    }))
  ];
}

// 既存関数の再エクスポート（統一インターフェース）
export {
  normalizeUserAgent,
  anonymizeIP,
  validateDateRange,
  getPresetDateRange,
  getDefaultDateRange,
  generateCSV,
  createErrorResponse,
  createSuccessResponse,
  debugLog
} from './material-stats';