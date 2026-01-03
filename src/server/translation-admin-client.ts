/* eslint-disable no-console */
/**
 * Translation Admin Client - Server-Side Only
 * P4-5: SERVICE_ROLE_KEYを使用するサーバー専用クライアント
 */

'use server';

import { createHash } from 'crypto';

// SHA-256 hash calculation utility
export async function calculateContentHash(text: string): Promise<string> {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export interface TranslationJobRequest {
  organization_id: string;
  source_table: string;
  source_id: string;
  source_field: string;
  source_lang: string;
  target_lang: string;
  source_text: string;
  content_hash: string; // SHA256 hash - required for P4-5
  priority?: number;
}

export interface TranslationDrainRequest {
  organization_id: string;
  batch_size: number;
  diff_strategy: 'content_hash' | 'updated_at' | 'version';
  priority_min?: number;
  priority_max?: number;
}

/**
 * 翻訳ジョブをキューに投入（サーバー専用）
 */
export async function enqueueTranslationJobServer(
  job: TranslationJobRequest
): Promise<{ success: boolean; job_id?: string; message: string; skipped?: boolean }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/translation-runner/enqueue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
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
      message: result.message || 'Translation job enqueued successfully',
      skipped: result.skipped || false
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Translation Admin Client] Enqueue failed:', error);
    
    return {
      success: false,
      message: `Translation job enqueue failed: ${errorMsg}`
    };
  }
}

/**
 * 翻訳ジョブのバッチ処理実行（サーバー専用）
 */
export async function drainTranslationJobsServer(
  drainParams: TranslationDrainRequest
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

    const response = await fetch(`${supabaseUrl}/functions/v1/translation-runner/drain`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(drainParams)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Translation job drain failed: ${result.message || response.statusText}`);
    }

    return {
      success: true,
      processed_count: result.processed_count || 0,
      skipped_count: result.skipped_count || 0,
      failed_count: result.failed_count || 0,
      job_run_id: result.job_run_id || '',
      message: result.message || 'Translation jobs processed successfully'
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Translation Admin Client] Drain failed:', error);
    
    return {
      success: false,
      processed_count: 0,
      skipped_count: 0,
      failed_count: 0,
      job_run_id: '',
      message: `Translation job drain failed: ${errorMsg}`
    };
  }
}

/**
 * 組織のコンテンツ一括翻訳投入（サーバー専用）
 */
export async function enqueueOrganizationTranslationsServer(
  organizationId: string,
  targetLanguages: string[] = ['en'],
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
          // title の翻訳
          if (content.title) {
            jobs.push({
              organization_id: organizationId,
              source_table: table,
              source_id: content.id,
              source_field: 'title',
              source_lang: 'ja',
              target_lang: targetLang,
              source_text: content.title,
              content_hash: await calculateContentHash(content.title),
              priority
            });
          }

          // description の翻訳
          if (content.description) {
            jobs.push({
              organization_id: organizationId,
              source_table: table,
              source_id: content.id,
              source_field: 'description',
              source_lang: 'ja',
              target_lang: targetLang,
              source_text: content.description,
              content_hash: await calculateContentHash(content.description),
              priority
            });
          }
        }
      }
    }

    // バッチでジョブ投入
    for (const job of jobs) {
      const result = await enqueueTranslationJobServer(job);
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
      message: `${enqueuedCount} translation jobs enqueued, ${skippedCount} skipped (already up to date) for organization ${organizationId}`
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Translation Admin Client] Bulk enqueue failed:', error);
    
    return {
      success: false,
      enqueued_count: 0,
      skipped_count: 0,
      message: `Bulk translation enqueue failed: ${errorMsg}`
    };
  }
}