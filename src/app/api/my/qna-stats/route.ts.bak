import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/utils/logger';
import { 
  createErrorResponse,
  createSuccessResponse,
  validateDateRange,
  getDefaultDateRange,
  normalizeUserAgent,
  debugLog
} from '@/lib/qna-stats';
import type { 
  QAStatsResponse,
  QAStatsTotals,
  QAStatsDailyPoint,
  QAStatsSummary,
  QAStatsTopEntry
} from '@/lib/qna-stats';

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResponse('Authentication required', 401);
    }

    // ユーザーの企業IDを取得
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .single();

    if (orgError || !orgData) {
      return createErrorResponse('Organization not found', 404);
    }

    const organizationId = orgData.id;
    const url = new URL(request.url);
    
    // パラメータ取得
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const qnaId = url.searchParams.get('qnaId');
    const categoryId = url.searchParams.get('categoryId');

    // 日付範囲の設定（デフォルト：過去30日）
    const defaultRange = getDefaultDateRange();
    const dateFrom = from || defaultRange.from;
    const dateTo = to || defaultRange.to;

    // 日付バリデーション
    const dateValidation = validateDateRange(dateFrom, dateTo);
    if (!dateValidation.valid) {
      return createErrorResponse(dateValidation.error || 'Invalid date range', 400);
    }

    debugLog('Company Q&A Stats request', { organizationId, dateFrom, dateTo, qnaId, categoryId });

    // 企業のQ&A統計データを取得（該当企業のQ&Aのみ）
    let baseQuery = supabase
      .from('qna_stats')
      .select(`
        *,
        qa_entries!inner(
          id,
          question,
          organization_id,
          category_id,
          organizations!inner(name),
          qa_categories(name)
        )
      `)
      .eq('qa_entries.organization_id', organizationId)
      .gte('created_at', `${dateFrom}T00:00:00`)
      .lte('created_at', `${dateTo}T23:59:59`);

    // フィルター適用
    if (qnaId) {
      baseQuery = baseQuery.eq('qna_id', qnaId);
    }
    if (categoryId) {
      baseQuery = baseQuery.eq('qa_entries.category_id', categoryId);
    }

    const { data: rawStats, error: statsError } = await baseQuery;

    if (statsError) {
      logger.error('Error fetching company Q&A stats:', statsError);
      return createErrorResponse('Failed to fetch Q&A stats', 500);
    }

    // データが空の場合のデフォルトレスポンス
    if (!rawStats || rawStats.length === 0) {
      const emptyResponse: QAStatsResponse = {
        totals: { views: 0, entries: 0 },
        daily: [],
        byQNA: [],
        topEntries: [],
        userAgents: { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, Other: 0 },
        period: { from: dateFrom, to: dateTo }
      };
      return createSuccessResponse(emptyResponse);
    }

    // 1. 総計の計算
    const totals: QAStatsTotals = {
      views: rawStats.length,
      entries: new Set(rawStats.map(stat => stat.qna_id)).size
    };

    // 2. 日別統計の集計
    const dailyMap = new Map<string, { views: number; uniqueViews: Set<string> }>();
    
    rawStats.forEach(stat => {
      const date = stat.created_at.split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { views: 0, uniqueViews: new Set() });
      }
      const dayData = dailyMap.get(date)!;
      dayData.views += 1;
      
      // ユニーク計算（IP + User Agent の組み合わせ）
      const uniqueKey = `${stat.ip_address || 'unknown'}_${stat.user_agent || 'unknown'}`;
      dayData.uniqueViews.add(uniqueKey);
    });

    const daily: QAStatsDailyPoint[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        views: data.views,
        unique_views: data.uniqueViews.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 3. Q&A別統計の集計
    const qnaMap = new Map<string, {
      qnaId: string;
      question: string;
      categoryName?: string;
      organizationName: string;
      views: number;
      uniqueViews: Set<string>;
      lastActivity: string;
    }>();

    rawStats.forEach(stat => {
      const qnaId = stat.qna_id;
      if (!qnaMap.has(qnaId)) {
        qnaMap.set(qnaId, {
          qnaId,
          question: stat.qa_entries.question,
          categoryName: stat.qa_entries.qa_categories?.name,
          organizationName: stat.qa_entries.organizations.name,
          views: 0,
          uniqueViews: new Set(),
          lastActivity: stat.created_at
        });
      }
      
      const qnaData = qnaMap.get(qnaId)!;
      qnaData.views += 1;
      
      const uniqueKey = `${stat.ip_address || 'unknown'}_${stat.user_agent || 'unknown'}`;
      qnaData.uniqueViews.add(uniqueKey);
      
      if (stat.created_at > qnaData.lastActivity) {
        qnaData.lastActivity = stat.created_at;
      }
    });

    const byQNA: QAStatsSummary[] = Array.from(qnaMap.values())
      .map(data => ({
        qnaId: data.qnaId,
        question: data.question,
        categoryName: data.categoryName,
        organizationName: data.organizationName,
        views: data.views,
        uniqueViews: data.uniqueViews.size,
        lastActivityAt: data.lastActivity
      }))
      .sort((a, b) => b.views - a.views);

    // 4. 人気Q&Aランキング（TOP 10）
    const topEntries: QAStatsTopEntry[] = byQNA
      .slice(0, 10)
      .map(item => ({
        qnaId: item.qnaId,
        question: item.question,
        categoryName: item.categoryName,
        score: item.views,
        views: item.views,
        uniqueViews: item.uniqueViews
      }));

    // 5. User Agent分析
    const userAgents = { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, Other: 0 };
    rawStats.forEach(stat => {
      const normalized = normalizeUserAgent(stat.user_agent || '');
      userAgents[normalized] += 1;
    });

    const response: QAStatsResponse = {
      totals,
      daily,
      byQNA,
      topEntries,
      userAgents,
      period: { from: dateFrom, to: dateTo }
    };

    debugLog('Company Q&A Stats response', response);
    return createSuccessResponse(response);

  } catch (error) {
    logger.error('Company Q&A Stats API error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse('Internal server error', 500);
  }
}