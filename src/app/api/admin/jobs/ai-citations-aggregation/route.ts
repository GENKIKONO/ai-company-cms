import { NextRequest, NextResponse } from 'next/server';
import {
  runAiCitationsAggregationJob,
  runWeeklyAiCitationsAggregation,
  type AiCitationsAggregationJobInput
} from '@/lib/jobs/ai-citations-aggregation-job';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { logger } from '@/lib/utils/logger';
import { handleApiError, validationError } from '@/lib/api/error-responses';

/**
 * AI Citations Aggregation Job API
 * Phase 3 Addendum: ai_quotes_* 集計ジョブAPI
 */
export async function POST(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const body = await request.json();

    // ジョブタイプ判定
    const jobType = body.job_type || 'custom';

    if (jobType === 'weekly') {
      // 週次集計の実行
      const result = await runWeeklyAiCitationsAggregation(
        request,
        body.organization_id
      );

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? 'Weekly AI citations aggregation completed'
          : 'Weekly AI citations aggregation failed',
        data: {
          job_type: 'weekly',
          target_period_start: result.target_period_start,
          target_period_end: result.target_period_end,
          organization_id: result.organization_id,
          records_processed: result.records_processed,
          mv_refreshed: result.mv_refreshed,
          duration_ms: result.duration_ms,
          job_id: result.job_id
        },
        error: result.error,
        timestamp: new Date().toISOString()
      }, {
        status: result.success ? 200 : 500
      });
    }

    // カスタム期間集計
    const jobInput: AiCitationsAggregationJobInput = {
      target_period_start: body.target_period_start,
      target_period_end: body.target_period_end,
      organization_id: body.organization_id,
      refresh_mv: body.refresh_mv || false,
      request_id: body.request_id || crypto.randomUUID()
    };

    // 期間バリデーション
    if (jobInput.target_period_start && jobInput.target_period_end) {
      const startDate = new Date(jobInput.target_period_start);
      const endDate = new Date(jobInput.target_period_end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return validationError([
          { field: 'target_period', message: 'Invalid date format for target_period_start or target_period_end' }
        ]);
      }

      if (startDate >= endDate) {
        return validationError([
          { field: 'target_period', message: 'target_period_start must be before target_period_end' }
        ]);
      }

      // 期間制限（最大90日）
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
      if (daysDiff > 90) {
        return validationError([
          { field: 'target_period', message: 'Period cannot exceed 90 days' }
        ]);
      }
    }

    // ジョブ実行
    const result = await runAiCitationsAggregationJob(jobInput, request);

    const httpStatus = result.success ? 200 : 500;

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? 'AI citations aggregation job completed'
        : 'AI citations aggregation job failed',
      data: {
        job_type: 'custom',
        target_period_start: result.target_period_start,
        target_period_end: result.target_period_end,
        organization_id: result.organization_id,
        records_processed: result.records_processed,
        mv_refreshed: result.mv_refreshed,
        duration_ms: result.duration_ms,
        job_id: result.job_id
      },
      error: result.error,
      timestamp: new Date().toISOString()
    }, { status: httpStatus });

  } catch (error) {
    logger.error('AI Citations Aggregation API error:', { data: error });
    return handleApiError(error);
  }
}

/**
 * 組織別集計状況の取得API
 */
export async function GET(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organization_id');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    
    // job_runs_v2から関連ジョブの実行履歴取得
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    const query = supabase
      .from('job_runs_v2')
      .select('id, job_name, status, started_at, finished_at, duration_ms, meta, error_message, created_at')
      .eq('job_name', 'ai_citations_aggregation')
      .order('created_at', { ascending: false })
      .limit(50);
    
    const { data: jobHistory, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch job history: ${error.message}`);
    }
    
    // 組織別フィルタリング（Meta内のtarget_org_idで）
    let filteredHistory = jobHistory || [];
    
    if (organizationId) {
      filteredHistory = filteredHistory.filter(job => 
        job.meta?.target_org_id === organizationId
      );
    }
    
    // 期間フィルタリング
    if (startDate) {
      filteredHistory = filteredHistory.filter(job => 
        job.created_at >= startDate
      );
    }
    
    if (endDate) {
      filteredHistory = filteredHistory.filter(job => 
        job.created_at <= endDate
      );
    }
    
    // 集計サマリーの計算
    const summary = {
      total_jobs: filteredHistory.length,
      successful_jobs: filteredHistory.filter(job => job.status === 'succeeded').length,
      failed_jobs: filteredHistory.filter(job => job.status === 'failed').length,
      running_jobs: filteredHistory.filter(job => job.status === 'running').length,
      total_records_processed: filteredHistory
        .filter(job => job.status === 'succeeded')
        .reduce((sum, job) => sum + (job.meta?.stats?.rows_affected || 0), 0),
      avg_duration_ms: filteredHistory
        .filter(job => job.duration_ms)
        .reduce((sum, job, _, arr) => 
          sum + (job.duration_ms || 0) / arr.length, 0
        ) || 0
    };
    
    return NextResponse.json({
      success: true,
      data: {
        summary,
        recent_jobs: filteredHistory.slice(0, 10).map(job => ({
          id: job.id,
          status: job.status,
          started_at: job.started_at,
          finished_at: job.finished_at,
          duration_ms: job.duration_ms,
          target_org_id: job.meta?.target_org_id,
          target_period_start: job.meta?.target_period_start,
          target_period_end: job.meta?.target_period_end,
          records_processed: job.meta?.stats?.rows_affected,
          mv_refreshed: job.meta?.output_summary?.mv_refreshed,
          error_message: job.error_message
        }))
      },
      filters: {
        organization_id: organizationId,
        start_date: startDate,
        end_date: endDate
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('AI Citations Aggregation status API error:', { data: error });
    return handleApiError(error);
  }
}