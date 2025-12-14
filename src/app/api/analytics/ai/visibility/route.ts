/**
 * AI Visibility Score Analytics API
 * 計算済み AI Visibility Score の取得と分析
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAuthError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

// Internal type definitions for data processing
interface VisibilityScoreEntry {
  url: string;
  calculated_at: string;
  total_visibility_score: number | string;
  structured_data_score: number | null;
  ai_access_score: number | null;
  seo_performance_score: number | null;
  ai_bot_hits_count: number | null;
  unique_bots_count: number | null;
  ai_content_units?: {
    title: string;
    content_type: string;
  } | null;
}

interface TrendDataEntry {
  calculated_at: string;
  total_visibility_score: number | string;
}

interface DailyTrendStats {
  total: number;
  count: number;
}

// Helper functions for safe operations
function toSafeNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return !isNaN(parsed) ? parsed : defaultValue;
  }
  return defaultValue;
}

function calculateAverage(total: number, count: number): number {
  return count > 0 ? Math.round(total / count) : 0;
}

// Response types
interface VisibilityResponse {
  organization_id: string;
  overall_score: number;
  score_trend: {
    date: string;
    score: number;
    total_urls: number;
  }[];
  content_scores: {
    url: string;
    title: string | null;
    content_type: string | null;
    total_score: number;
    component_scores: {
      structured_data: number;
      ai_access: number;
      seo_performance: number;
    };
    ai_metrics: {
      bot_hits: number;
      unique_bots: number;
    };
    last_calculated: string;
  }[];
  summary: {
    total_analyzed_urls: number;
    average_score: number;
    top_performing_urls: number; // スコア80以上
    improvement_needed_urls: number; // スコア50以下
    last_calculation: string | null;
  };
  is_fallback?: boolean;
  fallback_reason?: string;
}

// GET - AI Visibility Score 取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 管理者認証チェック（テスト用に一時無効化）
    // TODO: 本格運用時は有効化 + Pro以上プラン制限

    // クエリパラメータ解析
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id') || searchParams.get('org_id');
    const trendDays = parseInt(searchParams.get('trend_days') || '30');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    if (!orgId) {
      return NextResponse.json(
        { error: 'Validation error', message: 'organization_id is required' },
        { status: 400 }
      );
    }

    // 1. 最新のスコアデータを取得
    const { data: latestScores, error: scoresError } = await supabase
      .from('ai_visibility_scores')
      .select(`
        *,
        ai_content_units (
          title,
          content_type
        )
      `)
      .eq('organization_id', orgId)
      .order('calculated_at', { ascending: false })
      .limit(limit);

    if (scoresError) {
      // Check for missing table (fail-open)
      if (scoresError.code === '42P01' || scoresError.message?.includes('does not exist')) {
        logger.debug('ai_visibility_scores table missing, returning empty data', { orgId });
        const fallbackResponse: VisibilityResponse = {
          organization_id: orgId,
          overall_score: 0,
          score_trend: [],
          content_scores: [],
          summary: {
            total_analyzed_urls: 0,
            average_score: 0,
            top_performing_urls: 0,
            improvement_needed_urls: 0,
            last_calculation: null,
          },
          is_fallback: true,
          fallback_reason: 'MISSING_TABLE'
        };
        return NextResponse.json(fallbackResponse);
      }
      
      logger.error('Error fetching visibility scores:', { data: scoresError });
      return NextResponse.json(
        { error: 'Database error', message: scoresError.message },
        { status: 500 }
      );
    }

    // 2. スコアトレンドデータを取得（日別集計）
    const trendStartDate = new Date();
    trendStartDate.setDate(trendStartDate.getDate() - trendDays);

    const { data: trendData, error: trendError } = await supabase
      .from('ai_visibility_scores')
      .select('calculated_at, total_visibility_score')
      .eq('organization_id', orgId)
      .gte('calculated_at', trendStartDate.toISOString())
      .order('calculated_at', { ascending: true });

    if (trendError) {
      // Check for missing table (fail-open) - already returned early if table missing
      logger.error('Error fetching trend data:', { data: trendError });
      return NextResponse.json(
        { error: 'Database error', message: trendError.message },
        { status: 500 }
      );
    }

    // 3. データ集計・整形
    const scores = latestScores || [];
    
    // 最新スコアのURL別グループ化（同一URLの最新データのみ）
    const latestByUrl = scores.reduce((acc, score) => {
      const entry = score as VisibilityScoreEntry;
      if (!acc[entry.url] || new Date(entry.calculated_at) > new Date(acc[entry.url].calculated_at)) {
        acc[entry.url] = entry;
      }
      return acc;
    }, {} as Record<string, VisibilityScoreEntry>);

    const latestScoresList = Object.values(latestByUrl);

    // 総合スコア計算
    const totalUrls = latestScoresList.length;
    let scoreSum = 0;
    for (const score of latestScoresList) {
      const entry = score as VisibilityScoreEntry;
      scoreSum += toSafeNumber(entry.total_visibility_score, 0);
    }
    const averageScore = calculateAverage(scoreSum, totalUrls);

    // トレンド集計（日別平均）
    const dailyTrends = (trendData || []).reduce((acc, score) => {
      const entry = score as TrendDataEntry;
      const date = entry.calculated_at.split('T')[0]; // YYYY-MM-DD
      if (!acc[date]) {
        acc[date] = { total: 0, count: 0 };
      }
      acc[date].total += toSafeNumber(entry.total_visibility_score, 0);
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, DailyTrendStats>);

    const scoreTrend = Object.entries(dailyTrends)
      .map(([date, data]: [string, DailyTrendStats]) => ({
        date,
        score: calculateAverage(data.total, data.count),
        total_urls: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // コンテンツスコア詳細
    const contentScores = latestScoresList
      .map((score: VisibilityScoreEntry) => ({
        url: score.url,
        title: score.ai_content_units?.title || null,
        content_type: score.ai_content_units?.content_type || null,
        total_score: toSafeNumber(score.total_visibility_score, 0),
        component_scores: {
          structured_data: toSafeNumber(score.structured_data_score, 0),
          ai_access: toSafeNumber(score.ai_access_score, 0),
          seo_performance: toSafeNumber(score.seo_performance_score, 0),
        },
        ai_metrics: {
          bot_hits: toSafeNumber(score.ai_bot_hits_count, 0),
          unique_bots: toSafeNumber(score.unique_bots_count, 0),
        },
        last_calculated: score.calculated_at,
      }))
      .sort((a, b) => b.total_score - a.total_score); // スコア降順

    // サマリー統計
    const topPerformingUrls = latestScoresList.filter((score: VisibilityScoreEntry) => 
      toSafeNumber(score.total_visibility_score, 0) >= 80
    ).length;
    const improvementNeededUrls = latestScoresList.filter((score: VisibilityScoreEntry) => 
      toSafeNumber(score.total_visibility_score, 0) <= 50
    ).length;
    const lastCalculation: string | null = latestScoresList.length > 0 
      ? (latestScoresList as VisibilityScoreEntry[]).reduce((latest: string, score: VisibilityScoreEntry) => 
          new Date(score.calculated_at) > new Date(latest) ? score.calculated_at : latest, 
          (latestScoresList[0] as VisibilityScoreEntry).calculated_at
        )
      : null;

    const response: VisibilityResponse = {
      organization_id: orgId,
      overall_score: averageScore,
      score_trend: scoreTrend,
      content_scores: contentScores,
      summary: {
        total_analyzed_urls: totalUrls,
        average_score: averageScore,
        top_performing_urls: topPerformingUrls,
        improvement_needed_urls: improvementNeededUrls,
        last_calculation: lastCalculation,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    const errorId = generateErrorId('get-ai-visibility');
    logger.error('[GET /api/analytics/ai/visibility] Unexpected error:', { data: { errorId, error } });
    return createInternalError(errorId);
  }
}

// HEAD - メタデータのみ取得（パフォーマンス確認用）
export async function HEAD(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id') || searchParams.get('org_id');

    if (!orgId) {
      return new NextResponse(null, { status: 400 });
    }

    // 最新計算日時のみ取得
    const { data, error } = await supabase
      .from('ai_visibility_scores')
      .select('calculated_at')
      .eq('organization_id', orgId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return new NextResponse(null, { status: 500 });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    if (data?.calculated_at) {
      headers.set('Last-Modified', new Date(data.calculated_at).toUTCString());
    }

    return new NextResponse(null, { 
      status: data ? 200 : 404,
      headers 
    });

  } catch (error) {
    logger.error('[HEAD /api/analytics/ai/visibility] Error:', { data: error });
    return new NextResponse(null, { status: 500 });
  }
}