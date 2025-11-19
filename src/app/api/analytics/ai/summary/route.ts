/**
 * AI Bot Access Summary API
 * AI Botアクセスの統計情報を提供
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createAuthError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

// Type definitions
interface AISummaryResponse {
  period: {
    start_date: string;
    end_date: string;
  };
  metrics: {
    total_bot_hits: number;
    unique_urls_accessed: number;
    bot_breakdown: {
      bot_name: string;
      hit_count: number;
      percentage: number;
    }[];
    top_accessed_content: {
      url: string;
      title: string | null;
      hit_count: number;
      bot_diversity: number; // 何種類のbotに読まれたか
    }[];
  };
}

// GET - AI Bot アクセス統計サマリ
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 管理者認証チェック（テスト用に一時無効化）
    // TODO: 本格運用時は有効化

    // クエリパラメータ解析
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id') || searchParams.get('org_id');
    const daysBack = parseInt(searchParams.get('days') || '30');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysBack);

    // ベースフィルター条件
    const baseFilter = {
      accessed_at: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      },
      ...(orgId && { organization_id: orgId }),
    };

    // 1. 総ヒット数
    let totalHitsQuery = supabase
      .from('ai_bot_logs')
      .select('url', { count: 'exact' })
      .gte('accessed_at', startDate.toISOString())
      .lte('accessed_at', endDate.toISOString());
    
    if (orgId) {
      totalHitsQuery = totalHitsQuery.eq('organization_id', orgId);
    }

    const { data: totalHits, error: totalError, count: totalCount } = await totalHitsQuery;

    if (totalError) {
      throw totalError;
    }

    // 2. ユニークURL数
    let uniqueUrlsQuery = supabase
      .from('ai_bot_logs')
      .select('url')
      .gte('accessed_at', startDate.toISOString())
      .lte('accessed_at', endDate.toISOString());
    
    if (orgId) {
      uniqueUrlsQuery = uniqueUrlsQuery.eq('organization_id', orgId);
    }

    const { data: uniqueUrls, error: uniqueError } = await uniqueUrlsQuery;

    if (uniqueError) {
      throw uniqueError;
    }

    // 3. Bot別集計
    let botBreakdownQuery = supabase
      .from('ai_bot_logs')
      .select('bot_name')
      .gte('accessed_at', startDate.toISOString())
      .lte('accessed_at', endDate.toISOString());
    
    if (orgId) {
      botBreakdownQuery = botBreakdownQuery.eq('organization_id', orgId);
    }

    const { data: botBreakdown, error: botError } = await botBreakdownQuery;

    if (botError) {
      throw botError;
    }

    // 4. トップアクセスコンテンツ（content_units結合）
    let topContentQuery = supabase
      .from('ai_bot_logs')
      .select(`
        url,
        bot_name,
        ai_content_units (
          title,
          content_type
        )
      `)
      .gte('accessed_at', startDate.toISOString())
      .lte('accessed_at', endDate.toISOString())
      .order('accessed_at', { ascending: false });
    
    if (orgId) {
      topContentQuery = topContentQuery.eq('organization_id', orgId);
    }

    const { data: topContent, error: contentError } = await topContentQuery;

    if (contentError) {
      throw contentError;
    }

    // データ集計処理
    const totalBotHits = totalCount || 0;
    const uniqueUrlsSet = new Set((uniqueUrls || []).map(item => item.url));
    const uniqueUrlsCount = uniqueUrlsSet.size;

    // Bot別集計
    const botCounts = (botBreakdown || []).reduce((acc, log) => {
      acc[log.bot_name] = (acc[log.bot_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const botBreakdownResult = Object.entries(botCounts)
      .map(([botName, count]) => ({
        bot_name: botName,
        hit_count: count,
        percentage: totalBotHits > 0 ? (count / totalBotHits) * 100 : 0,
      }))
      .sort((a, b) => b.hit_count - a.hit_count);

    // URL別集計（Bot多様性計算含む）
    const urlStats = (topContent || []).reduce((acc, log) => {
      if (!acc[log.url]) {
        acc[log.url] = {
          url: log.url,
          title: (log.ai_content_units && Array.isArray(log.ai_content_units) && log.ai_content_units.length > 0) ? log.ai_content_units[0].title : null,
          hit_count: 0,
          bots: new Set<string>(),
        };
      }
      acc[log.url].hit_count++;
      acc[log.url].bots.add(log.bot_name);
      return acc;
    }, {} as Record<string, any>);

    const topAccessedContent = Object.values(urlStats)
      .map((stat: any) => ({
        url: stat.url,
        title: stat.title,
        hit_count: stat.hit_count,
        bot_diversity: stat.bots.size,
      }))
      .sort((a, b) => b.hit_count - a.hit_count)
      .slice(0, 10); // Top 10

    const response: AISummaryResponse = {
      period: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      },
      metrics: {
        total_bot_hits: totalBotHits,
        unique_urls_accessed: uniqueUrlsCount,
        bot_breakdown: botBreakdownResult,
        top_accessed_content: topAccessedContent,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    const errorId = generateErrorId('get-ai-bot-summary');
    logger.error('[GET /api/analytics/ai/summary] Unexpected error:', { data: { errorId, error } });
    return createInternalError(errorId);
  }
}