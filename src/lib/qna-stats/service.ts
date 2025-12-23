/**
 * Q&A Stats Service Layer
 *
 * 抽象化レイヤー: 将来のDB実装（qna_stats テーブル/ビュー）への移行を容易にする
 *
 * 現状: qa_entries + 集計ロジックでデータ生成
 * 将来: qna_stats ビュー/テーブルから直接取得
 *
 * TODO: [DB_MIGRATION] qna_stats ビュー作成後、getQnaStats を RPC/View 参照に切替
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  QAStatsResponse,
  QAStatsTotals,
  QAStatsDailyPoint,
  QAStatsSummary,
  QAStatsTopEntry,
  QAStatsFilters,
} from '../qna-stats';
import { normalizeUserAgent } from '../material-stats';

// =====================================================
// Types
// =====================================================

export interface QnaStatsServiceOptions {
  organizationId: string;
  filters: QAStatsFilters;
}

export interface QnaStatsResult {
  success: boolean;
  data?: QAStatsResponse;
  error?: string;
}

// =====================================================
// Feature Flags
// =====================================================

/**
 * qna_stats ビュー/テーブルが利用可能かどうか
 * 2024-12: Supabaseアシスタントにより存在確認済み
 */
const USE_QNA_STATS_VIEW = true;

// =====================================================
// Service Functions
// =====================================================

/**
 * Q&A統計データを取得
 *
 * 抽象化ポイント:
 * - USE_QNA_STATS_VIEW = false: 既存ロジック（qa_entries から集計）
 * - USE_QNA_STATS_VIEW = true: qna_stats ビューから直接取得
 */
export async function getQnaStats(
  supabase: SupabaseClient,
  options: QnaStatsServiceOptions
): Promise<QnaStatsResult> {
  const { organizationId, filters } = options;
  const { from, to, qnaId, categoryId } = filters;

  try {
    if (USE_QNA_STATS_VIEW) {
      // TODO: [DB_MIGRATION] qna_stats ビュー実装後に有効化
      return await getQnaStatsFromView(supabase, organizationId, filters);
    }

    // 現状: qa_entries + 直接集計
    return await getQnaStatsComputed(supabase, organizationId, filters);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * qna_stats ビューからデータ取得
 * 2024-12: Supabaseアシスタントにより存在確認済み
 */
async function getQnaStatsFromView(
  supabase: SupabaseClient,
  organizationId: string,
  filters: QAStatsFilters
): Promise<QnaStatsResult> {
  const { from: dateFrom, to: dateTo, qnaId, categoryId } = filters;

  try {
    let query = supabase
      .from('qna_stats')
      .select('*')
      .eq('organization_id', organizationId);

    if (qnaId) {
      query = query.eq('qna_id', qnaId);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (dateFrom) {
      query = query.gte('last_activity_at', `${dateFrom}T00:00:00`);
    }

    if (dateTo) {
      query = query.lte('last_activity_at', `${dateTo}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      // ビューが存在しない場合はフォールバック
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return await getQnaStatsComputed(supabase, organizationId, filters);
      }
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: createEmptyResponse(dateFrom || '', dateTo || ''),
      };
    }

    // ビューデータを QAStatsResponse に変換
    const byQNA: QAStatsSummary[] = data.map((row: any) => ({
      qnaId: row.qna_id,
      question: row.question,
      categoryName: row.category_name,
      organizationName: row.organization_name || 'Unknown',
      views: row.view_count || 0,
      uniqueViews: row.unique_view_count || 0,
      lastActivityAt: row.last_activity_at,
    }));

    const totalViews = byQNA.reduce((sum, item) => sum + item.views, 0);

    const topEntries: QAStatsTopEntry[] = [...byQNA]
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
      .map((item) => ({
        qnaId: item.qnaId,
        question: item.question,
        categoryName: item.categoryName,
        score: item.views,
        views: item.views,
        uniqueViews: item.uniqueViews,
      }));

    return {
      success: true,
      data: {
        totals: {
          views: totalViews,
          entries: byQNA.length,
        },
        daily: [], // 日別統計はビューに含まれていない場合
        byQNA,
        topEntries,
        userAgents: { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, Other: 0 },
        period: { from: dateFrom || '', to: dateTo || '' },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 既存ロジック: qa_entries から集計してデータ生成
 */
async function getQnaStatsComputed(
  supabase: SupabaseClient,
  organizationId: string,
  filters: QAStatsFilters
): Promise<QnaStatsResult> {
  const { from: dateFrom, to: dateTo, qnaId, categoryId } = filters;

  // qa_entries + 関連データを取得
  let query = supabase
    .from('qa_entries')
    .select(`
      id,
      question,
      organization_id,
      category_id,
      created_at,
      organizations!inner(name),
      qa_categories(name)
    `)
    .eq('organization_id', organizationId);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (qnaId) {
    query = query.eq('id', qnaId);
  }

  const { data: entries, error: entriesError } = await query;

  if (entriesError) {
    return {
      success: false,
      error: entriesError.message,
    };
  }

  if (!entries || entries.length === 0) {
    return {
      success: true,
      data: createEmptyResponse(dateFrom || '', dateTo || ''),
    };
  }

  // NOTE: 現在の実装では qna_stats_raw テーブルがないため、
  // 閲覧統計データは生成できません。
  // TODO: [DB_MIGRATION] qna_stats_raw テーブル作成後、閲覧データを取得

  // 仮のレスポンス（閲覧データなし）
  const byQNA: QAStatsSummary[] = entries.map((entry: any) => ({
    qnaId: entry.id,
    question: entry.question,
    categoryName: entry.qa_categories?.name,
    organizationName: entry.organizations?.name || 'Unknown',
    views: 0, // TODO: qna_stats_raw から取得
    uniqueViews: 0,
    lastActivityAt: entry.created_at,
  }));

  const topEntries: QAStatsTopEntry[] = byQNA
    .slice(0, 10)
    .map((item) => ({
      qnaId: item.qnaId,
      question: item.question,
      categoryName: item.categoryName,
      score: item.views,
      views: item.views,
      uniqueViews: item.uniqueViews,
    }));

  return {
    success: true,
    data: {
      totals: {
        views: 0,
        entries: entries.length,
      },
      daily: [],
      byQNA,
      topEntries,
      userAgents: { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, Other: 0 },
      period: { from: dateFrom || '', to: dateTo || '' },
    },
  };
}

/**
 * 空のレスポンス生成
 */
function createEmptyResponse(from: string, to: string): QAStatsResponse {
  return {
    totals: { views: 0, entries: 0 },
    daily: [],
    byQNA: [],
    topEntries: [],
    userAgents: { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, Other: 0 },
    period: { from, to },
  };
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * 日別統計の集計
 */
export function aggregateDailyStats(
  rawStats: Array<{ created_at: string; ip_address?: string; user_agent?: string }>
): QAStatsDailyPoint[] {
  const dailyMap = new Map<string, { views: number; uniqueViews: Set<string> }>();

  rawStats.forEach((stat) => {
    const date = stat.created_at.split('T')[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { views: 0, uniqueViews: new Set() });
    }
    const dayData = dailyMap.get(date)!;
    dayData.views += 1;

    const uniqueKey = `${stat.ip_address || 'unknown'}_${stat.user_agent || 'unknown'}`;
    dayData.uniqueViews.add(uniqueKey);
  });

  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      views: data.views,
      unique_views: data.uniqueViews.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * User Agent 分析
 */
export function analyzeUserAgents(
  rawStats: Array<{ user_agent?: string }>
): QAStatsResponse['userAgents'] {
  const userAgents = { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, Other: 0 };

  rawStats.forEach((stat) => {
    const normalized = normalizeUserAgent(stat.user_agent || '');
    userAgents[normalized] += 1;
  });

  return userAgents;
}
