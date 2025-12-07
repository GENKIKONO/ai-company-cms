/**
 * Translation Runner Edge Function
 * P4-5: 差分更新バッチ & 冪等性統一 対応版
 * 
 * HTTPインターフェースは変更せず、内部実装のみ_shared統合
 * エンドポイント: /translation-runner/enqueue, /translation-runner/drain
 */

import { corsHeaders } from '../_shared/cors.ts';
import { createEdgeLogger } from '../_shared/logging.ts';
import { buildTranslateKey, registerIdempotencyKey, completeIdempotencyKey, failIdempotencyKey } from '../_shared/idempotency-p45.ts';
import { shouldProcessByHash } from '../_shared/diffs.ts';
import { startJob, succeedJob, failJob, updateProgress, createJobMeta, updateJobMetaCounters } from '../_shared/jobs-p45.ts';
import { withRetry, processWithPartialFailure } from '../_shared/batch.ts';
import { select, patch, insert } from '../_shared/db-p45.ts';

interface TranslationJobRequest {
  organization_id: string;
  source_table: string;
  source_id: string;
  source_field: string;
  source_lang: string;
  target_lang: string;
  source_text: string;
  priority?: number;
}

interface BulkTranslationRequest {
  organization_id: string;
  target_languages: string[];
  content_types: string[];
  priority?: number;
}

// OpenAI翻訳実行
async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text from ${sourceLang} to ${targetLang}. Maintain the original tone, style, and formatting.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

// content_hash計算
function calculateContentHash(text: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  return Array.from(new Uint8Array(crypto.subtle.digestSync('SHA-256', data)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// 翻訳ジョブ処理
async function processTranslationJob(job: TranslationJobRequest, logger: ReturnType<typeof createEdgeLogger>) {
  const contentHash = calculateContentHash(job.source_text);
  
  // 冪等性キー生成（P4-5統一ルール）
  const idempotencyKey = buildTranslateKey({
    orgId: job.organization_id,
    sourceTable: job.source_table,
    sourceId: job.source_id,
    sourceField: job.source_field,
    sourceLang: job.source_lang,
    targetLang: job.target_lang,
    contentHash: contentHash
  });

  // 冪等性キー登録（UNIQUE衝突は正常スキップ）
  try {
    await registerIdempotencyKey({
      functionName: 'translation-runner',
      key: idempotencyKey,
      requestHash: contentHash
    });
  } catch (error) {
    logger.info('Translation job skipped (idempotency)', { 
      idempotency_key: idempotencyKey,
      organization_id: job.organization_id 
    });
    return { success: true, skipped: true, job_id: null, message: 'Skipped (already processed)' };
  }

  // 既存翻訳の差分チェック
  const existing = await select('translation_jobs', {
    'organization_id': `eq.${job.organization_id}`,
    'source_table': `eq.${job.source_table}`,
    'source_id': `eq.${job.source_id}`,
    'source_field': `eq.${job.source_field}`,
    'target_lang': `eq.${job.target_lang}`
  });

  if (existing.length > 0) {
    const existingJob = existing[0];
    const existingHash = existingJob.content_hash || '';
    
    if (!shouldProcessByHash(existingHash, contentHash)) {
      await completeIdempotencyKey({
        functionName: 'translation-runner',
        key: idempotencyKey,
        response: { skipped: true, existing_job_id: existingJob.id }
      });
      
      logger.info('Translation job skipped (no content change)', {
        idempotency_key: idempotencyKey,
        existing_job_id: existingJob.id
      });
      return { success: true, skipped: true, job_id: existingJob.id, message: 'Skipped (no content change)' };
    }
  }

  // 新しい翻訳ジョブ作成
  const translationJob = {
    organization_id: job.organization_id,
    source_table: job.source_table,
    source_id: job.source_id,
    source_field: job.source_field,
    source_lang: job.source_lang,
    target_lang: job.target_lang,
    source_text: job.source_text,
    content_hash: contentHash,
    idempotency_key: idempotencyKey,
    status: 'pending',
    priority: job.priority || 5,
    scheduled_at: new Date().toISOString(),
    retry_count: 0,
    max_retries: 3
  };

  const [created] = await insert('translation_jobs', translationJob);
  
  await completeIdempotencyKey({
    functionName: 'translation-runner',
    key: idempotencyKey,
    response: { job_id: created.id }
  });

  logger.info('Translation job enqueued', { 
    job_id: created.id,
    idempotency_key: idempotencyKey 
  });

  return { success: true, skipped: false, job_id: created.id, message: 'Translation job enqueued' };
}

// バッチ翻訳処理
async function drainTranslationJobs(logger: ReturnType<typeof createEdgeLogger>) {
  // job_runs_v2 レコード作成
  const jobRunId = crypto.randomUUID();
  const jobMeta = createJobMeta({
    jobType: 'translation_batch',
    diffStrategy: 'content_hash',
    idempotencyScope: 'translation-runner'
  });

  await insert('job_runs_v2', {
    id: jobRunId,
    job_name: 'translation_drain',
    status: 'pending',
    idempotency_key: `drain:${Date.now()}`,
    meta: jobMeta
  });

  await startJob(jobRunId, jobMeta);

  try {
    // pending ジョブを取得
    const pendingJobs = await select('translation_jobs', {
      'status': 'eq.pending'
    });

    if (pendingJobs.length === 0) {
      const finalMeta = updateJobMetaCounters(jobMeta, { skipped: 1 });
      await succeedJob(jobRunId, finalMeta);
      return { success: true, processed_count: 0, message: 'No pending jobs' };
    }

    // バッチ処理実行
    const retryPolicy = { maxRetries: 3, baseDelayMs: 1000 };
    
    const stats = await processWithPartialFailure(
      pendingJobs,
      10, // バッチサイズ
      async (job) => {
        try {
          return await withRetry(async () => {
            // ジョブ開始
            await patch('translation_jobs', `id=eq.${job.id}`, { 
              status: 'in_progress',
              started_at: new Date().toISOString() 
            });

            // 翻訳実行
            const translatedText = await translateText(job.source_text, job.source_lang, job.target_lang);
            
            // 完了更新
            await patch('translation_jobs', `id=eq.${job.id}`, {
              status: 'completed',
              translated_text: translatedText,
              completed_at: new Date().toISOString()
            });

            logger.info('Translation completed', { job_id: job.id });
            return { success: true, skipped: false };
          }, retryPolicy);
        } catch (error) {
          // 失敗処理
          await patch('translation_jobs', `id=eq.${job.id}`, {
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            retry_count: job.retry_count + 1
          });

          logger.error('Translation failed', { 
            job_id: job.id, 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    );

    // job_runs_v2 完了更新
    const finalMeta = updateJobMetaCounters(jobMeta, {
      processed: stats.processed,
      skipped: stats.skipped,
      failed: stats.failed
    });
    finalMeta.items_total = stats.total;

    await succeedJob(jobRunId, finalMeta);

    return {
      success: true,
      processed_count: stats.processed,
      skipped_count: stats.skipped,
      failed_count: stats.failed,
      message: `Processed ${stats.processed} translations`
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await failJob(jobRunId, { message: errorMsg }, jobMeta);
    logger.error('Translation drain failed', { error: errorMsg });
    
    return {
      success: false,
      processed_count: 0,
      message: `Translation drain failed: ${errorMsg}`
    };
  }
}

// Health check endpoint handler - simplified for Supabase dashboard
async function handleHealth(_req: Request): Promise<Response> {
  const body = {
    ok: true,
    env: {
      hasUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      hasOpenAIApiKey: !!Deno.env.get('OPENAI_API_KEY'),
    },
    imports: {
      shared: true, // _shared modules are available
    },
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Smoke test endpoint handler - internal function calls only
async function handleSmoke(_req: Request): Promise<Response> {
  const smokeTestId = crypto.randomUUID();
  
  try {
    // テスト用のダミージョブ作成
    const testJob: TranslationJobRequest = {
      organization_id: smokeTestId,
      source_table: 'smoke_test',
      source_id: `test-${smokeTestId}`,
      source_field: 'title',
      source_lang: 'ja',
      target_lang: 'en',
      source_text: 'テストメッセージ - Smoke Test',
      priority: 1
    };

    // 内部でenqueue処理
    const logger = createEdgeLogger();
    const enqueueResult = await processTranslationJob(testJob, logger);
    
    if (!enqueueResult.success) {
      throw new Error(`Enqueue failed: ${enqueueResult.message}`);
    }

    const contentHash = calculateContentHash(testJob.source_text);
    const idempotencyKey = buildTranslateKey({
      orgId: testJob.organization_id,
      sourceTable: testJob.source_table,
      sourceId: testJob.source_id,
      sourceField: testJob.source_field,
      sourceLang: testJob.source_lang,
      targetLang: testJob.target_lang,
      contentHash: contentHash
    });

    // DB確認
    const createdJobs = await select('translation_jobs', {
      'organization_id': `eq.${smokeTestId}`
    });

    const idempotencyRecord = await select('idempotency_keys', {
      'key': `eq.${idempotencyKey}`
    });

    const jobRunRecord = await select('job_runs_v2', {
      'idempotency_key': `like.%${smokeTestId}%`
    }, { limit: 1 });

    // P4-5仕様準拠のレスポンス形式
    const response = {
      request: {
        organization_id: testJob.organization_id,
        source_table: testJob.source_table,
        source_id: testJob.source_id,
        source_field: testJob.source_field,
        source_lang: testJob.source_lang,
        target_lang: testJob.target_lang,
        content_hash: contentHash
      },
      idempotency: idempotencyRecord[0] || null,
      queue: createdJobs[0] || null,
      job_run: jobRunRecord[0] || null,
      errors: []
    };

    // クリーンアップ
    await patch('translation_jobs', `organization_id=eq.${smokeTestId}`, {
      status: 'cancelled'
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    const response = {
      request: {
        organization_id: smokeTestId,
        source_table: 'smoke_test',
        source_id: `test-${smokeTestId}`,
        source_field: 'title',
        source_lang: 'ja',
        target_lang: 'en',
        content_hash: null
      },
      idempotency: null,
      queue: null,
      job_run: null,
      errors: [errorMsg]
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handle enqueue requests
async function handleEnqueue(req: Request): Promise<Response> {
  const logger = createEdgeLogger();
  
  try {
    const body = await req.json();
    const job: TranslationJobRequest = body;
    const result = await processTranslationJob(job, logger);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Translation enqueue error', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle drain requests
async function handleDrain(req: Request): Promise<Response> {
  const logger = createEdgeLogger();
  
  try {
    const result = await drainTranslationJobs(logger);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Translation drain error', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle enqueue/drain based on POST body action (legacy support)
async function handleEnqueueOrDrain(req: Request): Promise<Response> {
  const logger = createEdgeLogger();
  
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'enqueue') {
      const job: TranslationJobRequest = body;
      const result = await processTranslationJob(job, logger);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'drain') {
      const result = await drainTranslationJobs(logger);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Legacy support: if no action, assume it's an enqueue job
    if (!action && body.organization_id && body.source_text) {
      const result = await processTranslationJob(body as TranslationJobRequest, logger);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action or missing data' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Translation runner error', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// メインハンドラー - Supabase仕様準拠ルーティング
const BASE = '/functions/v1/translation-runner';

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathname = url.pathname;
  let subpath = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  if (!subpath) subpath = '/';

  const method = req.method.toUpperCase();

  // 1) ダッシュボード Test からのルート
  if (subpath === '/' && method === 'GET') return handleHealth(req);
  if (subpath === '/' && method === 'POST') return handleSmoke(req);

  // 2) 既存パス
  if (subpath === '/health' && method === 'GET') return handleHealth(req);
  if (subpath === '/smoke' && (method === 'GET' || method === 'POST')) return handleSmoke(req);
  if (subpath === '/enqueue' && method === 'POST') return handleEnqueue(req);
  if (subpath === '/drain' && method === 'POST') return handleDrain(req);

  // 3) レガシーサポート（既存ロジック用）
  if (method === 'POST') {
    return handleEnqueueOrDrain(req);
  }

  // 4) デバッグ用 404
  return new Response(
    JSON.stringify({ error: 'Not found', pathname, subpath, method }),
    { status: 404, headers: { 'Content-Type': 'application/json' } },
  );
});