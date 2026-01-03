/**
 * Translation Pipeline Client
 * P4-3: I18n翻訳パイプライン統合
 */

import 'server-only';
import { logger } from '@/lib/utils/logger';

export interface TranslationJobRequest {
  organization_id: string;
  source_table: string;
  source_id: string;
  source_field: string;
  source_lang: string;
  target_lang: string;
  source_text: string;
  priority?: number; // 1-10, higher = more priority
}

export interface TranslationJob {
  id: string;
  organization_id: string;
  source_table: string;
  source_id: string;
  source_field: string;
  source_lang: string;
  target_lang: string;
  source_text: string;
  translated_text?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  translation_service?: string;
  idempotency_key: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  priority: number;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TranslationJobFilter {
  organization_id?: string;
  source_table?: string;
  source_field?: string;
  source_lang?: string;
  target_lang?: string;
  status?: TranslationJob['status'];
  priority_min?: number;
  priority_max?: number;
  created_after?: string;
  created_before?: string;
  limit?: number;
  offset?: number;
}

export interface TranslationMetrics {
  total_jobs: number;
  pending_jobs: number;
  in_progress_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  avg_processing_time_minutes?: number;
  success_rate_percent: number;
  jobs_by_language: Record<string, number>;
  jobs_by_table: Record<string, number>;
}

/**
 * 翻訳ジョブをキューに投入
 * Supabase Edge Function: /translate-runner/enqueue
 */
export async function enqueueTranslationJob(
  job: TranslationJobRequest
): Promise<{ success: boolean; job_id?: string; message: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/translation-runner/enqueue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(job)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Translation job enqueue failed: ${result.message || response.statusText}`);
    }

    return {
      success: true,
      job_id: result.job_id,
      message: result.message || 'Translation job enqueued successfully'
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Translation Client] Enqueue failed:', { data: error });

    return {
      success: false,
      message: `Translation job enqueue failed: ${errorMsg}`
    };
  }
}

/**
 * 翻訳ジョブのバッチ処理実行
 * Supabase Edge Function: /translate-runner/drain
 */
export async function drainTranslationJobs(): Promise<{
  success: boolean;
  processed_count: number;
  message: string;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/translation-runner/drain`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Translation job drain failed: ${result.message || response.statusText}`);
    }

    return {
      success: true,
      processed_count: result.processed_count || 0,
      message: result.message || 'Translation jobs processed successfully'
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Translation Client] Drain failed:', { data: error });

    return {
      success: false,
      processed_count: 0,
      message: `Translation job drain failed: ${errorMsg}`
    };
  }
}

/**
 * 翻訳ジョブ一覧取得（フィルタ付き）
 */
export async function getTranslationJobs(
  filter: TranslationJobFilter = {}
): Promise<{ data: TranslationJob[]; total: number; error?: string }> {
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
      .from('translation_jobs')
      .select('id, organization_id, source_table, source_id, source_field, source_lang, target_lang, source_text, translated_text, status, translation_service, idempotency_key, error_message, retry_count, max_retries, priority, scheduled_at, started_at, completed_at, created_at, updated_at', { count: 'exact' })
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true });

    // フィルタ適用
    if (filter.organization_id) query = query.eq('organization_id', filter.organization_id);
    if (filter.source_table) query = query.eq('source_table', filter.source_table);
    if (filter.source_field) query = query.eq('source_field', filter.source_field);
    if (filter.source_lang) query = query.eq('source_lang', filter.source_lang);
    if (filter.target_lang) query = query.eq('target_lang', filter.target_lang);
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
    logger.error('[Translation Client] Get jobs failed:', { data: error });

    return {
      data: [],
      total: 0,
      error: errorMsg
    };
  }
}

/**
 * 翻訳メトリクス取得
 */
export async function getTranslationMetrics(
  organizationId?: string
): Promise<{ data: TranslationMetrics | null; error?: string }> {
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

    let baseQuery = supabase.from('translation_jobs').select('id, organization_id, source_table, target_lang, status, started_at, completed_at');
    if (organizationId) {
      baseQuery = baseQuery.eq('organization_id', organizationId);
    }

    const { data: jobs, error } = await baseQuery;

    if (error) {
      throw error;
    }

    if (!jobs || jobs.length === 0) {
      return {
        data: {
          total_jobs: 0,
          pending_jobs: 0,
          in_progress_jobs: 0,
          completed_jobs: 0,
          failed_jobs: 0,
          success_rate_percent: 0,
          jobs_by_language: {},
          jobs_by_table: {}
        }
      };
    }

    // メトリクス計算
    const completed = jobs.filter(j => j.status === 'completed');
    const processing_times = completed
      .filter(j => j.started_at && j.completed_at)
      .map(j => {
        const start = new Date(j.started_at!).getTime();
        const end = new Date(j.completed_at!).getTime();
        return (end - start) / (1000 * 60); // minutes
      });

    const metrics: TranslationMetrics = {
      total_jobs: jobs.length,
      pending_jobs: jobs.filter(j => j.status === 'pending').length,
      in_progress_jobs: jobs.filter(j => j.status === 'in_progress').length,
      completed_jobs: completed.length,
      failed_jobs: jobs.filter(j => j.status === 'failed' || j.status === 'cancelled').length,
      avg_processing_time_minutes: processing_times.length > 0 
        ? processing_times.reduce((a, b) => a + b, 0) / processing_times.length 
        : undefined,
      success_rate_percent: jobs.length > 0 
        ? Math.round((completed.length / jobs.length) * 100) 
        : 0,
      jobs_by_language: jobs.reduce((acc, job) => {
        acc[job.target_lang] = (acc[job.target_lang] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      jobs_by_table: jobs.reduce((acc, job) => {
        acc[job.source_table] = (acc[job.source_table] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return { data: metrics };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Translation Client] Get metrics failed:', { data: error });

    return {
      data: null,
      error: errorMsg
    };
  }
}

/**
 * 組織のコンテンツ一括翻訳ジョブ投入
 */
export async function enqueueOrganizationTranslation(
  organizationId: string,
  targetLanguages: string[],
  contentTypes: string[] = ['posts', 'services', 'faqs', 'case_studies', 'products'],
  priority: number = 5
): Promise<{ success: boolean; enqueued_count: number; message: string }> {
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
    const jobs: TranslationJobRequest[] = [];

    // 各テーブルからコンテンツを取得して翻訳ジョブを生成
    for (const table of contentTypes) {
      const { data: contents } = await supabase
        .from(table)
        .select('id, title, description')
        .eq('organization_id', organizationId);

      if (!contents) continue;

      for (const content of contents) {
        for (const targetLang of targetLanguages) {
          // title翻訳
          if (content.title) {
            jobs.push({
              organization_id: organizationId,
              source_table: table,
              source_id: content.id,
              source_field: 'title',
              source_lang: 'ja', // デフォルト原文言語
              target_lang: targetLang,
              source_text: content.title,
              priority
            });
          }

          // description翻訳
          if (content.description) {
            jobs.push({
              organization_id: organizationId,
              source_table: table,
              source_id: content.id,
              source_field: 'description',
              source_lang: 'ja',
              target_lang: targetLang,
              source_text: content.description,
              priority
            });
          }
        }
      }
    }

    // バッチでジョブ投入
    for (const job of jobs) {
      const result = await enqueueTranslationJob(job);
      if (result.success) {
        enqueuedCount++;
      }
    }

    return {
      success: true,
      enqueued_count: enqueuedCount,
      message: `${enqueuedCount} translation jobs enqueued for organization ${organizationId}`
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Translation Client] Bulk enqueue failed:', { data: error });

    return {
      success: false,
      enqueued_count: 0,
      message: `Bulk translation enqueue failed: ${errorMsg}`
    };
  }
}