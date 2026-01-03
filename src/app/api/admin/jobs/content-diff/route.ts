import { NextRequest, NextResponse } from 'next/server';
import { runContentDiffJob, type ContentDiffJobInput } from '@/lib/jobs/content-diff-job';
import { requireSuperAdminUser } from '@/lib/auth/server';
import type { Database } from '@/types/supabase';
import { logger } from '@/lib/utils/logger';

/** job_runs_v2 の取得列（列明示パターン） */
type JobRunV2Row = Database['public']['Tables']['job_runs_v2']['Row'];
type JobRunV2Status = Pick<JobRunV2Row,
  | 'id'
  | 'job_name'
  | 'status'
  | 'started_at'
  | 'finished_at'
  | 'duration_ms'
  | 'error_message'
  | 'meta'
>;

/**
 * Content Diff Job API
 * Phase 3 Addendum: public_* テーブルの差分更新API
 */
export async function POST(request: NextRequest) {
  try {
    // Super Admin認証
    const user = await requireSuperAdminUser();
    
    const body = await request.json();
    
    // リクエスト検証
    if (!body.target_table || !Array.isArray(body.source_data)) {
      return NextResponse.json(
        { error: 'target_table and source_data are required' },
        { status: 400 }
      );
    }
    
    const validTargets = [
      'organizations',
      'services',
      'posts', 
      'news',
      'faqs',
      'case_studies',
      'products',
      'organization_keywords',
      'ai_content_units'
    ];
    
    if (!validTargets.includes(body.target_table)) {
      return NextResponse.json(
        { error: `Invalid target_table. Must be one of: ${validTargets.join(', ')}` },
        { status: 400 }
      );
    }
    
    // ジョブ入力準備
    const jobInput: ContentDiffJobInput = {
      target_table: body.target_table,
      source_data: body.source_data,
      organization_id: body.organization_id,
      request_id: body.request_id || crypto.randomUUID()
    };
    
    // バリデーション
    if (jobInput.source_data.length === 0) {
      return NextResponse.json(
        { error: 'source_data cannot be empty' },
        { status: 400 }
      );
    }
    
    if (jobInput.source_data.length > 10000) {
      return NextResponse.json(
        { error: 'source_data too large (max 10,000 records)' },
        { status: 400 }
      );
    }
    
    // 必須フィールドチェック
    const missingIds = jobInput.source_data.filter(row => !row.id);
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: 'All source_data records must have an id field' },
        { status: 400 }
      );
    }
    
    // ジョブ実行
    const result = await runContentDiffJob(jobInput, request);
    
    const httpStatus = result.success ? 200 : 500;
    
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Content diff job completed for ${result.target_table}`
        : `Content diff job failed for ${result.target_table}`,
      data: {
        target_table: result.target_table,
        total_count: result.total_count,
        diff_count: result.diff_count,
        is_full_rebuild: result.is_full_rebuild,
        threshold_percent: result.threshold_percent,
        duration_ms: result.duration_ms,
        job_id: result.job_id,
        diff_rate_percent: result.total_count > 0 
          ? ((result.diff_count / result.total_count) * 100).toFixed(2)
          : '0.00'
      },
      error: result.error,
      timestamp: new Date().toISOString()
    }, { status: httpStatus });
    
  } catch (error) {
    logger.error('Content diff API error:', { data: error });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * ジョブステータス取得API
 */
export async function GET(request: NextRequest) {
  try {
    // Super Admin認証
    const user = await requireSuperAdminUser();
    
    const url = new URL(request.url);
    const jobId = url.searchParams.get('job_id');
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'job_id parameter is required' },
        { status: 400 }
      );
    }
    
    // job_runs_v2からジョブ情報取得
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // 列明示でクエリ（select * を排除）
    const { data: jobRecord, error } = await supabase
      .from('job_runs_v2')
      .select('id, job_name, status, started_at, finished_at, duration_ms, error_message, meta')
      .eq('id', jobId)
      .single<JobRunV2Status>();
    
    if (error || !jobRecord) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: jobRecord.id,
        job_name: jobRecord.job_name,
        status: jobRecord.status,
        started_at: jobRecord.started_at,
        finished_at: jobRecord.finished_at,
        duration_ms: jobRecord.duration_ms,
        error_message: jobRecord.error_message,
        meta: jobRecord.meta
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Job status API error:', { data: error });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}