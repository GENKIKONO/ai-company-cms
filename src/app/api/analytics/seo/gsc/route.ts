/**
 * Google Search Console Data Collection API
 * GSCからSEOメトリクスを取得・保存・分析
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createAuthError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';
import { createGSCClient, transformGSCMetrics } from '@/lib/gsc-client';

export const dynamic = 'force-dynamic';

// Request/Response types
interface GSCCollectionRequest {
  organization_id: string;
  site_url?: string; // 指定がない場合は組織のdefault URLを使用
  start_date?: string; // YYYY-MM-DD, default: 30日前
  end_date?: string; // YYYY-MM-DD, default: 昨日
  include_queries?: boolean; // default: true
  force_refresh?: boolean; // 既存データを上書き
}

interface GSCResponse {
  success: boolean;
  collection_id: string;
  metrics: {
    total_impressions: number;
    total_clicks: number;
    average_ctr: number;
    average_position: number;
  };
  top_queries: {
    query: string;
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
  }[];
  top_pages: {
    url: string;
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
  }[];
  data_period: {
    start_date: string;
    end_date: string;
  };
  stored_records: number;
}

// GET - GSC データ取得・分析
export async function GET(request: NextRequest) {
  const collectionId = generateErrorId('gsc-collection');

  try {
    const supabase = await supabaseServer();
    
    // Business以上プラン制限チェック（テスト用に一時無効化）
    // TODO: 本格運用時は有効化
    // const { data: authData, error: authError } = await supabase.auth.getUser();
    // if (authError || !authData.user) {
    //   return createAuthError();
    // }

    // クエリパラメータ解析
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id') || searchParams.get('org_id');
    const siteUrl = searchParams.get('site_url');
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    const includeQueries = searchParams.get('include_queries') !== 'false';
    const forceRefresh = searchParams.get('force_refresh') === 'true';

    if (!orgId) {
      return NextResponse.json(
        { error: 'Validation error', message: 'organization_id is required' },
        { status: 400 }
      );
    }

    // 日付範囲設定
    const endDate = endDateParam || getYesterday();
    const startDate = startDateParam || getDaysAgo(30);

    // 組織情報とサイトURL取得
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('website_url, slug')
      .eq('id', orgId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const targetSiteUrl = siteUrl || organization.website_url;
    if (!targetSiteUrl) {
      return NextResponse.json(
        { error: 'Site URL not configured for organization' },
        { status: 400 }
      );
    }

    logger.info('GSC data collection started', {
      collectionId,
      orgId,
      siteUrl: targetSiteUrl,
      startDate,
      endDate,
      includeQueries,
    });

    // 既存データ確認
    if (!forceRefresh) {
      const { data: existingData, count } = await supabase
        .from('seo_search_console_metrics')
        .select('*', { count: 'exact' })
        .eq('organization_id', orgId)
        .gte('date_recorded', startDate)
        .lte('date_recorded', endDate);

      if (count && count > 0) {
        logger.info('Returning cached GSC data', { data: { collectionId, cachedRecords: count } });
        return await buildResponseFromCache(supabase, orgId, startDate, endDate, collectionId);
      }
    }

    // GSC API クライアント初期化
    const gscClient = createGSCClient(targetSiteUrl);

    // GSC データ取得
    const [topQueries, topPages] = await Promise.all([
      includeQueries ? gscClient.getTopQueries(startDate, endDate, 100) : [],
      gscClient.getTopPages(startDate, endDate, 100),
    ]);

    // データベース保存
    let storedRecords = 0;

    // クエリデータ保存
    if (includeQueries && topQueries.length > 0) {
      const queryMetrics = transformGSCMetrics(topQueries, orgId, startDate);
      const { data: insertedQueries, error: queryError } = await supabase
        .from('seo_search_console_metrics')
        .upsert(queryMetrics, {
          onConflict: 'organization_id,url,search_query,date_recorded'
        });

      if (queryError) {
        logger.error('Failed to save query metrics', { data: { collectionId, error: queryError } });
      } else {
        storedRecords += queryMetrics.length;
      }
    }

    // ページデータ保存
    if (topPages.length > 0) {
      const pageMetrics = transformGSCMetrics(topPages, orgId, startDate);
      const { data: insertedPages, error: pageError } = await supabase
        .from('seo_search_console_metrics')
        .upsert(pageMetrics, {
          onConflict: 'organization_id,url,search_query,date_recorded'
        });

      if (pageError) {
        logger.error('Failed to save page metrics', { data: { collectionId, error: pageError } });
      } else {
        storedRecords += pageMetrics.length;
      }
    }

    // audit log 記録
    const auditLogData = {
      action: 'collect_gsc_data',
      target_type: 'seo_search_console_metrics',
      user_id: 'test-user', // authData.user.id,
      metadata: {
        collection_id: collectionId,
        organization_id: orgId,
        site_url: targetSiteUrl,
        start_date: startDate,
        end_date: endDate,
        stored_records: storedRecords,
        timestamp: new Date().toISOString(),
      },
    };

    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert([auditLogData]);

    if (auditError) {
      logger.warn('Failed to create audit log for GSC collection', { 
        collectionId, 
        error: auditError 
      });
    }

    // レスポンス生成
    const response = await buildGSCResponse(
      topQueries, 
      topPages, 
      startDate, 
      endDate, 
      storedRecords, 
      collectionId
    );

    logger.info('GSC data collection completed', {
      collectionId,
      storedRecords,
      totalImpressions: response.metrics.total_impressions,
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('[GET /api/analytics/seo/gsc] Unexpected error:', { 
      collectionId, 
      error 
    });
    return createInternalError(collectionId);
  }
}

// POST - GSC データ手動収集トリガー
export async function POST(request: NextRequest) {
  const collectionId = generateErrorId('gsc-manual-collection');

  try {
    const body: GSCCollectionRequest = await request.json();
    
    // Manual collection の場合は force_refresh = true で GET を実行
    const url = new URL(request.url);
    url.searchParams.set('organization_id', body.organization_id);
    url.searchParams.set('force_refresh', 'true');
    if (body.site_url) url.searchParams.set('site_url', body.site_url);
    if (body.start_date) url.searchParams.set('start_date', body.start_date);
    if (body.end_date) url.searchParams.set('end_date', body.end_date);
    if (body.include_queries !== undefined) {
      url.searchParams.set('include_queries', body.include_queries.toString());
    }

    // GET メソッドを内部的に呼び出し
    const getRequest = new NextRequest(url, { method: 'GET' });
    return await GET(getRequest);

  } catch (error) {
    logger.error('[POST /api/analytics/seo/gsc] Unexpected error:', { 
      collectionId, 
      error 
    });
    return createInternalError(collectionId);
  }
}

/**
 * キャッシュされたデータからレスポンスを構築
 */
async function buildResponseFromCache(
  supabase: any,
  orgId: string,
  startDate: string,
  endDate: string,
  collectionId: string
): Promise<NextResponse> {
  const { data: cachedData, error } = await supabase
    .from('seo_search_console_metrics')
    .select('*')
    .eq('organization_id', orgId)
    .gte('date_recorded', startDate)
    .lte('date_recorded', endDate)
    .order('impressions', { ascending: false });

  if (error) {
    throw error;
  }

  // キャッシュデータを GSC 形式に変換
  const queries = cachedData
    .filter((row: any) => row.search_query)
    .slice(0, 100);
  
  const pages = cachedData
    .filter((row: any) => !row.search_query)
    .slice(0, 100);

  const response = await buildGSCResponse(
    queries.map((row: any) => ({
      keys: [row.search_query, row.url],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.average_position,
    })),
    pages.map((row: any) => ({
      keys: [row.url],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.average_position,
    })),
    startDate,
    endDate,
    cachedData.length,
    collectionId
  );

  return NextResponse.json(response);
}

/**
 * GSCレスポンス構築
 */
async function buildGSCResponse(
  queries: any[],
  pages: any[],
  startDate: string,
  endDate: string,
  storedRecords: number,
  collectionId: string
): Promise<GSCResponse> {
  const allMetrics = [...queries, ...pages];
  
  const totalImpressions = allMetrics.reduce((sum, metric) => sum + metric.impressions, 0);
  const totalClicks = allMetrics.reduce((sum, metric) => sum + metric.clicks, 0);
  const averageCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const averagePosition = allMetrics.length > 0 
    ? allMetrics.reduce((sum, metric) => sum + metric.position, 0) / allMetrics.length 
    : 0;

  return {
    success: true,
    collection_id: collectionId,
    metrics: {
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      average_ctr: averageCtr,
      average_position: averagePosition,
    },
    top_queries: queries.slice(0, 10).map(metric => ({
      query: metric.keys?.[0] || '',
      impressions: metric.impressions,
      clicks: metric.clicks,
      ctr: metric.ctr,
      position: metric.position,
    })),
    top_pages: pages.slice(0, 10).map(metric => ({
      url: metric.keys?.[0] || '',
      impressions: metric.impressions,
      clicks: metric.clicks,
      ctr: metric.ctr,
      position: metric.position,
    })),
    data_period: {
      start_date: startDate,
      end_date: endDate,
    },
    stored_records: storedRecords,
  };
}

/**
 * ユーティリティ関数
 */
function getYesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}