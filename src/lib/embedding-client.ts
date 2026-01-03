/**
 * Embedding Pipeline Client
 * P4-4: Supabase Edge Functions連携（embedding-runner）
 */

import 'server-only';
import { logger } from '@/lib/utils/logger';

export interface EmbeddingJobRequest {
  organization_id: string;
  source_table: string;
  source_id: string;
  source_field: string;
  content_text: string;
  priority?: number; // 1-10, higher = more priority
}

export interface EmbeddingJob {
  id: string;
  organization_id: string;
  source_table: string;
  source_id: string;
  source_field: string;
  content_hash: string;
  content_text: string;
  chunk_count: number;
  chunk_strategy: string;
  embedding_model: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  batch_id?: string;
  priority: number;
  idempotency_key: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Embedding {
  id: string;
  organization_id: string;
  source_table: string;
  source_id: string;
  source_field: string;
  chunk_index: number;
  chunk_text: string;
  content_hash: string;
  embedding_model: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmbeddingJobFilter {
  organization_id?: string;
  source_table?: string;
  source_field?: string;
  status?: EmbeddingJob['status'];
  priority_min?: number;
  priority_max?: number;
  created_after?: string;
  created_before?: string;
  limit?: number;
  offset?: number;
}

export interface EmbeddingMetrics {
  total_jobs: number;
  pending_jobs: number;
  processing_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  avg_processing_time_minutes?: number;
  success_rate_percent: number;
  total_embeddings: number;
  total_chunks: number;
  jobs_by_table: Record<string, number>;
  embeddings_by_model: Record<string, number>;
}

/**
 * Embedding ジョブをキューに投入
 * Supabase Edge Function: /embedding-runner/enqueue
 */
export async function enqueueEmbeddingJob(
  job: EmbeddingJobRequest
): Promise<{ success: boolean; job_id?: string; message: string; skipped?: boolean }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/embedding-runner/enqueue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(job)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Embedding job enqueue failed: ${result.message || response.statusText}`);
    }

    return {
      success: true,
      job_id: result.job_id,
      message: result.message || 'Embedding job enqueued successfully',
      skipped: result.skipped || false
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Embedding Client] Enqueue failed:', { data: error });

    return {
      success: false,
      message: `Embedding job enqueue failed: ${errorMsg}`
    };
  }
}

/**
 * Embedding ジョブのバッチ処理実行
 * Supabase Edge Function: /embedding-runner/drain
 */
export async function drainEmbeddingJobs(): Promise<{
  success: boolean;
  processed_count: number;
  message: string;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/embedding-runner/drain`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Embedding job drain failed: ${result.message || response.statusText}`);
    }

    return {
      success: true,
      processed_count: result.processed_count || 0,
      message: result.message || 'Embedding jobs processed successfully'
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Embedding Client] Drain failed:', { data: error });

    return {
      success: false,
      processed_count: 0,
      message: `Embedding job drain failed: ${errorMsg}`
    };
  }
}

/**
 * Embedding ジョブ一覧取得（フィルタ付き）
 */
export async function getEmbeddingJobs(
  filter: EmbeddingJobFilter = {}
): Promise<{ data: EmbeddingJob[]; total: number; error?: string }> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    let query = supabase
      .from('embedding_jobs')
      .select('id, organization_id, source_table, source_id, source_field, content_hash, content_text, chunk_count, chunk_strategy, embedding_model, status, batch_id, priority, idempotency_key, error_message, retry_count, max_retries, scheduled_at, started_at, completed_at, created_at, updated_at', { count: 'exact' })
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true });

    // フィルタ適用
    if (filter.organization_id) query = query.eq('organization_id', filter.organization_id);
    if (filter.source_table) query = query.eq('source_table', filter.source_table);
    if (filter.source_field) query = query.eq('source_field', filter.source_field);
    if (filter.status) query = query.eq('status', filter.status);
    if (filter.priority_min !== undefined) query = query.gte('priority', filter.priority_min);
    if (filter.priority_max !== undefined) query = query.lte('priority', filter.priority_max);
    if (filter.created_after) query = query.gte('created_at', filter.created_after);
    if (filter.created_before) query = query.lte('created_at', filter.created_before);
    
    if (filter.limit) query = query.limit(filter.limit);
    if (filter.offset) query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data || [],
      total: count || 0
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Embedding Client] Get jobs failed:', { data: error });

    return {
      data: [],
      total: 0,
      error: errorMsg
    };
  }
}

/**
 * Embedding 状況取得
 */
export async function getEmbeddings(
  filter: { 
    organization_id?: string; 
    source_table?: string; 
    source_id?: string;
    is_active?: boolean;
    limit?: number; 
    offset?: number; 
  } = {}
): Promise<{ data: Embedding[]; total: number; error?: string }> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    let query = supabase
      .from('embeddings')
      .select('id,organization_id,source_table,source_id,source_field,chunk_index,chunk_text,content_hash,embedding_model,is_active,created_at,updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false });

    // フィルタ適用
    if (filter.organization_id) query = query.eq('organization_id', filter.organization_id);
    if (filter.source_table) query = query.eq('source_table', filter.source_table);
    if (filter.source_id) query = query.eq('source_id', filter.source_id);
    if (filter.is_active !== undefined) query = query.eq('is_active', filter.is_active);
    
    if (filter.limit) query = query.limit(filter.limit);
    if (filter.offset) query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data || [],
      total: count || 0
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Embedding Client] Get embeddings failed:', { data: error });

    return {
      data: [],
      total: 0,
      error: errorMsg
    };
  }
}

/**
 * Embedding メトリクス取得
 */
export async function getEmbeddingMetrics(
  organizationId?: string
): Promise<{ data: EmbeddingMetrics | null; error?: string }> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // ジョブ統計
    let jobQuery = supabase.from('embedding_jobs').select('id, organization_id, source_table, source_id, status, started_at, completed_at, created_at');
    if (organizationId) jobQuery = jobQuery.eq('organization_id', organizationId);

    // Embedding統計
    let embeddingQuery = supabase.from('embeddings').select('id, organization_id, embedding_model, is_active');
    if (organizationId) embeddingQuery = embeddingQuery.eq('organization_id', organizationId);

    const [jobsResult, embeddingsResult] = await Promise.all([
      jobQuery,
      embeddingQuery
    ]);

    if (jobsResult.error) throw jobsResult.error;
    if (embeddingsResult.error) throw embeddingsResult.error;

    const jobs = jobsResult.data || [];
    const embeddings = embeddingsResult.data || [];

    // メトリクス計算
    const completed = jobs.filter(j => j.status === 'completed');
    const processing_times = completed
      .filter(j => j.started_at && j.completed_at)
      .map(j => {
        const start = new Date(j.started_at!).getTime();
        const end = new Date(j.completed_at!).getTime();
        return (end - start) / (1000 * 60); // minutes
      });

    const metrics: EmbeddingMetrics = {
      total_jobs: jobs.length,
      pending_jobs: jobs.filter(j => j.status === 'pending').length,
      processing_jobs: jobs.filter(j => j.status === 'processing').length,
      completed_jobs: completed.length,
      failed_jobs: jobs.filter(j => j.status === 'failed' || j.status === 'cancelled').length,
      avg_processing_time_minutes: processing_times.length > 0 
        ? processing_times.reduce((a, b) => a + b, 0) / processing_times.length 
        : undefined,
      success_rate_percent: jobs.length > 0 
        ? Math.round((completed.length / jobs.length) * 100) 
        : 0,
      total_embeddings: embeddings.filter(e => e.is_active).length,
      total_chunks: embeddings.filter(e => e.is_active).length,
      jobs_by_table: jobs.reduce((acc, job) => {
        acc[job.source_table] = (acc[job.source_table] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      embeddings_by_model: embeddings
        .filter(e => e.is_active)
        .reduce((acc, emb) => {
          acc[emb.embedding_model] = (acc[emb.embedding_model] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    };

    return { data: metrics };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Embedding Client] Get metrics failed:', { data: error });

    return {
      data: null,
      error: errorMsg
    };
  }
}

/**
 * 組織のコンテンツ一括Embedding投入
 */
export async function enqueueOrganizationEmbeddings(
  organizationId: string,
  contentTypes: string[] = ['posts', 'services', 'faqs', 'case_studies', 'products'],
  priority: number = 5
): Promise<{ success: boolean; enqueued_count: number; skipped_count: number; message: string }> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    let enqueuedCount = 0;
    let skippedCount = 0;
    const jobs: EmbeddingJobRequest[] = [];

    // 各テーブルからコンテンツを取得してEmbeddingジョブを生成
    for (const table of contentTypes) {
      const { data: contents } = await supabase
        .from(table)
        .select('id, title, description, content, summary')
        .eq('organization_id', organizationId);

      if (!contents) continue;

      for (const content of contents) {
        // 処理対象フィールドを決定（テーブルによって異なる）
        const fields = [];
        if (content.title) fields.push({ field: 'title', text: content.title });
        if (content.description) fields.push({ field: 'description', text: content.description });
        if (content.content) fields.push({ field: 'content', text: content.content });
        if (content.summary) fields.push({ field: 'summary', text: content.summary });

        for (const { field, text } of fields) {
          jobs.push({
            organization_id: organizationId,
            source_table: table,
            source_id: content.id,
            source_field: field,
            content_text: text,
            priority
          });
        }
      }
    }

    // バッチでジョブ投入
    for (const job of jobs) {
      const result = await enqueueEmbeddingJob(job);
      if (result.success) {
        if (result.skipped) {
          skippedCount++;
        } else {
          enqueuedCount++;
        }
      }
    }

    return {
      success: true,
      enqueued_count: enqueuedCount,
      skipped_count: skippedCount,
      message: `${enqueuedCount} embedding jobs enqueued, ${skippedCount} skipped (already up to date) for organization ${organizationId}`
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Embedding Client] Bulk enqueue failed:', { data: error });

    return {
      success: false,
      enqueued_count: 0,
      skipped_count: 0,
      message: `Bulk embedding enqueue failed: ${errorMsg}`
    };
  }
}