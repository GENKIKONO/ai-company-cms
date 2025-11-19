/**
 * AI Visibility Score Analytics API
 * 計算済み AI Visibility Score の取得と分析
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createAuthError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

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
}

// GET - AI Visibility Score 取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
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
      if (!acc[score.url] || new Date(score.calculated_at) > new Date(acc[score.url].calculated_at)) {
        acc[score.url] = score;
      }
      return acc;
    }, {} as Record<string, any>);

    const latestScoresList = Object.values(latestByUrl);

    // 総合スコア計算
    const totalUrls = latestScoresList.length;
    let scoreSum = 0;
    for (const score of latestScoresList) {
      scoreSum += parseFloat(String((score as any).total_visibility_score || 0));
    }
    const averageScore = totalUrls > 0 ? Math.round(scoreSum / totalUrls) : 0;

    // トレンド集計（日別平均）
    const dailyTrends = (trendData || []).reduce((acc, score) => {
      const date = score.calculated_at.split('T')[0]; // YYYY-MM-DD
      if (!acc[date]) {
        acc[date] = { total: 0, count: 0 };
      }
      acc[date].total += Number(score.total_visibility_score);
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const scoreTrend = Object.entries(dailyTrends)
      .map(([date, data]) => ({
        date,
        score: Math.round(data.total / data.count),
        total_urls: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // コンテンツスコア詳細
    const contentScores = latestScoresList
      .map((score: any) => ({
        url: score.url,
        title: score.ai_content_units?.title || null,
        content_type: score.ai_content_units?.content_type || null,
        total_score: Number(score.total_visibility_score),
        component_scores: {
          structured_data: score.structured_data_score,
          ai_access: score.ai_access_score,
          seo_performance: score.seo_performance_score,
        },
        ai_metrics: {
          bot_hits: score.ai_bot_hits_count || 0,
          unique_bots: score.unique_bots_count || 0,
        },
        last_calculated: score.calculated_at,
      }))
      .sort((a, b) => b.total_score - a.total_score); // スコア降順

    // サマリー統計
    const topPerformingUrls = latestScoresList.filter((score: any) => Number(score.total_visibility_score) >= 80).length;
    const improvementNeededUrls = latestScoresList.filter((score: any) => Number(score.total_visibility_score) <= 50).length;
    const lastCalculation = latestScoresList.length > 0 
      ? latestScoresList.reduce((latest: string, score: any) => 
          new Date(score.calculated_at) > new Date(latest) ? score.calculated_at : latest, 
          (latestScoresList[0] as any).calculated_at
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
        last_calculation: (lastCalculation as string) || '',
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
    const supabase = await supabaseServer();
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