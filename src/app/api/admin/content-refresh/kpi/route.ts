/**
 * P4-8: Content Refresh KPI API
 * GET /api/admin/content-refresh/kpi - KPIメトリクス一括取得
 * 
 * admin-rpc.tsのgetAllKpiMetrics()をAPI route化
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// admin-rpc.tsから移行した型定義
interface RlsDeniesTop5Item {
  table_name: string;
  endpoint: string;
  deny_count: number;
  last_denied_at: string;
}

interface EdgeFailureStatsItem {
  job_name: string;
  total_runs: number;
  failed_runs: number;
  failure_rate: number;
  last_run_at: string;
}

interface PublicTablesFreshnessItem {
  table_name: string;
  latest_updated_at: string;
  staleness_seconds: number;
  staleness_display: string;
}

interface LegacyViewsOverdueItem {
  view_name: string;
  remove_after: string;
  days_overdue: number;
  description: string;
}

interface SchemaDiffCandidateItem {
  object_type: string;
  object_name: string;
  schema_name: string;
  created_at: string;
  is_ignored: boolean;
}

interface RPCError {
  message: string;
  code?: string;
  details?: any;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Super Admin権限チェック
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: user } = await supabase.auth.getUser();
    const userRole = user.user?.user_metadata?.role || 
                     user.user?.app_metadata?.role;
    
    if (userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin privileges required' },
        { status: 403 }
      );
    }

    // admin-rpc.tsと同じく並列でKPIデータを取得
    const [rlsResult, edgeResult, publicResult, legacyResult, schemaResult] = await Promise.allSettled([
      supabase.rpc('admin_get_rls_denies_top5'),
      supabase.rpc('admin_get_edge_failure_stats'),
      supabase.rpc('admin_get_public_tables_freshness'),
      supabase.rpc('admin_check_legacy_views_overdue'),
      supabase.rpc('admin_get_schema_diff_candidates')
    ]);

    const errors: RPCError[] = [];
    
    const rlsDenies = rlsResult.status === 'fulfilled' && !rlsResult.value.error 
      ? rlsResult.value.data || []
      : [];
    
    const edgeFailures = edgeResult.status === 'fulfilled' && !edgeResult.value.error
      ? edgeResult.value.data || []
      : [];
      
    const publicFreshness = publicResult.status === 'fulfilled' && !publicResult.value.error
      ? publicResult.value.data || []
      : [];

    const legacyViews = legacyResult.status === 'fulfilled' && !legacyResult.value.error
      ? legacyResult.value.data || []
      : [];

    const schemaDiffCandidates = schemaResult.status === 'fulfilled' && !schemaResult.value.error
      ? schemaResult.value.data || []
      : [];

    // エラー収集
    if (rlsResult.status === 'fulfilled' && rlsResult.value.error) {
      errors.push({
        message: rlsResult.value.error.message,
        code: rlsResult.value.error.code,
        details: rlsResult.value.error.details
      });
    }
    if (edgeResult.status === 'fulfilled' && edgeResult.value.error) {
      errors.push({
        message: edgeResult.value.error.message,
        code: edgeResult.value.error.code,
        details: edgeResult.value.error.details
      });
    }
    if (publicResult.status === 'fulfilled' && publicResult.value.error) {
      errors.push({
        message: publicResult.value.error.message,
        code: publicResult.value.error.code,
        details: publicResult.value.error.details
      });
    }
    if (legacyResult.status === 'fulfilled' && legacyResult.value.error) {
      errors.push({
        message: legacyResult.value.error.message,
        code: legacyResult.value.error.code,
        details: legacyResult.value.error.details
      });
    }
    if (schemaResult.status === 'fulfilled' && schemaResult.value.error) {
      errors.push({
        message: schemaResult.value.error.message,
        code: schemaResult.value.error.code,
        details: schemaResult.value.error.details
      });
    }

    return NextResponse.json({
      rlsDenies,
      edgeFailures,
      publicFreshness,
      legacyViews,
      schemaDiffCandidates,
      errors
    });

  } catch (error) {
    console.error('Content refresh KPI API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch KPI metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}