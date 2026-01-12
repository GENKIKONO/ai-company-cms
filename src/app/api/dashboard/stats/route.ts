// ダッシュボード用統計データAPI
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { hasEntitlement } from '@/lib/feature-flags/gate';
import { logger } from '@/lib/log';

interface TableCount {
  count: number | null;
  missing: boolean;
}

interface StatsResponse {
  ok: boolean;
  orgId?: string;
  counts: {
    services: TableCount;
    case_studies: TableCount;
    posts: TableCount;
    faqs: TableCount;
    contacts: TableCount;
  };
  analytics: {
    pageViews: number;
    avgDurationSec: number;
    conversionRate: number;
  };
  missingTables: string[];
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // ユーザー認証とorg取得（Core経由）
    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json({
        error: 'Unauthorized - Authentication required'
      }, { status: 401 });
    }

    // 組織情報取得（organization_members経由）
    const { data: membershipData, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      logger.error('Error fetching organization membership:', { data: membershipError });
      return NextResponse.json({
        error: 'Failed to fetch organization membership'
      }, { status: 500 });
    }

    if (!membershipData) {
      return NextResponse.json({
        error: 'Organization membership not found for user'
      }, { status: 403 });
    }

    const orgId = membershipData.organization_id;
    const counts: StatsResponse['counts'] = {
      services: { count: null, missing: false },
      case_studies: { count: null, missing: false },
      posts: { count: null, missing: false },
      faqs: { count: null, missing: false },
      contacts: { count: null, missing: false }
    };
    
    const missingTables: string[] = [];

    // 各テーブルの件数を取得
    const tables = ['services', 'case_studies', 'posts', 'faqs', 'contacts'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId);
        
        if (error) {
          // Postgres error 42P01 = relation does not exist
          if (error.code === '42P01') {
            logger.debug(`Table ${table} does not exist, marking as missing`);
            counts[table as keyof typeof counts] = { count: null, missing: true };
            missingTables.push(table);
          } else {
            logger.error(`Dashboard stats error for ${table}:`, {
              orgId,
              table,
              error: error.message,
              code: error.code
            });
            throw error;
          }
        } else {
          logger.debug(`Dashboard stats for ${table}: ${count} items`);
          counts[table as keyof typeof counts] = { count: count || 0, missing: false };
        }
      } catch (err) {
        logger.error(`Unexpected error checking table ${table}:`, {
          orgId,
          table,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
        counts[table as keyof typeof counts] = { count: null, missing: true };
        missingTables.push(table);
      }
    }

    // 解析データ（Feature Gate適用）
    let analytics = {
      pageViews: 0,
      avgDurationSec: 0,
      conversionRate: 0
    };

    // [VERIFY][Gate][API] Feature gate check for monitoring
    const hasMonitoringAccess = await hasEntitlement(orgId, 'monitoring');
    
    if (!hasMonitoringAccess) {
      logger.debug(`[Gate][API] monitoring disabled for org:${orgId}`);
      analytics = {
        pageViews: 0,
        avgDurationSec: 0,
        conversionRate: 0
      };
    } else {
      // analytics/page_views テーブルがあれば取得を試行
      try {
        const { data: analyticsData } = await supabase
          .from('analytics')
          .select('page_views, avg_duration, conversion_rate')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (analyticsData) {
          analytics.pageViews = Number(analyticsData.page_views) || 0;
          analytics.avgDurationSec = Number(analyticsData.avg_duration) || 0;
          analytics.conversionRate = Number(analyticsData.conversion_rate) || 0;
        }
      } catch (analyticsError) {
        // 解析テーブルが存在しない場合も正常として扱う
        logger.debug('Analytics table not found or no data, using defaults');
      }
    }

    const response: StatsResponse = {
      ok: true,
      orgId,
      counts,
      analytics,
      missingTables
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    logger.error('Dashboard stats error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      counts: {
        services: { count: null, missing: true },
        case_studies: { count: null, missing: true },
        posts: { count: null, missing: true },
        faqs: { count: null, missing: true },
        contacts: { count: null, missing: true }
      },
      analytics: {
        pageViews: 0,
        avgDurationSec: 0,
        conversionRate: 0
      },
      missingTables: ['services', 'case_studies', 'posts', 'faqs', 'contacts']
    }, { status: 200 });
  }
}