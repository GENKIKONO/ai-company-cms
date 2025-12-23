/**
 * Translation Drain Job
 *
 * Daily cron job that processes pending translation jobs
 *
 * UPSERT仕様:
 * - キー: (source_id, target_lang, source_field) = entity_id, lang, field
 * - 既存レコード: translated_text, updated_at を更新
 * - idempotency_key: buildTranslateKey() で生成、translation_jobs に保存
 * - 差分検知: content_hash で変更有無を判定
 */

import { logger } from '@/lib/log';

export interface TranslationDrainResult {
  success: boolean;
  processed_count?: number;
  skipped_count?: number;
  failed_count?: number;
  error?: string;
  timestamp: string;
  duration?: number;
}

export async function runTranslationDrain(batchSize: number = 50): Promise<TranslationDrainResult> {
  const startTime = Date.now();

  try {
    logger.debug('[Translation Drain] Starting translation job processing...', { batchSize });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Call the translation-runner Edge Function drain endpoint
    const response = await fetch(`${supabaseUrl}/functions/v1/translation-runner/drain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ batch_size: batchSize }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Translation drain API failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const duration = Date.now() - startTime;

    logger.debug('[Translation Drain] Job processing completed', {
      processed: result.processed_count,
      skipped: result.skipped_count,
      failed: result.failed_count,
      duration,
    });

    return {
      success: true,
      processed_count: result.processed_count || 0,
      skipped_count: result.skipped_count || 0,
      failed_count: result.failed_count || 0,
      duration,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Translation Drain] Job processing failed:', { data: { error: errorMsg, duration } });

    return {
      success: false,
      error: errorMsg,
      duration,
      timestamp: new Date().toISOString(),
    };
  }
}
