/**
 * Embedding Runner Edge Function
 * P4-5: 差分更新バッチ & 冪等性統一 対応版
 * 
 * HTTPインターフェースは変更せず、内部実装のみ_shared統合
 * エンドポイント: /embedding-runner/enqueue, /embedding-runner/drain
 */

import { corsHeaders } from '../_shared/cors.ts';
import { createEdgeLogger } from '../_shared/logging.ts';
import { buildEmbeddingKey, registerIdempotencyKey, completeIdempotencyKey, failIdempotencyKey } from '../_shared/idempotency-p45.ts';
import { shouldProcessByHash } from '../_shared/diffs.ts';
import { startJob, succeedJob, failJob, updateProgress, createJobMeta, updateJobMetaCounters } from '../_shared/jobs-p45.ts';
import { withRetry, processWithPartialFailure } from '../_shared/batch.ts';
import { select, patch, insert, bulkOperation } from '../_shared/db-p45.ts';

interface EmbeddingJobRequest {
  organization_id: string;
  source_table: string;
  source_id: string;
  source_field: string;
  content_text: string;
  priority?: number;
}

interface BulkEmbeddingRequest {
  organization_id: string;
  content_types: string[];
  priority?: number;
}

// OpenAI Embedding生成
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small',
      encoding_format: 'float'
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data[0].embedding;
}

// content_hash計算
function calculateContentHash(text: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  return Array.from(new Uint8Array(crypto.subtle.digestSync('SHA-256', data)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// テキストチャンク分割
function chunkText(text: string, maxChunkSize = 1000, overlap = 100): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxChunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    
    // 最後のチャンクでない場合はオーバーラップを適用
    if (end < text.length) {
      start = end - overlap;
    } else {
      break;
    }
  }

  return chunks;
}

// Embeddingジョブ処理
async function processEmbeddingJob(job: EmbeddingJobRequest, logger: ReturnType<typeof createEdgeLogger>) {
  const contentHash = calculateContentHash(job.content_text);
  
  // 冪等性キー生成（P4-5統一ルール）
  const idempotencyKey = buildEmbeddingKey({
    orgId: job.organization_id,
    sourceTable: job.source_table,
    sourceId: job.source_id,
    sourceField: job.source_field,
    lang: 'ja', // デフォルト言語
    contentHash: contentHash
  });

  // 冪等性キー登録（UNIQUE衝突は正常スキップ）
  try {
    await registerIdempotencyKey({
      functionName: 'embedding-runner',
      key: idempotencyKey,
      requestHash: contentHash
    });
  } catch (error) {
    logger.info('Embedding job skipped (idempotency)', { 
      idempotency_key: idempotencyKey,
      organization_id: job.organization_id 
    });
    return { success: true, skipped: true, job_id: null, message: 'Skipped (already processed)' };
  }

  // 既存Embeddingの差分チェック
  const existing = await select('embedding_jobs', {
    'organization_id': `eq.${job.organization_id}`,
    'source_table': `eq.${job.source_table}`,
    'source_id': `eq.${job.source_id}`,
    'source_field': `eq.${job.source_field}`
  });

  if (existing.length > 0) {
    const existingJob = existing[0];
    const existingHash = existingJob.content_hash || '';
    
    if (!shouldProcessByHash(existingHash, contentHash)) {
      await completeIdempotencyKey({
        functionName: 'embedding-runner',
        key: idempotencyKey,
        response: { skipped: true, existing_job_id: existingJob.id }
      });
      
      logger.info('Embedding job skipped (no content change)', {
        idempotency_key: idempotencyKey,
        existing_job_id: existingJob.id
      });
      return { success: true, skipped: true, job_id: existingJob.id, message: 'Skipped (no content change)' };
    }
  }

  // テキストをチャンクに分割
  const chunks = chunkText(job.content_text);
  
  // 新しいEmbeddingジョブ作成
  const embeddingJob = {
    organization_id: job.organization_id,
    source_table: job.source_table,
    source_id: job.source_id,
    source_field: job.source_field,
    content_text: job.content_text,
    content_hash: contentHash,
    chunk_count: chunks.length,
    chunk_strategy: 'overlap',
    embedding_model: 'text-embedding-3-small',
    idempotency_key: idempotencyKey,
    status: 'pending',
    priority: job.priority || 5,
    scheduled_at: new Date().toISOString(),
    retry_count: 0,
    max_retries: 3
  };

  const [created] = await insert('embedding_jobs', embeddingJob);
  
  await completeIdempotencyKey({
    functionName: 'embedding-runner',
    key: idempotencyKey,
    response: { job_id: created.id }
  });

  logger.info('Embedding job enqueued', { 
    job_id: created.id,
    idempotency_key: idempotencyKey,
    chunk_count: chunks.length 
  });

  return { success: true, skipped: false, job_id: created.id, message: 'Embedding job enqueued' };
}

// バッチEmbedding処理
async function drainEmbeddingJobs(logger: ReturnType<typeof createEdgeLogger>) {
  // job_runs_v2 レコード作成
  const jobRunId = crypto.randomUUID();
  const jobMeta = createJobMeta({
    jobType: 'embedding_batch',
    diffStrategy: 'content_hash',
    idempotencyScope: 'embedding-runner'
  });

  await insert('job_runs_v2', {
    id: jobRunId,
    job_name: 'embedding_drain',
    status: 'pending',
    idempotency_key: `drain:${Date.now()}`,
    meta: jobMeta
  });

  await startJob(jobRunId, jobMeta);

  try {
    // pending ジョブを取得
    const pendingJobs = await select('embedding_jobs', {
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
      5, // バッチサイズ（Embeddingは処理重いので小さめ）
      async (job) => {
        try {
          return await withRetry(async () => {
            // ジョブ開始
            await patch('embedding_jobs', `id=eq.${job.id}`, { 
              status: 'processing',
              started_at: new Date().toISOString() 
            });

            // テキストをチャンクに分割
            const chunks = chunkText(job.content_text);
            const embeddings: any[] = [];

            // 各チャンクのEmbedding生成
            for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i];
              const embedding = await generateEmbedding(chunk);
              
              embeddings.push({
                organization_id: job.organization_id,
                source_table: job.source_table,
                source_id: job.source_id,
                source_field: job.source_field,
                chunk_index: i,
                chunk_text: chunk,
                content_hash: job.content_hash,
                embedding: JSON.stringify(embedding), // pgvector形式への変換は後でSupabaseで処理
                embedding_model: job.embedding_model,
                is_active: true
              });
            }

            // 既存のEmbeddingを無効化
            await patch('embeddings', `organization_id=eq.${job.organization_id}&source_table=eq.${job.source_table}&source_id=eq.${job.source_id}&source_field=eq.${job.source_field}`, {
              is_active: false
            });

            // 新しいEmbeddingを一括挿入
            await bulkOperation('embeddings', 'insert', embeddings);
            
            // ジョブ完了更新
            await patch('embedding_jobs', `id=eq.${job.id}`, {
              status: 'completed',
              completed_at: new Date().toISOString()
            });

            logger.info('Embedding completed', { 
              job_id: job.id,
              chunk_count: chunks.length 
            });
            return { success: true, skipped: false };
          }, retryPolicy);
        } catch (error) {
          // 失敗処理
          await patch('embedding_jobs', `id=eq.${job.id}`, {
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            retry_count: job.retry_count + 1
          });

          logger.error('Embedding failed', { 
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
      message: `Processed ${stats.processed} embeddings`
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await failJob(jobRunId, { message: errorMsg }, jobMeta);
    logger.error('Embedding drain failed', { error: errorMsg });
    
    return {
      success: false,
      processed_count: 0,
      message: `Embedding drain failed: ${errorMsg}`
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
    const testJob: EmbeddingJobRequest = {
      organization_id: smokeTestId,
      source_table: 'smoke_test',
      source_id: `test-${smokeTestId}`,
      source_field: 'content',
      content_text: 'これはエンベディング用のテストテキストです。Smoke test for embedding generation.',
      priority: 1
    };

    // 内部でenqueue処理
    const logger = createEdgeLogger();
    const enqueueResult = await processEmbeddingJob(testJob, logger);
    
    if (!enqueueResult.success) {
      throw new Error(`Enqueue failed: ${enqueueResult.message}`);
    }

    const contentHash = calculateContentHash(testJob.content_text);
    const idempotencyKey = buildEmbeddingKey({
      orgId: testJob.organization_id,
      sourceTable: testJob.source_table,
      sourceId: testJob.source_id,
      sourceField: testJob.source_field,
      lang: 'ja',
      contentHash: contentHash
    });

    // DB確認
    const createdJobs = await select('embedding_jobs', {
      'organization_id': `eq.${smokeTestId}`
    });

    const idempotencyRecord = await select('idempotency_keys', {
      'key': `eq.${idempotencyKey}`
    });

    const jobRunRecord = await select('job_runs_v2', {
      'idempotency_key': `like.%${smokeTestId}%`
    }, { limit: 1 });

    const embeddingRecord = await select('embeddings', {
      'organization_id': `eq.${smokeTestId}`,
      'is_active': `eq.true`
    }, { limit: 1 });

    // P4-5仕様準拠のレスポンス形式
    const response = {
      request: {
        organization_id: testJob.organization_id,
        source_table: testJob.source_table,
        source_id: testJob.source_id,
        source_field: testJob.source_field,
        lang: 'ja',
        content_hash: contentHash
      },
      idempotency: idempotencyRecord[0] || null,
      queue: createdJobs[0] || null,
      job_run: jobRunRecord[0] || null,
      embeddings: embeddingRecord[0] || null,
      errors: []
    };

    // クリーンアップ
    await patch('embedding_jobs', `organization_id=eq.${smokeTestId}`, {
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
        source_field: 'content',
        lang: 'ja',
        content_hash: null
      },
      idempotency: null,
      queue: null,
      job_run: null,
      embeddings: null,
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
    const job: EmbeddingJobRequest = body;
    const result = await processEmbeddingJob(job, logger);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Embedding enqueue error', { 
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
    const result = await drainEmbeddingJobs(logger);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Embedding drain error', { 
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
      const job: EmbeddingJobRequest = body;
      const result = await processEmbeddingJob(job, logger);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'drain') {
      const result = await drainEmbeddingJobs(logger);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Legacy support: if no action, assume it's an enqueue job
    if (!action && body.organization_id && body.content_text) {
      const result = await processEmbeddingJob(body as EmbeddingJobRequest, logger);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action or missing data' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Embedding runner error', { 
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
const BASE = '/functions/v1/embedding-runner';

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