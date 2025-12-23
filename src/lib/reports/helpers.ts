/**
 * Monthly Reports - Shared Helpers
 * period/level/meta の変換ヘルパ
 *
 * 将来の reports スキーマ移行時:
 * - これらのヘルパは変更不要（アプリ層の変換ロジック）
 * - DB関数は public.* → reports.* の thin-wrapper 化で対応
 */

// =====================================================
// Period Helpers (year-month → UTC period_start/end)
// =====================================================

/**
 * year/month から period_start (YYYY-MM-01) を生成
 */
export function toPeriodStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/**
 * year/month から period_end (月末日) を生成
 */
export function toPeriodEnd(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

/**
 * period_start (YYYY-MM-DD) から year/month を抽出
 */
export function fromPeriodStart(periodStart: string): { year: number; month: number } {
  const [yearStr, monthStr] = periodStart.split('-');
  return { year: parseInt(yearStr, 10), month: parseInt(monthStr, 10) };
}

/**
 * URL パラメータ形式 (YYYY-MM) を period に変換
 */
export function urlParamToPeriod(param: string): {
  year: number;
  month: number;
  periodStart: string;
  periodEnd: string
} | null {
  const match = param.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);

  return {
    year,
    month,
    periodStart: toPeriodStart(year, month),
    periodEnd: toPeriodEnd(year, month)
  };
}

/**
 * year/month を URL パラメータ形式に変換
 */
export function periodToUrlParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * 前月の period を取得
 */
export function getPreviousPeriod(year: number, month: number): {
  year: number;
  month: number;
  periodStart: string;
  periodEnd: string;
} {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return {
    year: prevYear,
    month: prevMonth,
    periodStart: toPeriodStart(prevYear, prevMonth),
    periodEnd: toPeriodEnd(prevYear, prevMonth)
  };
}

// =====================================================
// Level/Meta Helpers
// =====================================================

/**
 * レポートレベル型
 */
export type ReportLevel = 'basic' | 'advanced';

/**
 * Meta 型（DB の jsonb に格納）
 */
export interface ReportMeta {
  level: ReportLevel;
  [key: string]: unknown;
}

/**
 * level を meta オブジェクトに変換
 */
export function levelToMeta(level: ReportLevel, extra?: Record<string, unknown>): ReportMeta {
  return {
    level,
    ...extra
  };
}

/**
 * meta から level を抽出（デフォルト: basic）
 */
export function metaToLevel(meta: Record<string, unknown> | null | undefined): ReportLevel {
  if (!meta || typeof meta.level !== 'string') return 'basic';
  return meta.level === 'advanced' ? 'advanced' : 'basic';
}

// =====================================================
// Period Selection Type
// =====================================================

export interface PeriodSelection {
  year: number;
  month: number;
  periodStart: string;
  periodEnd: string;
}

export function createPeriodSelection(year: number, month: number): PeriodSelection {
  return {
    year,
    month,
    periodStart: toPeriodStart(year, month),
    periodEnd: toPeriodEnd(year, month)
  };
}

// =====================================================
// Format Helpers
// =====================================================

export function formatPeriodLabel(year: number, month: number): string {
  return new Date(year, month - 1).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long'
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
