/**
 * job_runs_v2 統一操作ヘルパー (Next.js用)
 * EPIC 3-6: ジョブ/バッチの観測性
 * 
 * Edge Functions版と仕様統一:
 * - UNIQUE(job_name, idempotency_key) 制御
 * - 軽量トランザクション
 * - service_role経由のみ書き込み
 */

import { createClient } from '@supabase/supabase-js';

/**
 * 型定義（Edge Functions版と統一）
 */
export type JobStatus = 
  | 'pending' 
  | 'running' 
  | 'succeeded' 
  | 'failed' 
  | 'cancelled' 
  | 'timeout' 
  | 'skipped';

export type JobScope = 'webhook' | 'internal' | 'edge' | 'batch' | 'cron';
export type JobRunner = 'supabase_scheduler' | 'external_cron' | 'edge_function';

export interface RetryPolicy {
  max_retries: number;
  backoff: 'exponential' | 'fixed';
  base_ms: number;
  max_ms?: number;
}

export interface JobStats {
  items_processed?: number;
  rows_affected?: number;
  tokens_used?: number;
  shards?: number;
}

export interface JobMeta {
  scope?: JobScope;
  runner?: JobRunner;
  retry_policy?: RetryPolicy;
  stats?: JobStats;
  input_summary?: Record<string, unknown>;
  output_summary?: Record<string, unknown>;
  env?: {
    region?: string;
    version?: string;
    git_commit_hash?: string;
  };
  error_details?: {
    message_full?: string;
    stack?: string;
    cause?: string;
    context?: Record<string, unknown>;
  };
  shard?: string | number;
  trigger_id?: string;
  max_duration_ms?: number;
  timeout_at?: string;
  cancel_requested?: boolean;
  // Addendum Phase 3 拡張フィールド
  total_count?: number;
  diff_count?: number;
  is_full_rebuild?: boolean;
  target_period_start?: string;
  target_period_end?: string;
  target_org_id?: string;
}

export interface JobRunRecord {
  id: string;
  job_name: string;
  idempotency_key: string | null;
  request_id: string | null;
  status: JobStatus;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  retry_count: number;
  error_code: string | null;
  error_message: string | null;
  meta: JobMeta | null;
  created_at: string;
  updated_at: string;
}

export interface BeginRunRequest {
  job_name: string;
  idempotency_key?: string;
  request: Request;
  meta?: JobMeta;
}

export interface BeginRunResult {
  success: boolean;
  record: JobRunRecord;
  is_duplicate: boolean;
  error?: string;
}

export interface CompleteJobRequest {
  job_id: string;
  meta?: JobMeta;
  error_code?: string;
  error_message?: string;
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
 * request_id 取得または生成
 */
function getOrGenerateRequestId(request: Request): string {
  const headers = request.headers;
  const existingId = headers.get('x-request-id') || headers.get('request-id');
  return existingId || crypto.randomUUID();
}

/**
 * error_message を2KB制限でtruncateし、詳細をmeta.error_detailsに保存
 */
function processErrorMessage(
  errorMessage: string | undefined, 
  currentMeta: JobMeta | null = null
): { truncated_message: string | null; updated_meta: JobMeta } {
  const updatedMeta = { ...currentMeta } as JobMeta;
  
  if (!errorMessage) {
    return { truncated_message: null, updated_meta: updatedMeta };
  }
  
  const maxLength = 2048;
  const truncatedMessage = errorMessage.length > maxLength 
    ? errorMessage.slice(0, maxLength) 
    : errorMessage;
  
  if (errorMessage.length > maxLength) {
    updatedMeta.error_details = {
      ...updatedMeta.error_details,
      message_full: errorMessage
    };
  }
  
  return { truncated_message: truncatedMessage, updated_meta: updatedMeta };
}

/**
 * PII除去・メタデータ匿名化
 */
function sanitizeJobMeta(meta: JobMeta | undefined): JobMeta | null {
  if (!meta) return null;
  
  const sanitized: JobMeta = {};
  
  // 安全なフィールドのみコピー（Edge Functions版と統一）
  if (meta.scope) sanitized.scope = meta.scope;
  if (meta.runner) sanitized.runner = meta.runner;
  if (meta.retry_policy) sanitized.retry_policy = meta.retry_policy;
  if (meta.stats) sanitized.stats = meta.stats;
  if (meta.shard) sanitized.shard = meta.shard;
  if (meta.trigger_id) sanitized.trigger_id = meta.trigger_id;
  if (meta.max_duration_ms) sanitized.max_duration_ms = meta.max_duration_ms;
  if (meta.timeout_at) sanitized.timeout_at = meta.timeout_at;
  if (meta.cancel_requested !== undefined) sanitized.cancel_requested = meta.cancel_requested;
  
  if (meta.input_summary) {
    sanitized.input_summary = {};
    const allowedInputKeys = ['resource', 'filters', 'batch_size', 'query_type'];
    for (const key of allowedInputKeys) {
      if (key in meta.input_summary) {
        sanitized.input_summary[key] = meta.input_summary[key];
      }
    }
  }
  
  if (meta.output_summary) {
    sanitized.output_summary = {};
    const allowedOutputKeys = ['artifact_url', 'records_written', 'result_type'];
    for (const key of allowedOutputKeys) {
      if (key in meta.output_summary) {
        sanitized.output_summary[key] = meta.output_summary[key];
      }
    }
  }
  
  if (meta.env) {
    sanitized.env = {
      region: meta.env.region,
      version: meta.env.version,
      git_commit_hash: meta.env.git_commit_hash
    };
  }
  
  if (meta.error_details) {
    sanitized.error_details = {
      message_full: meta.error_details.message_full?.slice(0, 5000),
      cause: meta.error_details.cause?.slice(0, 1000),
      context: meta.error_details.context ? 
        (() => {
          try {
            const truncated = JSON.stringify(meta.error_details.context).slice(0, 2000);
            return JSON.parse(truncated);
          } catch {
            return { truncated: true };
          }
        })() : undefined
    };
  }
  
  return sanitized;
}

/**
 * ジョブ開始（軽量トランザクション化）
 */
export async function beginRun(request: BeginRunRequest): Promise<BeginRunResult> {
  const supabase = createServiceRoleClient();
  const request_id = getOrGenerateRequestId(request.request);
  
  try {
    const record = {
      job_name: request.job_name,
      idempotency_key: request.idempotency_key || null,
      request_id,
      status: 'running' as JobStatus,
      started_at: new Date().toISOString(),
      retry_count: 0,
      meta: sanitizeJobMeta(request.meta)
    };
    
    try {
      const { data, error } = await supabase
        .from('job_runs_v2')
        .insert(record)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('Job run started', {
        job_id: data.id,
        job_name: request.job_name,
        idempotency_key: request.idempotency_key
      });
      
      return {
        success: true,
        record: data as JobRunRecord,
        is_duplicate: false
      };
      
    } catch (insertError: any) {
      // UNIQUE制約違反時の処理
      if (insertError.code === '23505' && request.idempotency_key) {
        console.log('Job idempotency key collision, fetching existing', {
          job_name: request.job_name,
          idempotency_key: request.idempotency_key
        });
        
        const { data: existing, error: selectError } = await supabase
          .from('job_runs_v2')
          .select()
          .eq('job_name', request.job_name)
          .eq('idempotency_key', request.idempotency_key)
          .single();
        
        if (selectError || !existing) {
          throw new Error(`Failed to fetch existing job record: ${selectError?.message}`);
        }
        
        const existingRecord = existing as JobRunRecord;
        
        if (existingRecord.status === 'running' || existingRecord.status === 'pending') {
          console.warn('Duplicate job execution prevented', {
            job_id: existingRecord.id,
            existing_status: existingRecord.status
          });
          
          return {
            success: true,
            record: existingRecord,
            is_duplicate: true
          };
        } else {
          console.warn('Job with same idempotency_key exists in final state', {
            job_id: existingRecord.id,
            existing_status: existingRecord.status
          });
          
          return {
            success: false,
            record: existingRecord,
            is_duplicate: true,
            error: `Job already exists in ${existingRecord.status} state`
          };
        }
      }
      
      throw insertError;
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to begin job run', {
      error: errorMsg,
      job_name: request.job_name
    });
    
    return {
      success: false,
      record: {} as JobRunRecord,
      is_duplicate: false,
      error: errorMsg
    };
  }
}

/**
 * ジョブ成功完了
 */
export async function completeSuccess(request: CompleteJobRequest): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();
  
  try {
    const finishedAt = new Date().toISOString();
    const sanitizedMeta = sanitizeJobMeta(request.meta);
    
    const { data, error } = await supabase
      .from('job_runs_v2')
      .update({
        status: 'succeeded',
        finished_at: finishedAt,
        meta: sanitizedMeta,
        updated_at: finishedAt
      })
      .eq('id', request.job_id)
      .eq('status', 'running')
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error('No running job found to complete');
    }
    
    console.log('Job completed successfully', {
      job_id: request.job_id,
      job_name: data.job_name,
      duration_ms: data.duration_ms
    });
    
    return { success: true };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to complete job success', {
      error: errorMsg,
      job_id: request.job_id
    });
    
    return { success: false, error: errorMsg };
  }
}

/**
 * ジョブ失敗完了
 */
export async function completeFailure(request: CompleteJobRequest): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();
  
  try {
    const finishedAt = new Date().toISOString();
    
    const { truncated_message, updated_meta } = processErrorMessage(
      request.error_message,
      request.meta
    );
    
    const sanitizedMeta = sanitizeJobMeta(updated_meta);
    
    const { data, error } = await supabase
      .from('job_runs_v2')
      .update({
        status: 'failed',
        finished_at: finishedAt,
        error_code: request.error_code || null,
        error_message: truncated_message,
        // Note: raw SQL increment - requires custom supabase extension or RPC
        retry_count: (supabase as unknown as { raw: (sql: string) => unknown }).raw('retry_count + 1'),
        meta: sanitizedMeta,
        updated_at: finishedAt
      })
      .eq('id', request.job_id)
      .eq('status', 'running')
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error('No running job found to complete');
    }
    
    console.warn('Job completed with failure', {
      job_id: request.job_id,
      job_name: data.job_name,
      error_code: request.error_code,
      retry_count: data.retry_count
    });
    
    return { success: true };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to complete job failure', {
      error: errorMsg,
      job_id: request.job_id
    });
    
    return { success: false, error: errorMsg };
  }
}

/**
 * idempotency_key によるジョブレコード取得または作成
 */
export async function getOrCreateByIdemKey(
  jobName: string,
  idempotencyKey: string,
  request: Request,
  meta?: JobMeta
): Promise<BeginRunResult> {
  return beginRun({
    job_name: jobName,
    idempotency_key: idempotencyKey,
    request,
    meta
  });
}

/**
 * ジョブの強制キャンセル（協調的停止要求）
 */
export async function requestCancel(jobId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();
  
  try {
    const { data, error } = await supabase
      .from('job_runs_v2')
      .update({
        // Note: raw JSONB operation - requires custom supabase extension or RPC
        meta: (supabase as unknown as { raw: (sql: string) => unknown }).raw("jsonb_set(meta, '{cancel_requested}', 'true')"),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .eq('status', 'running')
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return { success: false, error: 'No running job found to cancel' };
    }
    
    console.log('Job cancel requested', {
      job_id: jobId,
      job_name: data.job_name
    });
    
    return { success: true };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to request job cancel', {
      error: errorMsg,
      job_id: jobId
    });
    
    return { success: false, error: errorMsg };
  }
}

/**
 * 実行中ジョブの同時実行数チェック
 */
export async function checkConcurrentRunning(
  jobName: string,
  maxConcurrent: number = 5
): Promise<{ can_run: boolean; current_running: number }> {
  const supabase = createServiceRoleClient();
  
  try {
    const { count, error } = await supabase
      .from('job_runs_v2')
      .select('*', { count: 'exact', head: true })
      .eq('job_name', jobName)
      .eq('status', 'running')
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    if (error) {
      console.error('Failed to check concurrent running jobs', { error: error.message });
      return { can_run: true, current_running: 0 };
    }
    
    const currentRunning = count || 0;
    const canRun = currentRunning < maxConcurrent;
    
    console.debug('Concurrent running jobs check', {
      job_name: jobName,
      current_running: currentRunning,
      max_concurrent: maxConcurrent,
      can_run: canRun
    });
    
    return { can_run: canRun, current_running: currentRunning };
    
  } catch (error) {
    console.error('Exception checking concurrent running jobs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      job_name: jobName
    });
    
    return { can_run: true, current_running: 0 };
  }
}