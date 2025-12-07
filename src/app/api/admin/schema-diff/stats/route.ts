/**
 * Schema Diff Stats API
 * EPIC 3-7: 統合観測性ダッシュボード用 - スキーマ変更統計
 * 
 * GET /api/admin/schema-diff/stats
 * - 過去24時間のスキーマ変更統計
 * - 重大度別カウント、監視環境数、ジョブ実行状況等
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface SchemaDiffStats {
  total_diffs_24h: number;
  error_count_24h: number;
  warn_count_24h: number;
  info_count_24h: number;
  environments_monitored: number;
  last_successful_run: string | null;
  last_failed_run: string | null;
  avg_changes_per_diff: number;
  top_affected_schemas: Array<{ schema: string; count: number }>;
}

export async function GET(request: NextRequest) {
  try {
    // ============================================
    // 1. 認証確認
    // ============================================
    
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

    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // ============================================
    // 2. 基本統計の取得
    // ============================================
    
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // スキーマDiff履歴から統計取得
    const { data: schemaDiffs, error: diffError } = await supabase
      .from('schema_diff_history')
      .select('environment, severity, summary, diff_at')
      .gte('diff_at', since24h)
      .order('diff_at', { ascending: false });

    if (diffError) {
      console.error('Failed to fetch schema diffs for stats:', diffError);
      return NextResponse.json(
        { error: 'Failed to fetch schema diff statistics' },
        { status: 500 }
      );
    }

    // ============================================
    // 3. ジョブ実行状況の取得
    // ============================================
    
    const { data: jobRuns, error: jobError } = await supabase
      .from('job_runs_v2')
      .select('status, started_at, finished_at, retry_count')
      .eq('job_name', 'nightly-schema-diff')
      .gte('started_at', since7d)
      .order('started_at', { ascending: false });

    if (jobError) {
      console.error('Failed to fetch job runs for stats:', jobError);
      // ジョブ情報は必須ではないので継続
    }

    // ============================================
    // 4. 統計計算
    // ============================================
    
    const diffs = schemaDiffs || [];
    
    // 重大度別カウント
    const severityCounts = diffs.reduce((acc, diff) => {
      acc[diff.severity] = (acc[diff.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 監視環境数
    const environments = new Set(diffs.map(d => d.environment));

    // 変更数の平均
    const totalChanges = diffs.reduce((sum, diff) => {
      return sum + (diff.summary?.total_changes || 0);
    }, 0);
    const avgChangesPerDiff = diffs.length > 0 ? Math.round(totalChanges / diffs.length) : 0;

    // 影響スキーマの集計
    const schemaCountMap = new Map<string, number>();
    diffs.forEach(diff => {
      const affectedSchemas = diff.summary?.schemas_affected || [];
      affectedSchemas.forEach((schema: string) => {
        schemaCountMap.set(schema, (schemaCountMap.get(schema) || 0) + 1);
      });
    });

    const topAffectedSchemas = Array.from(schemaCountMap.entries())
      .map(([schema, count]) => ({ schema, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ジョブ実行状況
    const successfulJobs = (jobRuns || []).filter(job => job.status === 'succeeded');
    const failedJobs = (jobRuns || []).filter(job => job.status === 'failed');

    const lastSuccessfulRun = successfulJobs.length > 0 
      ? successfulJobs[0].finished_at || successfulJobs[0].started_at
      : null;

    const lastFailedRun = failedJobs.length > 0
      ? failedJobs[0].finished_at || failedJobs[0].started_at
      : null;

    // ============================================
    // 5. 統計オブジェクト構築
    // ============================================
    
    const stats: SchemaDiffStats = {
      total_diffs_24h: diffs.length,
      error_count_24h: severityCounts['error'] || 0,
      warn_count_24h: severityCounts['warn'] || 0,
      info_count_24h: severityCounts['info'] || 0,
      environments_monitored: environments.size,
      last_successful_run: lastSuccessfulRun,
      last_failed_run: lastFailedRun,
      avg_changes_per_diff: avgChangesPerDiff,
      top_affected_schemas: topAffectedSchemas
    };

    // ============================================
    // 6. レスポンス
    // ============================================
    
    return NextResponse.json({
      success: true,
      stats: stats,
      metadata: {
        time_range: '24h',
        job_history_range: '7d',
        calculated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Schema diff stats API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        stats: {
          total_diffs_24h: 0,
          error_count_24h: 0,
          warn_count_24h: 0,
          info_count_24h: 0,
          environments_monitored: 0,
          last_successful_run: null,
          last_failed_run: null,
          avg_changes_per_diff: 0,
          top_affected_schemas: []
        }
      },
      { status: 500 }
    );
  }
}