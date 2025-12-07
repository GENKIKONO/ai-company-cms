/**
 * AI Citations Aggregation Job Implementation  
 * Phase 3 Addendum: ai_quotes_* 集計ジョブ
 */

import { createClient } from '@supabase/supabase-js';
import { beginRun, completeSuccess, completeFailure, type JobMeta } from '@/lib/job-runs';

export interface AiCitationsAggregationJobInput {
  target_period_start?: string; // ISO string
  target_period_end?: string;   // ISO string
  organization_id?: string;     // null for global aggregation
  refresh_mv?: boolean;         // MATERIALIZED VIEW をリフレッシュするか
  request_id?: string;
}

export interface AiCitationsAggregationJobResult {
  success: boolean;
  target_period_start?: string;
  target_period_end?: string;
  organization_id?: string;
  records_processed: number;
  mv_refreshed: boolean;
  duration_ms: number;
  error?: string;
  job_id?: string;
}

/**
 * service_role クライアント作成
 */
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * MATERIALIZED VIEW のリフレッシュ
 */
async function refreshMaterializedView(
  supabase: ReturnType<typeof createServiceRoleClient>,
  mvName: string
): Promise<{ records_processed: number }> {
  try {
    // Supabase側で用意されるMV用のRPC関数を呼び出し
    const { data, error } = await supabase.rpc('refresh_ai_quotes_summary_mv', {
      mv_name: mvName
    });
    
    if (error) {
      throw new Error(`MV refresh failed: ${error.message}`);
    }
    
    return {
      records_processed: data?.records_processed || 0
    };
    
  } catch (error) {
    throw new Error(`Failed to refresh MV ${mvName}: ${error}`);
  }
}

/**
 * 集計データの生成（MV以外の方式の場合）
 */
async function generateAggregationData(
  supabase: ReturnType<typeof createServiceRoleClient>,
  input: AiCitationsAggregationJobInput
): Promise<{ records_processed: number }> {
  try {
    // ai_quotes_responses と ai_quotes_items から集計を生成
    let query = supabase
      .from('ai_quotes_responses')
      .select(`
        id,
        organization_id,
        created_at,
        ai_quotes_items (
          id,
          source_type,
          citation_count
        )
      `);
    
    // 期間フィルタ
    if (input.target_period_start) {
      query = query.gte('created_at', input.target_period_start);
    }
    if (input.target_period_end) {
      query = query.lte('created_at', input.target_period_end);
    }
    
    // 組織フィルタ
    if (input.organization_id) {
      query = query.eq('organization_id', input.organization_id);
    }
    
    const { data: responses, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch ai_quotes_responses: ${error.message}`);
    }
    
    // 集計処理（実際にはSupabase側のRPC関数を使用すべき）
    const { error: aggregationError } = await supabase.rpc('generate_ai_quotes_aggregation', {
      target_period_start: input.target_period_start,
      target_period_end: input.target_period_end,
      organization_id: input.organization_id,
      source_data: responses
    });
    
    if (aggregationError) {
      throw new Error(`Aggregation generation failed: ${aggregationError.message}`);
    }
    
    return {
      records_processed: responses?.length || 0
    };
    
  } catch (error) {
    throw new Error(`Failed to generate aggregation data: ${error}`);
  }
}

/**
 * AI引用集計ジョブの実行
 */
export async function runAiCitationsAggregationJob(
  input: AiCitationsAggregationJobInput,
  request: Request
): Promise<AiCitationsAggregationJobResult> {
  const startTime = Date.now();
  
  // デフォルト期間設定（過去7日間）
  const now = new Date();
  const defaultStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const targetPeriodStart = input.target_period_start || defaultStart.toISOString();
  const targetPeriodEnd = input.target_period_end || now.toISOString();
  
  // ジョブ開始
  const jobResult = await beginRun({
    job_name: `ai_citations_aggregation`,
    idempotency_key: input.request_id,
    request,
    meta: {
      scope: 'batch',
      runner: 'edge_function',
      target_period_start: targetPeriodStart,
      target_period_end: targetPeriodEnd,
      target_org_id: input.organization_id,
      input_summary: {
        refresh_mv: input.refresh_mv,
        period_days: Math.ceil(
          (new Date(targetPeriodEnd).getTime() - new Date(targetPeriodStart).getTime()) 
          / (24 * 60 * 60 * 1000)
        )
      }
    }
  });
  
  if (!jobResult.success) {
    return {
      success: false,
      records_processed: 0,
      mv_refreshed: false,
      duration_ms: Date.now() - startTime,
      error: jobResult.error || 'Failed to start job'
    };
  }
  
  if (jobResult.is_duplicate) {
    return {
      success: true,
      target_period_start: targetPeriodStart,
      target_period_end: targetPeriodEnd,
      organization_id: input.organization_id,
      records_processed: 0,
      mv_refreshed: false,
      duration_ms: Date.now() - startTime,
      job_id: jobResult.record.id,
      error: 'Duplicate job detected'
    };
  }
  
  const jobId = jobResult.record.id;
  
  try {
    const supabase = createServiceRoleClient();
    let recordsProcessed = 0;
    let mvRefreshed = false;
    
    if (input.refresh_mv) {
      // MATERIALIZED VIEW のリフレッシュ
      const mvResult = await refreshMaterializedView(
        supabase, 
        'ai_quotes_summary_mv' // Supabase側で確定される名前
      );
      recordsProcessed = mvResult.records_processed;
      mvRefreshed = true;
    } else {
      // 通常の集計処理
      const aggregationResult = await generateAggregationData(supabase, input);
      recordsProcessed = aggregationResult.records_processed;
      mvRefreshed = false;
    }
    
    // ジョブ完了
    const duration = Date.now() - startTime;
    const completeMeta: JobMeta = {
      scope: 'batch',
      runner: 'edge_function',
      target_period_start: targetPeriodStart,
      target_period_end: targetPeriodEnd,
      target_org_id: input.organization_id,
      stats: {
        rows_affected: recordsProcessed
      },
      output_summary: {
        mv_refreshed: mvRefreshed,
        records_processed: recordsProcessed,
        period_duration_hours: Math.ceil(
          (new Date(targetPeriodEnd).getTime() - new Date(targetPeriodStart).getTime()) 
          / (60 * 60 * 1000)
        )
      }
    };
    
    await completeSuccess({ job_id: jobId, meta: completeMeta });
    
    return {
      success: true,
      target_period_start: targetPeriodStart,
      target_period_end: targetPeriodEnd,
      organization_id: input.organization_id,
      records_processed: recordsProcessed,
      mv_refreshed: mvRefreshed,
      duration_ms: duration,
      job_id: jobId
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;
    
    await completeFailure({
      job_id: jobId,
      error_code: 'AI_CITATIONS_AGGREGATION_ERROR',
      error_message: errorMessage
    });
    
    return {
      success: false,
      target_period_start: targetPeriodStart,
      target_period_end: targetPeriodEnd,
      organization_id: input.organization_id,
      records_processed: 0,
      mv_refreshed: false,
      duration_ms: duration,
      error: errorMessage,
      job_id: jobId
    };
  }
}

/**
 * 週次集計の実行（cron用）
 */
export async function runWeeklyAiCitationsAggregation(
  request: Request,
  organizationId?: string
): Promise<AiCitationsAggregationJobResult> {
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  
  return runAiCitationsAggregationJob({
    target_period_start: weekStart.toISOString(),
    target_period_end: weekEnd.toISOString(),
    organization_id: organizationId,
    refresh_mv: true,
    request_id: `weekly_${weekStart.toISOString().slice(0, 10)}_${organizationId || 'global'}`
  }, request);
}

/**
 * Supabase側RPC関数の確認が必要な項目：
 * 
 * 1. refresh_ai_quotes_summary_mv(mv_name) - MATERIALIZED VIEWリフレッシュ用RPC
 * 2. generate_ai_quotes_aggregation(target_period_start, target_period_end, organization_id, source_data) - 集計生成RPC
 * 3. ai_quotes_summary_mv - MATERIALIZED VIEWの正確な名前
 * 
 * これらの実際のRPC関数名とMV名をSupabaseアシスタントに確認してください。
 */