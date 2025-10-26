/**
 * 営業資料統計機能の型定義とユーティリティ関数
 * 管理者専用の詳細分析とエクスポート機能
 */

// =================================
// 型定義
// =================================

export interface MaterialStatsTotals {
  views: number;
  downloads: number;
}

export interface MaterialStatsDailyPoint {
  date: string; // YYYY-MM-DD
  views: number;
  downloads: number;
}

export interface MaterialStatsSummary {
  materialId: string;
  title: string;
  views: number;
  downloads: number;
  lastActivityAt: string;
}

export interface MaterialStatsTopMaterial {
  materialId: string;
  title: string;
  score: number; // views + downloads * 2 (ダウンロード重み付け)
  views: number;
  downloads: number;
}

export interface UserAgentSummary {
  Chrome: number;
  Safari: number;
  Firefox: number;
  Edge: number;
  Other: number;
}

export interface MaterialStatsResponse {
  totals: MaterialStatsTotals;
  daily: MaterialStatsDailyPoint[];
  byMaterial: MaterialStatsSummary[];
  topMaterials: MaterialStatsTopMaterial[];
  userAgents: UserAgentSummary;
  period: {
    from: string;
    to: string;
  };
}

export interface MaterialStatsFilters {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  materialId?: string;
}

export interface CSVExportOptions {
  type: 'daily' | 'byMaterial';
  filters: MaterialStatsFilters;
}

// =================================
// ユーティリティ関数
// =================================

/**
 * 日付範囲のデフォルト値を取得（直近30日）
 */
export function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 30);

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0]
  };
}

/**
 * User-Agentを主要ブラウザ別に正規化
 */
export function normalizeUserAgent(userAgent: string): keyof UserAgentSummary {
  if (!userAgent) return 'Other';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('chrome') && !ua.includes('edge')) {
    return 'Chrome';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    return 'Safari';
  } else if (ua.includes('firefox')) {
    return 'Firefox';
  } else if (ua.includes('edge') || ua.includes('edg/')) {
    return 'Edge';
  }
  
  return 'Other';
}

/**
 * IPアドレスを/24マスクで匿名化
 * 例: 192.168.1.100 → 192.168.1.0
 */
export function anonymizeIP(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown';
  
  const parts = ip.split('.');
  if (parts.length !== 4) return 'unknown';
  
  // IPv4の場合、最後のオクテットを0にマスク
  return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
}

/**
 * 日付文字列のバリデーション (YYYY-MM-DD)
 */
export function isValidDateString(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 日付範囲のバリデーション
 */
export function validateDateRange(from: string, to: string): { valid: boolean; error?: string } {
  if (!isValidDateString(from)) {
    return { valid: false, error: 'Invalid from date format' };
  }
  
  if (!isValidDateString(to)) {
    return { valid: false, error: 'Invalid to date format' };
  }
  
  const fromDate = new Date(from);
  const toDate = new Date(to);
  
  if (fromDate > toDate) {
    return { valid: false, error: 'From date must be before to date' };
  }
  
  // 最大1年間の範囲制限
  const maxDays = 365;
  const diffTime = toDate.getTime() - fromDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > maxDays) {
    return { valid: false, error: `Date range too large (max ${maxDays} days)` };
  }
  
  return { valid: true };
}

/**
 * 人気度スコア計算 (views + downloads * 2)
 */
export function calculatePopularityScore(views: number, downloads: number): number {
  return views + (downloads * 2);
}

/**
 * CSV形式でのデータ変換（UTF-8 BOM付き）
 */
export function generateCSV(data: any[], headers: string[]): string {
  // UTF-8 BOM (Excel での文字化け防止)
  const BOM = '\uFEFF';
  
  // ヘッダー行
  const csvHeaders = headers.join(',');
  
  // データ行（値をエスケープ）
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header] || '';
      // 値にカンマや改行、ダブルクォートが含まれる場合はエスケープ
      if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return BOM + [csvHeaders, ...csvRows].join('\n');
}

/**
 * 日別CSVデータ生成
 */
export function generateDailyCSV(dailyData: MaterialStatsDailyPoint[]): string {
  const headers = ['日付', '閲覧数', 'ダウンロード数'];
  const mappedData = dailyData.map(item => ({
    '日付': item.date,
    '閲覧数': item.views,
    'ダウンロード数': item.downloads
  }));
  
  return generateCSV(mappedData, headers);
}

/**
 * 資料別CSVデータ生成
 */
export function generateMaterialCSV(materialData: MaterialStatsSummary[]): string {
  const headers = ['資料ID', '資料名', '閲覧数', 'ダウンロード数', '最終アクティビティ', '人気度スコア'];
  const mappedData = materialData.map(item => ({
    '資料ID': item.materialId,
    '資料名': item.title,
    '閲覧数': item.views,
    'ダウンロード数': item.downloads,
    '最終アクティビティ': item.lastActivityAt.split('T')[0], // 日付部分のみ
    '人気度スコア': calculatePopularityScore(item.views, item.downloads)
  }));
  
  return generateCSV(mappedData, headers);
}

/**
 * 期間プリセット計算
 */
export function getPresetDateRange(preset: '7d' | '30d' | '90d'): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  
  switch (preset) {
    case '7d':
      from.setDate(to.getDate() - 7);
      break;
    case '30d':
      from.setDate(to.getDate() - 30);
      break;
    case '90d':
      from.setDate(to.getDate() - 90);
      break;
  }
  
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0]
  };
}

/**
 * ファイル名生成（CSVエクスポート用）
 */
export function generateExportFileName(type: 'daily' | 'byMaterial', from: string, to: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const typeLabel = type === 'daily' ? '日別統計' : '資料別統計';
  
  return `営業資料統計_${typeLabel}_${from}_${to}_${timestamp}.csv`;
}

/**
 * API エラーレスポンス生成
 */
export function createErrorResponse(message: string, status: number = 400) {
  return Response.json(
    { error: message },
    { status }
  );
}

/**
 * API 成功レスポンス生成
 */
export function createSuccessResponse(data: any, status: number = 200) {
  return Response.json(data, { status });
}

/**
 * デバッグ用ログ関数（本番では無効化）
 */
export function debugLog(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[MaterialStats] ${message}`, data ? data : '');
  }
}

// =================================
// 統一エクスポート（要件対応）
// =================================

export type MaterialAction = 'view' | 'download';

/**
 * 営業資料統計ログ記録
 */
export async function recordMaterialStat(materialId: string, action: MaterialAction, userAgent?: string, ipAddress?: string) {
  // 実装は各呼び出し側で行う（API固有のSupabase操作のため）
  throw new Error('recordMaterialStat must be implemented in the calling API route');
}

/**
 * 営業資料統計データ取得
 */
export async function getMaterialStats(filters: MaterialStatsFilters) {
  // 実装は各呼び出し側で行う（API固有のSupabase操作のため）
  throw new Error('getMaterialStats must be implemented in the calling API route');
}

/**
 * 営業資料統計CSVエクスポート
 */
export function exportMaterialStatsCSV(type: 'daily' | 'byMaterial', data: any[]): string {
  if (type === 'daily') {
    return generateDailyCSV(data as MaterialStatsDailyPoint[]);
  } else {
    return generateMaterialCSV(data as MaterialStatsSummary[]);
  }
}