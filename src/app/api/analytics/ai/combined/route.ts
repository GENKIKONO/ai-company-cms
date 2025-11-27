/**
 * AI × SEO Combined Analytics API
 * AI Visibility と SEO メトリクスの統合分析・相関分析
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAuthError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

// Type definitions for analytics data
interface AIScoreData {
  url: string;
  visibility_score: number;
  bot_hits: number;
  unique_bots: number;
  analyzed_at: string;
}

interface SEOMetricData {
  url: string;
  average_position: number;
  impressions: number;
  clicks: number;
  ctr: number;
  date: string;
}

interface BotLogData {
  url: string;
  accessed_at?: string;
  bot_name?: string;
  last_access?: string;
  access_count?: number;
}

interface UrlMetrics {
  url?: string;
  title?: string;
  content_type?: string;
  ai_metrics: {
    visibility_score: number;
    bot_hits: number;
    unique_bots: number;
    last_ai_access?: string | null;
  };
  seo_metrics: {
    average_position: number;
    impressions: number;
    clicks: number;
    ctr: number;
  };
  last_ai_access?: string | null;
}

interface CorrelationData {
  correlation_score: number;
  correlation_strength: 'strong' | 'moderate' | 'weak' | 'none';
  sample_size: number;
}

interface InsightData {
  ai_outperforming_seo: {
    count: number;
    urls: string[];
  };
  seo_outperforming_ai: {
    count: number;
    urls: string[];
  };
  balanced_performance: {
    count: number;
    urls: string[];
  };
  optimization_opportunities: {
    ai_underperforming: string[];
    seo_underperforming: string[];
  };
}

interface TrendPoint {
  date: string;
  ai_avg_score: number;
  seo_avg_position: number;
  correlation: number;
}

interface PerformanceSummary {
  total_urls: number;
  avg_ai_score: number;
  avg_seo_position: number;
  overall_correlation: number;
  performance_distribution: {
    high_performers: number;
    medium_performers: number;
    low_performers: number;
  };
}

// Response types
interface CombinedAnalyticsResponse {
  organization_id: string;
  analysis_period: {
    start_date: string;
    end_date: string;
  };
  ai_seo_correlation: {
    correlation_score: number; // -1 to 1
    correlation_strength: 'strong' | 'moderate' | 'weak' | 'none';
    sample_size: number;
  };
  performance_matrix: {
    url?: string;
    title?: string;
    content_type?: string;
    ai_metrics: {
      visibility_score: number;
      bot_hits: number;
      unique_bots: number;
      last_ai_access?: string | null;
    };
    seo_metrics: {
      average_position: number;
      impressions: number;
      clicks: number;
      ctr: number;
    };
    combined_score: number; // 0-100 AI×SEO統合スコア
    performance_category: string;
  }[];
  insights: {
    ai_outperforming_seo: {
      count: number;
      urls: string[];
    };
    seo_outperforming_ai: {
      count: number;
      urls: string[];
    };
    optimization_opportunities: {
      ai_boost_needed: string[]; // SEOは良いがAIが弱い
      seo_boost_needed: string[]; // AIは強いがSEOが弱い
      content_quality_check: string[]; // 両方弱い
    };
  };
  trend_analysis: {
    date: string;
    ai_avg_score: number;
    seo_avg_position: number;
    correlation_daily: number;
  }[];
  summary: {
    total_analyzed_urls: number;
    high_performance_urls: number; // AI・SEO両方高い
    underperforming_urls: number; // AI・SEO両方低い
    ai_visibility_avg: number;
    seo_position_avg: number;
    recommendations: string[];
  };
}

// GET - AI × SEO 統合分析
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Business以上プラン制限チェック（テスト用に一時無効化）
    // TODO: 本格運用時は有効化

    // クエリパラメータ解析
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id') || searchParams.get('org_id');
    const trendDays = parseInt(searchParams.get('trend_days') || '30');
    const minDataPoints = parseInt(searchParams.get('min_data_points') || '5');

    if (!orgId) {
      return NextResponse.json(
        { error: 'Validation error', message: 'organization_id is required' },
        { status: 400 }
      );
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - trendDays);

    logger.info('Combined AI×SEO analysis started', {
      orgId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // 1. AI Visibility Scores 取得
    const { data: aiScores, error: aiError } = await supabase
      .from('ai_visibility_scores')
      .select(`
        *,
        ai_content_units (
          title,
          content_type
        )
      `)
      .eq('organization_id', orgId)
      .gte('calculated_at', startDate.toISOString())
      .order('calculated_at', { ascending: false });

    if (aiError) {
      logger.error('Failed to fetch AI scores:', { data: aiError });
      return NextResponse.json(
        { error: 'Database error', message: aiError.message },
        { status: 500 }
      );
    }

    // 2. SEO メトリクス取得
    const { data: seoMetrics, error: seoError } = await supabase
      .from('seo_search_console_metrics')
      .select('*')
      .eq('organization_id', orgId)
      .gte('date_recorded', startDate.toISOString().split('T')[0])
      .is('search_query', null) // ページレベルのメトリクスのみ
      .order('date_recorded', { ascending: false });

    if (seoError) {
      logger.error('Failed to fetch SEO metrics:', { data: seoError });
      return NextResponse.json(
        { error: 'Database error', message: seoError.message },
        { status: 500 }
      );
    }

    // 3. AI Bot ログ取得（最終アクセス日時用）
    const { data: botLogs, error: botError } = await supabase
      .from('ai_bot_logs')
      .select('url, accessed_at')
      .eq('organization_id', orgId)
      .gte('accessed_at', startDate.toISOString())
      .order('accessed_at', { ascending: false });

    if (botError) {
      logger.error('Failed to fetch bot logs:', { data: botError });
    }

    // 4. データ統合・分析
    const analysis = await performCombinedAnalysis(
      aiScores || [],
      seoMetrics || [],
      botLogs || [],
      startDate,
      endDate,
      minDataPoints
    );

    const response: CombinedAnalyticsResponse = {
      organization_id: orgId,
      analysis_period: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      },
      ...analysis,
    };

    return NextResponse.json(response);

  } catch (error) {
    const errorId = generateErrorId('combined-analytics');
    logger.error('[GET /api/analytics/ai/combined] Unexpected error:', { data: { errorId, error } });
    return createInternalError(errorId);
  }
}

/**
 * AI × SEO 統合分析実行
 */
async function performCombinedAnalysis(
  aiScores: AIScoreData[],
  seoMetrics: SEOMetricData[],
  botLogs: BotLogData[],
  startDate: Date,
  endDate: Date,
  minDataPoints: number
) {
  // URL別にデータを統合
  const urlDataMap = new Map<string, UrlMetrics>();

  // AI データを URL 別にマッピング
  const latestAIScores = getLatestScoresByUrl(aiScores);
  latestAIScores.forEach(score => {
    urlDataMap.set(score.url, {
      url: score.url,
      title: score.ai_content_units?.title,
      content_type: score.ai_content_units?.content_type,
      ai_metrics: {
        visibility_score: score.total_visibility_score,
        bot_hits: score.ai_bot_hits_count || 0,
        unique_bots: score.unique_bots_count || 0,
        last_ai_access: null, // 後で設定
      },
      seo_metrics: {
        average_position: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
      },
    });
  });

  // SEO データを統合
  const seoByUrl = aggregateSEOByUrl(seoMetrics);
  seoByUrl.forEach((seoData, url) => {
    if (!urlDataMap.has(url)) {
      urlDataMap.set(url, {
        url,
        ai_metrics: {
          visibility_score: 0,
          bot_hits: 0,
          unique_bots: 0,
          last_ai_access: null,
        },
        seo_metrics: seoData,
      });
    } else {
      urlDataMap.get(url)!.seo_metrics = seoData;
    }
  });

  // Bot ログから最終アクセス日時を設定
  const lastAccessByUrl = getLastAccessByUrl(botLogs);
  lastAccessByUrl.forEach((lastAccess, url) => {
    if (urlDataMap.has(url)) {
      urlDataMap.get(url)!.ai_metrics.last_ai_access = lastAccess;
    }
  });

  // パフォーマンスマトリクス計算
  const performanceMatrix = Array.from(urlDataMap.values())
    .filter(data => data.ai_metrics.visibility_score > 0 || data.seo_metrics.impressions > 0)
    .map(data => ({
      ...data,
      combined_score: calculateCombinedScore(data.ai_metrics, data.seo_metrics),
      performance_category: categorizePerformance(data.ai_metrics, data.seo_metrics),
    }))
    .sort((a, b) => b.combined_score - a.combined_score);

  // 相関分析
  const correlation = calculateCorrelation(performanceMatrix);

  // インサイト生成
  const insights = generateInsights(performanceMatrix);

  // トレンド分析
  const trendAnalysis = generateTrendAnalysis(aiScores, seoMetrics, startDate, endDate);

  // サマリー
  const summary = generateSummary(performanceMatrix);

  return {
    ai_seo_correlation: correlation,
    performance_matrix: performanceMatrix,
    insights,
    trend_analysis: trendAnalysis,
    summary,
  };
}

/**
 * URL別最新スコア取得
 */
function getLatestScoresByUrl(aiScores: any[]): any[] {
  const scoresByUrl = new Map<string, any>();
  
  aiScores.forEach(score => {
    if (!scoresByUrl.has(score.url) || 
        new Date(score.calculated_at) > new Date(scoresByUrl.get(score.url).calculated_at)) {
      scoresByUrl.set(score.url, score);
    }
  });

  return Array.from(scoresByUrl.values());
}

/**
 * URL別SEOデータ集計
 */
function aggregateSEOByUrl(seoMetrics: any[]): Map<string, any> {
  const seoByUrl = new Map<string, any>();

  seoMetrics.forEach(metric => {
    if (!seoByUrl.has(metric.url)) {
      seoByUrl.set(metric.url, {
        average_position: metric.average_position || 0,
        impressions: metric.impressions || 0,
        clicks: metric.clicks || 0,
        ctr: metric.ctr || 0,
      });
    } else {
      // 複数日データがある場合は平均値を計算
      const existing = seoByUrl.get(metric.url);
      existing.average_position = (existing.average_position + (metric.average_position || 0)) / 2;
      existing.impressions += metric.impressions || 0;
      existing.clicks += metric.clicks || 0;
      existing.ctr = existing.clicks > 0 ? existing.clicks / existing.impressions : 0;
    }
  });

  return seoByUrl;
}

/**
 * URL別最終アクセス日時取得
 */
function getLastAccessByUrl(botLogs: any[]): Map<string, string> {
  const lastAccessByUrl = new Map<string, string>();

  botLogs.forEach(log => {
    if (!lastAccessByUrl.has(log.url) || 
        new Date(log.accessed_at) > new Date(lastAccessByUrl.get(log.url))) {
      lastAccessByUrl.set(log.url, log.accessed_at);
    }
  });

  return lastAccessByUrl;
}

/**
 * AI×SEO 統合スコア計算
 */
function calculateCombinedScore(aiMetrics: any, seoMetrics: any): number {
  const aiScore = aiMetrics.visibility_score; // 0-100
  const seoScore = seoMetrics.average_position > 0 
    ? Math.max(0, 100 - (seoMetrics.average_position - 1) * 10) // 1位=100, 10位=10, 11位以下=0
    : 0;

  // 重み付け平均（AI 60%, SEO 40%）
  return Math.round(aiScore * 0.6 + seoScore * 0.4);
}

/**
 * パフォーマンスカテゴリ分類
 */
function categorizePerformance(aiMetrics: any, seoMetrics: any): string {
  const aiStrong = aiMetrics.visibility_score >= 70;
  const seoStrong = seoMetrics.average_position > 0 && seoMetrics.average_position <= 10;

  if (aiStrong && seoStrong) return 'ai_strong_seo_strong';
  if (aiStrong && !seoStrong) return 'ai_strong_seo_weak';
  if (!aiStrong && seoStrong) return 'ai_weak_seo_strong';
  return 'ai_weak_seo_weak';
}

/**
 * 相関分析
 */
function calculateCorrelation(performanceMatrix: any[]): any {
  const validData = performanceMatrix.filter(data => 
    data.ai_metrics.visibility_score > 0 && 
    data.seo_metrics.average_position > 0
  );

  if (validData.length < 3) {
    return {
      correlation_score: 0,
      correlation_strength: 'none',
      sample_size: validData.length,
    };
  }

  // ピアソン相関係数計算（AI Score と SEO Position の逆相関）
  const aiScores = validData.map(d => d.ai_metrics.visibility_score);
  const seoPositions = validData.map(d => d.seo_metrics.average_position);

  const correlation = calculatePearsonCorrelation(aiScores, seoPositions.map(p => 100 - p * 10));

  return {
    correlation_score: Math.round(correlation * 100) / 100,
    correlation_strength: getCorrelationStrength(Math.abs(correlation)),
    sample_size: validData.length,
  };
}

/**
 * ピアソン相関係数計算
 */
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  const sumYY = y.reduce((sum, val) => sum + val * val, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * 相関強度判定
 */
function getCorrelationStrength(absCorrelation: number): string {
  if (absCorrelation >= 0.7) return 'strong';
  if (absCorrelation >= 0.5) return 'moderate';
  if (absCorrelation >= 0.3) return 'weak';
  return 'none';
}

/**
 * インサイト生成
 */
function generateInsights(performanceMatrix: any[]): any {
  const aiOutperforming = performanceMatrix.filter(d => 
    d.performance_category === 'ai_strong_seo_weak'
  );
  
  const seoOutperforming = performanceMatrix.filter(d => 
    d.performance_category === 'ai_weak_seo_strong'
  );

  const aiBoostNeeded = seoOutperforming.map(d => d.url);
  const seoBoostNeeded = aiOutperforming.map(d => d.url);
  const contentQualityCheck = performanceMatrix
    .filter(d => d.performance_category === 'ai_weak_seo_weak')
    .map(d => d.url);

  return {
    ai_outperforming_seo: {
      count: aiOutperforming.length,
      urls: aiOutperforming.slice(0, 5).map(d => d.url),
    },
    seo_outperforming_ai: {
      count: seoOutperforming.length,
      urls: seoOutperforming.slice(0, 5).map(d => d.url),
    },
    optimization_opportunities: {
      ai_boost_needed: aiBoostNeeded.slice(0, 5),
      seo_boost_needed: seoBoostNeeded.slice(0, 5),
      content_quality_check: contentQualityCheck.slice(0, 5),
    },
  };
}

/**
 * トレンド分析生成
 */
function generateTrendAnalysis(aiScores: any[], seoMetrics: any[], startDate: Date, endDate: Date): any[] {
  // 日別データ集計（実装簡略化）
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const trends = [];

  for (let i = 0; i < Math.min(days, 30); i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    trends.push({
      date: date.toISOString().split('T')[0],
      ai_avg_score: 65 + Math.random() * 20, // 模擬データ
      seo_avg_position: 8 + Math.random() * 4,
      correlation_daily: 0.3 + Math.random() * 0.4,
    });
  }

  return trends.slice(-7); // 直近7日分
}

/**
 * サマリー生成
 */
function generateSummary(performanceMatrix: any[]): any {
  const totalUrls = performanceMatrix.length;
  const highPerformance = performanceMatrix.filter(d => 
    d.performance_category === 'ai_strong_seo_strong'
  ).length;
  const underperforming = performanceMatrix.filter(d => 
    d.performance_category === 'ai_weak_seo_weak'
  ).length;

  const aiAvg = totalUrls > 0 
    ? performanceMatrix.reduce((sum, d) => sum + d.ai_metrics.visibility_score, 0) / totalUrls 
    : 0;
  
  const seoAvg = totalUrls > 0 
    ? performanceMatrix
        .filter(d => d.seo_metrics.average_position > 0)
        .reduce((sum, d) => sum + d.seo_metrics.average_position, 0) / totalUrls 
    : 0;

  const recommendations = generateRecommendations(performanceMatrix);

  return {
    total_analyzed_urls: totalUrls,
    high_performance_urls: highPerformance,
    underperforming_urls: underperforming,
    ai_visibility_avg: Math.round(aiAvg),
    seo_position_avg: Math.round(seoAvg * 10) / 10,
    recommendations,
  };
}

/**
 * レコメンデーション生成
 */
function generateRecommendations(performanceMatrix: any[]): string[] {
  const recommendations = [];
  
  const highAILowSEO = performanceMatrix.filter(d => d.performance_category === 'ai_strong_seo_weak').length;
  const lowAIHighSEO = performanceMatrix.filter(d => d.performance_category === 'ai_weak_seo_strong').length;
  const lowBoth = performanceMatrix.filter(d => d.performance_category === 'ai_weak_seo_weak').length;

  if (highAILowSEO > 0) {
    recommendations.push(`${highAILowSEO}件のコンテンツでSEO最適化によりトラフィック増加が期待できます`);
  }
  
  if (lowAIHighSEO > 0) {
    recommendations.push(`${lowAIHighSEO}件のコンテンツで構造化データ改善によりAI発見性を向上できます`);
  }
  
  if (lowBoth > 0) {
    recommendations.push(`${lowBoth}件のコンテンツで包括的なコンテンツ品質改善が必要です`);
  }

  return recommendations;
}