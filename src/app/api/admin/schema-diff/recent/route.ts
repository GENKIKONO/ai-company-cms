/**
 * Schema Diff Recent API
 * EPIC 3-7: 統合観測性ダッシュボード用 - 最新スキーマ変更取得
 * 
 * GET /api/admin/schema-diff/recent
 * - 過去24時間のスキーマDiff履歴取得
 * - job_runs_v2との連携でジョブ実行状況も含める
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';

interface SchemaDiffSummary {
  id: string;
  environment: string;
  diff_at: string;
  severity: 'info' | 'warn' | 'error';
  total_changes: number;
  schemas_affected: string[];
  last_job_status: 'success' | 'failed' | 'running' | null;
  last_job_at: string | null;
}

export async function GET(request: NextRequest) {
  try {
    // ============================================
    // 1. 認証確認（Core経由）
    // ============================================

    const supabase = await createClient();

    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // ============================================
    // 2. 最新スキーマDiff履歴取得
    // ============================================
    
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: schemaDiffs, error: diffError } = await supabase
      .from('v_schema_diff_recent')
      .select('*')
      .gte('diff_at', since24h)
      .order('diff_at', { ascending: false })
      .limit(20);

    if (diffError) {
      console.error('Failed to fetch schema diffs:', diffError);
      return NextResponse.json(
        { error: 'Failed to fetch schema diff history' },
        { status: 500 }
      );
    }

    // ============================================
    // 3. ジョブ実行状況の取得
    // ============================================
    
    const { data: jobRuns, error: jobError } = await supabase
      .from('job_runs_v2')
      .select('job_name, status, started_at, finished_at, meta')
      .eq('job_name', 'nightly-schema-diff')
      .gte('started_at', since24h)
      .order('started_at', { ascending: false })
      .limit(50);

    if (jobError) {
      console.error('Failed to fetch job runs:', jobError);
      // ジョブ情報取得失敗は警告レベルとし、継続
    }

    // ============================================
    // 4. データ結合・整形
    // ============================================
    
    const diffs: SchemaDiffSummary[] = (schemaDiffs || []).map(diff => {
      // 対応するジョブ実行を探す
      const relatedJob = (jobRuns || []).find(job => {
        const jobMeta = job.meta as any;
        const diffAt = new Date(diff.diff_at);
        const jobAt = new Date(job.started_at);
        
        // 同じ環境かつ時間が近い（30分以内）ジョブを関連とみなす
        return jobMeta?.environment === diff.environment && 
               Math.abs(diffAt.getTime() - jobAt.getTime()) < 30 * 60 * 1000;
      });

      let jobStatus: 'success' | 'failed' | 'running' | null = null;
      let jobAt: string | null = null;

      if (relatedJob) {
        jobAt = relatedJob.finished_at || relatedJob.started_at;
        switch (relatedJob.status) {
          case 'succeeded':
            jobStatus = 'success';
            break;
          case 'failed':
            jobStatus = 'failed';
            break;
          case 'running':
            jobStatus = 'running';
            break;
          default:
            jobStatus = null;
        }
      }

      return {
        id: diff.id,
        environment: diff.environment,
        diff_at: diff.diff_at,
        severity: diff.severity,
        total_changes: diff.summary?.total_changes || 0,
        schemas_affected: diff.summary?.schemas_affected || [],
        last_job_status: jobStatus,
        last_job_at: jobAt,
      };
    });

    // ============================================
    // 5. レスポンス
    // ============================================
    
    return NextResponse.json({
      success: true,
      diffs: diffs,
      metadata: {
        total_count: diffs.length,
        time_range: '24h',
        fetched_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Schema diff recent API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        diffs: []
      },
      { status: 500 }
    );
  }
}