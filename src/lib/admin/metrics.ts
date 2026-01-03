/**
 * Admin Metrics Data Fetching
 * P3-8: KPI Metrics API Client
 *
 * /api/admin/metricsから KPI データを取得するヘルパー関数
 */

import type { AdminMetricsResponse, MetricsApiParams } from '@/types/admin-metrics';
import { logger } from '@/lib/utils/logger';

/**
 * KPIメトリクスデータを取得
 * 
 * @param range 期間 ('1w' | '4w' | '12w')
 * @param orgId 組織ID (オプション)
 * @returns AdminMetricsResponse
 */
export async function fetchMetricsData(
  range: MetricsApiParams['range'] = '4w',
  orgId?: string
): Promise<AdminMetricsResponse> {
  try {
    const params = new URLSearchParams();
    params.set('range', range);
    if (orgId) {
      params.set('orgId', orgId);
    }

    const response = await fetch(`/api/admin/metrics?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Next.js Server Components では cache 設定を使用
      cache: 'no-store', // KPIデータは常に最新を取得
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error occurred');
    }

    return result.data;

  } catch (error) {
    logger.error('Failed to fetch metrics data:', { data: error });

    // エラー時はフォールバック用の空データを返す
    return createEmptyMetricsResponse();
  }
}

/**
 * クライアント側でのメトリクスデータ取得（SWR等での使用想定）
 * 
 * @param range 期間
 * @param orgId 組織ID
 * @returns Promise<AdminMetricsResponse>
 */
export async function fetchMetricsDataClient(
  range: MetricsApiParams['range'] = '4w',
  orgId?: string
): Promise<AdminMetricsResponse> {
  const params = new URLSearchParams();
  params.set('range', range);
  if (orgId) {
    params.set('orgId', orgId);
  }

  const response = await fetch(`/api/admin/metrics?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch metrics: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.data;
}

/**
 * 週データの0埋め補間
 * APIから欠損している週のデータを0で補完する
 * 
 * @param data 週次データ配列
 * @param weeksCount 期間の週数
 * @param dateField 日付フィールド名
 * @returns 0埋めされたデータ配列
 */
export function fillMissingWeeks<T extends Record<string, any>>(
  data: T[],
  weeksCount: number,
  dateField: keyof T = 'week_start_utc'
): T[] {
  if (data.length === 0) return [];

  // 現在週の開始日を取得（UTC月曜日）
  const now = new Date();
  const currentWeekStart = getUTCWeekStart(now);

  // 必要な全週の配列を生成
  const allWeeks: string[] = [];
  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(currentWeekStart.getUTCDate() - (i * 7));
    allWeeks.push(weekStart.toISOString());
  }

  // データをマップに変換
  const dataMap = new Map<string, T>();
  data.forEach(item => {
    const weekKey = new Date(item[dateField] as string).toISOString();
    dataMap.set(weekKey, item);
  });

  // 欠損週を0で埋めたデータを生成
  return allWeeks.map(weekStart => {
    if (dataMap.has(weekStart)) {
      return dataMap.get(weekStart)!;
    } else {
      // デフォルト値で0埋め（最初の要素を参考にする）
      const template: Partial<T> = data[0] || {};
      const filledItem: Record<string, any> = { ...template };
      
      // 数値フィールドを0にリセット
      Object.keys(filledItem).forEach(key => {
        if (typeof filledItem[key] === 'number') {
          filledItem[key] = 0;
        }
      });
      
      // 日付フィールドを設定
      filledItem[dateField as string] = weekStart;
      
      return filledItem as T;
    }
  });
}

/**
 * UTC週の開始日を取得（月曜日始まり）
 */
function getUTCWeekStart(date: Date): Date {
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  const dayOfWeek = utcDate.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(utcDate);
  weekStart.setUTCDate(utcDate.getUTCDate() - mondayOffset);
  weekStart.setUTCHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * 空のメトリクスレスポンスを生成（エラー時のフォールバック）
 */
function createEmptyMetricsResponse(): AdminMetricsResponse {
  return {
    summary: {
      rls_denied_count: 0,
      job_fail_rate_top3: [],
      edge_error_rate_worst3: [],
      security_incidents_count: 0
    },
    charts: {
      rls_denied_weekly: [],
      job_fail_rate_weekly_by_job: [],
      edge_error_rate_latest_week: [],
      ai_interview_completion_rate_weekly_by_org: [],
      ai_citations_weekly_by_org: [],
      security_incidents_weekly_by_type_and_risk: [],
      alert_events_current_week: []
    }
  };
}

/**
 * 期間範囲を週数に変換
 */
export function rangeToWeeksCount(range: MetricsApiParams['range']): number {
  switch (range) {
    case '1w': return 1;
    case '4w': return 4;
    case '12w': return 12;
    default: return 4;
  }
}

/**
 * 日付文字列をフォーマット（チャート表示用）
 */
export function formatWeekDate(isoString: string): string {
  const date = new Date(isoString);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return `${month}/${day}`;
}