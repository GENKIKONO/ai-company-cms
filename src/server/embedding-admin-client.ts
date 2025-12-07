/**
 * Embedding Admin Client - Server-Side Only
 * P4-5: SERVICE_ROLE_KEYを使用するサーバー専用クライアント
 */

'use server';

import { createHash } from 'crypto';

// SHA-256 hash calculation utility
function calculateContentHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export interface EmbeddingJobRequest {
  organization_id: string;
  source_table: string;
  source_id: string;
  source_field: string;
  content_text: string;
  content_hash: string; // SHA256 hash - required for P4-5
  lang: string; // Language - required for P4-5
  priority?: number;
}

export interface EmbeddingDrainRequest {
  organization_id: string;
  batch_size: number;
  diff_strategy: 'content_hash' | 'updated_at' | 'version';
  priority_min?: number;
  priority_max?: number;
}

/**
 * Embeddingジョブをキューに投入（サーバー専用）
 */
export async function enqueueEmbeddingJobServer(
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
    console.error('[Embedding Admin Client] Enqueue failed:', error);
    
    return {
      success: false,
      message: `Embedding job enqueue failed: ${errorMsg}`
    };
  }
}

/**
 * Embeddingジョブのバッチ処理実行（サーバー専用）
 */
export async function drainEmbeddingJobsServer(
  drainParams: EmbeddingDrainRequest
): Promise<{
  success: boolean;
  processed_count: number;
  skipped_count: number;
  failed_count: number;
  job_run_id: string;
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
      },
      body: JSON.stringify(drainParams)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Embedding job drain failed: ${result.message || response.statusText}`);
    }

    return {
      success: true,
      processed_count: result.processed_count || 0,
      skipped_count: result.skipped_count || 0,
      failed_count: result.failed_count || 0,
      job_run_id: result.job_run_id || '',
      message: result.message || 'Embedding jobs processed successfully'
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Embedding Admin Client] Drain failed:', error);
    
    return {
      success: false,
      processed_count: 0,
      skipped_count: 0,
      failed_count: 0,
      job_run_id: '',
      message: `Embedding job drain failed: ${errorMsg}`
    };
  }
}

/**
 * 組織のコンテンツ一括Embedding投入（サーバー専用）
 */
export async function enqueueOrganizationEmbeddingsServer(
  organizationId: string,
  contentTypes: string[] = ['posts', 'services', 'faqs', 'case_studies'],
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
        // 処理対象フィールドを決定
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
            content_hash: calculateContentHash(text),
            lang: 'ja', // Default language
            priority
          });
        }
      }
    }

    // バッチでジョブ投入
    for (const job of jobs) {
      const result = await enqueueEmbeddingJobServer(job);
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
    console.error('[Embedding Admin Client] Bulk enqueue failed:', error);
    
    return {
      success: false,
      enqueued_count: 0,
      skipped_count: 0,
      message: `Bulk embedding enqueue failed: ${errorMsg}`
    };
  }
}