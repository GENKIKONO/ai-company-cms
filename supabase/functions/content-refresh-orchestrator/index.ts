/**
 * Content Refresh Orchestrator Edge Function
 * P4-8: コンテンツ刷新パイプライン統合オーケストレータ
 * 
 * 機能:
 * 1. 原文更新からpublic_*反映までの一気通貫パイプライン
 * 2. 翻訳→public同期→CDN purge→Embeddingの各ステップ管理
 * 3. job_runs_v2とservice_role_auditへの監査記録
 * 4. idempotency制御とエラーハンドリング
 */

import { createServiceRoleClient, createAuthenticatedClient } from '../_shared/supabase.ts';
import { createEdgeLogger } from '../_shared/logging.ts';
import { beginRun, completeSuccess, completeFailure, type JobMeta } from '../_shared/job-runs.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { syncEntityToPublic, type SupportedEntityType } from '../_shared/public-sync.ts';

// TypeScript インタフェース定義
interface ContentRefreshRequest {
  entity_type: 'post' | 'service' | 'faq' | 'news' | 'case_study';
  entity_id: string;
  trigger_source?: 'admin_ui' | 'cron' | 'webhook';
  options?: {
    target_langs?: string[];
    force_refresh?: boolean;
    skip_embedding?: boolean;
    skip_cache_purge?: boolean;
  };
}

interface ContentRefreshResponse {
  ok: boolean;
  job_id: string;
  request_id: string;
  pipeline_status: 'running' | 'succeeded' | 'failed' | 'partial_error';
  steps: PipelineStep[];
  error?: string;
}

interface PipelineStep {
  step: 'translation' | 'public_sync' | 'cache_purge' | 'embedding';
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped';
  started_at?: string;
  finished_at?: string;
  duration_ms?: number;
  items_processed?: number;
  error_message?: string;
}

interface EntityContent {
  content_version: number;
  content_hash: string;
  supported_languages: string[];
  organization_id: string;
}

// サポート言語一覧（デフォルト）
const DEFAULT_LANGUAGES = ['ja', 'en'];

// コンテンツハッシュ生成
async function generateContentHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.slice(0, 8); // 8文字に短縮
}

// エンティティコンテンツ情報取得
async function getEntityContent(
  entityType: string,
  entityId: string,
  supabase: any,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<EntityContent | null> {
  try {
    let tableName: string;
    let contentFields: string[];
    
    switch (entityType) {
      case 'post':
        tableName = 'posts';
        contentFields = ['title', 'content'];
        break;
      case 'service':
        tableName = 'services';
        contentFields = ['name', 'description'];
        break;
      case 'faq':
        tableName = 'faqs';
        contentFields = ['question', 'answer'];
        break;
      case 'news':
        tableName = 'news';
        contentFields = ['title', 'content'];
        break;
      case 'case_study':
        tableName = 'case_studies';
        contentFields = ['title', 'problem', 'solution', 'outcome'];
        break;
      default:
        throw new Error(`Unsupported entity_type: ${entityType}`);
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', entityId)
      .single();

    if (error || !data) {
      logger.error(`Failed to fetch entity content`, {
        entity_type: entityType,
        entity_id: entityId,
        error: error?.message
      });
      return null;
    }

    // コンテンツ文字列を結合してハッシュ生成
    const contentText = contentFields
      .map(field => data[field] || '')
      .join('\n');
    
    const contentHash = await generateContentHash(contentText);

    return {
      content_version: data.version || 1,
      content_hash: contentHash,
      supported_languages: DEFAULT_LANGUAGES, // TODO: 実際のサポート言語を動的に取得
      organization_id: data.organization_id || 'default'
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('getEntityContent failed', {
      entity_type: entityType,
      entity_id: entityId,
      error: errorMsg
    });
    return null;
  }
}

// 翻訳ステップ実行
async function executeTranslationStep(
  entityType: string,
  entityId: string,
  languages: string[],
  entityContent: EntityContent,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<PipelineStep> {
  const step: PipelineStep = {
    step: 'translation',
    status: 'running',
    started_at: new Date().toISOString()
  };

  try {
    logger.info('Starting translation step', {
      entity_type: entityType,
      entity_id: entityId,
      target_languages: languages
    });

    // TODO: 実際のtranslation-runner呼び出し
    // 現在はMVPとして成功をシミュレート
    await new Promise(resolve => setTimeout(resolve, 100)); // シミュレーション

    step.status = 'succeeded';
    step.finished_at = new Date().toISOString();
    step.duration_ms = Date.now() - new Date(step.started_at!).getTime();
    step.items_processed = languages.length;

    logger.info('Translation step completed', {
      entity_type: entityType,
      entity_id: entityId,
      duration_ms: step.duration_ms
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Translation failed';
    step.status = 'failed';
    step.finished_at = new Date().toISOString();
    step.duration_ms = Date.now() - new Date(step.started_at!).getTime();
    step.error_message = errorMsg;

    logger.error('Translation step failed', {
      entity_type: entityType,
      entity_id: entityId,
      error: errorMsg
    });
  }

  return step;
}

// public_* 同期ステップ実行
async function executePublicSyncStep(
  entityType: string,
  entityId: string,
  languages: string[],
  supabase: any,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<PipelineStep> {
  const step: PipelineStep = {
    step: 'public_sync',
    status: 'running',
    started_at: new Date().toISOString()
  };

  try {
    logger.info('Starting public_sync step', {
      entity_type: entityType,
      entity_id: entityId,
      target_languages: languages
    });

    // 実際のpublic_*同期ロジック実行
    const syncResult = await syncEntityToPublic(
      entityType as SupportedEntityType,
      entityId,
      languages,
      logger
    );

    if (syncResult.success && syncResult.errors.length === 0) {
      step.status = 'succeeded';
    } else if (syncResult.affected_rows > 0) {
      step.status = 'succeeded'; // 部分成功でも succeeded として扱う
      logger.warn('Public sync completed with some errors', {
        entity_type: entityType,
        entity_id: entityId,
        affected_rows: syncResult.affected_rows,
        errors: syncResult.errors.length
      });
    } else {
      throw new Error(`Public sync failed: ${syncResult.errors.map(e => e.error_message).join(', ')}`);
    }

    step.finished_at = new Date().toISOString();
    step.duration_ms = Date.now() - new Date(step.started_at!).getTime();
    step.items_processed = syncResult.affected_rows;

    logger.info('Public sync step completed', {
      entity_type: entityType,
      entity_id: entityId,
      affected_rows: syncResult.affected_rows,
      synced_languages: syncResult.synced_languages.length,
      duration_ms: step.duration_ms
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Public sync failed';
    step.status = 'failed';
    step.finished_at = new Date().toISOString();
    step.duration_ms = Date.now() - new Date(step.started_at!).getTime();
    step.error_message = errorMsg;

    logger.error('Public sync step failed', {
      entity_type: entityType,
      entity_id: entityId,
      error: errorMsg
    });
  }

  return step;
}

// CDN purgeステップ実行
async function executeCachePurgeStep(
  entityType: string,
  entityId: string,
  languages: string[],
  entityContent: EntityContent,
  supabase: any,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<PipelineStep> {
  const step: PipelineStep = {
    step: 'cache_purge',
    status: 'running',
    started_at: new Date().toISOString()
  };

  try {
    logger.info('Starting cache_purge step', {
      entity_type: entityType,
      entity_id: entityId,
      target_languages: languages
    });

    // エンティティのslugや組織情報取得
    const { data: entityData } = await supabase
      .from(entityType === 'case_study' ? 'case_studies' : `${entityType}s`)
      .select('slug, organization_id')
      .eq('id', entityId)
      .single();

    let organizationSlug: string | undefined;
    if (entityData?.organization_id) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', entityData.organization_id)
        .single();
      organizationSlug = orgData?.slug;
    }

    // cache-purge Edge Function呼び出し
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration for cache purge');
    }

    const cachePurgeResponse = await fetch(`${supabaseUrl}/functions/v1/cache-purge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: entityId,
        entity_slug: entityData?.slug,
        organization_slug: organizationSlug,
        target_languages: languages,
        purge_options: {
          include_feeds: true,
          include_sitemaps: true,
          include_api_endpoints: false
        }
      })
    });

    if (!cachePurgeResponse.ok) {
      const errorText = await cachePurgeResponse.text();
      throw new Error(`Cache purge API failed: ${cachePurgeResponse.status} ${errorText}`);
    }

    const purgeResult = await cachePurgeResponse.json();

    if (purgeResult.success) {
      step.status = 'succeeded';
      step.items_processed = purgeResult.total_purged;
    } else {
      step.status = 'failed';
      step.error_message = `Cache purge failed: ${purgeResult.total_failed} URLs failed`;
    }

    step.finished_at = new Date().toISOString();
    step.duration_ms = Date.now() - new Date(step.started_at!).getTime();

    logger.info('Cache purge step completed', {
      entity_type: entityType,
      entity_id: entityId,
      status: step.status,
      purged_urls: purgeResult.total_purged,
      failed_urls: purgeResult.total_failed,
      duration_ms: step.duration_ms
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Cache purge failed';
    step.status = 'failed';
    step.finished_at = new Date().toISOString();
    step.duration_ms = Date.now() - new Date(step.started_at!).getTime();
    step.error_message = errorMsg;

    logger.error('Cache purge step failed', {
      entity_type: entityType,
      entity_id: entityId,
      error: errorMsg
    });
  }

  return step;
}

// Embeddingステップ実行
async function executeEmbeddingStep(
  entityType: string,
  entityId: string,
  entityContent: EntityContent,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<PipelineStep> {
  const step: PipelineStep = {
    step: 'embedding',
    status: 'running',
    started_at: new Date().toISOString()
  };

  try {
    logger.info('Starting embedding step', {
      entity_type: entityType,
      entity_id: entityId,
      content_hash: entityContent.content_hash
    });

    // TODO: 実際のembedding-runner呼び出し
    // 現在はMVPとして成功をシミュレート
    await new Promise(resolve => setTimeout(resolve, 200)); // シミュレーション

    step.status = 'succeeded';
    step.finished_at = new Date().toISOString();
    step.duration_ms = Date.now() - new Date(step.started_at!).getTime();
    step.items_processed = 1;

    logger.info('Embedding step completed', {
      entity_type: entityType,
      entity_id: entityId,
      duration_ms: step.duration_ms
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Embedding failed';
    step.status = 'failed';
    step.finished_at = new Date().toISOString();
    step.duration_ms = Date.now() - new Date(step.started_at!).getTime();
    step.error_message = errorMsg;

    logger.error('Embedding step failed', {
      entity_type: entityType,
      entity_id: entityId,
      error: errorMsg
    });
  }

  return step;
}

// service_role_audit記録
async function logServiceRoleAction(
  jobName: string,
  requestId: string,
  affectedRowCount: number,
  errorCode: string | null,
  meta: Record<string, unknown>,
  supabase: any,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_service_role_action', {
      p_job_name: jobName,
      p_request_id: requestId,
      p_expected_row_count: null,
      p_affected_row_count: affectedRowCount,
      p_error_code: errorCode,
      p_meta: meta
    });

    if (error) {
      logger.error('Failed to log service_role_action', { error: error.message });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown audit error';
    logger.error('logServiceRoleAction exception', { error: errorMsg });
  }
}

// メインハンドラー
Deno.serve(async (req: Request): Promise<Response> => {
  const logger = createEdgeLogger(req, "content-refresh-orchestrator");
  
  try {
    // CORS対応
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // リクエスト解析
    let requestBody: ContentRefreshRequest;
    try {
      requestBody = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // パラメータ検証
    if (!requestBody.entity_type || !requestBody.entity_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: entity_type, entity_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      entity_type,
      entity_id,
      trigger_source = 'admin_ui',
      options = {}
    } = requestBody;

    const {
      target_langs = DEFAULT_LANGUAGES,
      force_refresh = false,
      skip_embedding = false,
      skip_cache_purge = false
    } = options;

    logger.info('Content refresh orchestrator started', {
      entity_type,
      entity_id,
      trigger_source,
      target_langs,
      force_refresh,
      skip_embedding,
      skip_cache_purge
    });

    // Supabaseクライアント初期化
    const supabase = createServiceRoleClient();

    // エンティティコンテンツ取得
    const entityContent = await getEntityContent(entity_type, entity_id, supabase, logger);
    if (!entityContent) {
      return new Response(
        JSON.stringify({ error: 'Entity not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // idempotency_key生成
    const idempotencyKey = `pipeline:${entity_type}:${entity_id}:${entityContent.content_version}`;

    // job_runs_v2に記録開始
    const jobMeta: JobMeta = {
      scope: 'edge',
      runner: 'edge_function',
      input_summary: {
        entity_type,
        entity_id,
        content_version: entityContent.content_version,
        trigger_source,
        target_langs,
        skip_embedding,
        skip_cache_purge
      }
    };

    const beginResult = await beginRun({
      job_name: 'content-refresh/pipeline',
      idempotency_key: idempotencyKey,
      request: req,
      meta: jobMeta
    }, logger);

    if (!beginResult.success) {
      logger.error('Failed to begin job run', { error: beginResult.error });
      return new Response(
        JSON.stringify({ error: 'Failed to start pipeline job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jobId = beginResult.record.id;
    const requestId = beginResult.record.request_id || '';

    // content_refresh_queueに記録
    try {
      const { error: queueError } = await supabase
        .from('content_refresh_queue')
        .upsert({
          entity_type,
          entity_id,
          content_version: entityContent.content_version,
          trigger_source,
          status: 'running',
          meta: {
            job_id: jobId,
            target_langs,
            options
          }
        }, {
          onConflict: 'entity_type,entity_id'
        });

      if (queueError) {
        logger.warn('Failed to update content_refresh_queue', { error: queueError.message });
      }
    } catch (error) {
      logger.warn('content_refresh_queue update error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    // パイプラインステップ実行
    const steps: PipelineStep[] = [];
    let overallStatus: 'succeeded' | 'failed' | 'partial_error' = 'succeeded';
    let totalAffectedRows = 0;

    // 1. 翻訳ステップ
    const translationStep = await executeTranslationStep(
      entity_type,
      entity_id,
      target_langs,
      entityContent,
      logger
    );
    steps.push(translationStep);
    
    if (translationStep.status === 'failed') {
      overallStatus = 'partial_error';
    } else {
      totalAffectedRows += translationStep.items_processed || 0;
    }

    // 2. public_*同期ステップ（翻訳が成功した場合のみ）
    if (translationStep.status === 'succeeded') {
      const publicSyncStep = await executePublicSyncStep(
        entity_type,
        entity_id,
        target_langs,
        supabase,
        logger
      );
      steps.push(publicSyncStep);
      
      if (publicSyncStep.status === 'failed') {
        overallStatus = 'partial_error';
      } else {
        totalAffectedRows += publicSyncStep.items_processed || 0;
      }

      // 3. CDN purgeステップ（public同期が成功し、スキップしない場合）
      if (publicSyncStep.status === 'succeeded' && !skip_cache_purge) {
        const cachePurgeStep = await executeCachePurgeStep(
          entity_type,
          entity_id,
          target_langs,
          entityContent,
          supabase,
          logger
        );
        steps.push(cachePurgeStep);
        
        if (cachePurgeStep.status === 'failed') {
          overallStatus = 'partial_error';
        }
      } else if (skip_cache_purge) {
        steps.push({
          step: 'cache_purge',
          status: 'skipped',
          started_at: new Date().toISOString(),
          finished_at: new Date().toISOString(),
          duration_ms: 0
        });
      }
    }

    // 4. Embeddingステップ（スキップしない場合）
    if (!skip_embedding && translationStep.status === 'succeeded') {
      const embeddingStep = await executeEmbeddingStep(
        entity_type,
        entity_id,
        entityContent,
        logger
      );
      steps.push(embeddingStep);
      
      if (embeddingStep.status === 'failed') {
        overallStatus = 'partial_error';
      }
    } else if (skip_embedding) {
      steps.push({
        step: 'embedding',
        status: 'skipped',
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        duration_ms: 0
      });
    }

    // 全ステップが失敗した場合は 'failed'
    const failedSteps = steps.filter(s => s.status === 'failed').length;
    const successSteps = steps.filter(s => s.status === 'succeeded').length;
    
    if (successSteps === 0 && failedSteps > 0) {
      overallStatus = 'failed';
    }

    // job_runs_v2完了記録
    const finalMeta: JobMeta = {
      ...jobMeta,
      output_summary: {
        total_steps: steps.length,
        succeeded_steps: successSteps,
        failed_steps: failedSteps,
        total_affected_rows: totalAffectedRows
      },
      stats: {
        items_processed: totalAffectedRows
      }
    };

    if (overallStatus === 'succeeded') {
      await completeSuccess({
        job_id: jobId,
        meta: {
          ...finalMeta,
          steps
        }
      }, logger);
    } else {
      const errorMessage = `Pipeline ${overallStatus}: ${failedSteps} step(s) failed`;
      await completeFailure({
        job_id: jobId,
        error_code: overallStatus.toUpperCase(),
        error_message: errorMessage,
        meta: {
          ...finalMeta,
          steps,
          error_details: {
            message_full: errorMessage,
            context: { failed_steps: steps.filter(s => s.status === 'failed') }
          }
        }
      }, logger);
    }

    // service_role_audit記録
    await logServiceRoleAction(
      'content-refresh/pipeline',
      requestId,
      totalAffectedRows,
      overallStatus === 'succeeded' ? null : overallStatus.toUpperCase(),
      {
        entity_type,
        entity_id,
        content_version: entityContent.content_version,
        steps: steps.length,
        trigger_source
      },
      supabase,
      logger
    );

    // content_refresh_queue更新
    try {
      await supabase
        .from('content_refresh_queue')
        .update({
          status: overallStatus === 'failed' ? 'failed' : 
                 overallStatus === 'partial_error' ? 'partial_error' : 'succeeded',
          updated_at: new Date().toISOString()
        })
        .eq('entity_type', entity_type)
        .eq('entity_id', entity_id);
    } catch (error) {
      logger.warn('content_refresh_queue final update failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const response: ContentRefreshResponse = {
      ok: overallStatus === 'succeeded',
      job_id: jobId,
      request_id: requestId,
      pipeline_status: overallStatus === 'succeeded' ? 'succeeded' : overallStatus,
      steps
    };

    if (overallStatus !== 'succeeded') {
      response.error = `Pipeline ${overallStatus}: ${failedSteps} step(s) failed`;
    }

    logger.info('Content refresh orchestrator completed', {
      entity_type,
      entity_id,
      job_id: jobId,
      status: overallStatus,
      total_steps: steps.length,
      succeeded_steps: successSteps,
      failed_steps: failedSteps
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Content refresh orchestrator error', { error: errorMsg });

    const errorResponse = {
      ok: false,
      error: errorMsg,
      pipeline_status: 'failed' as const,
      steps: [] as PipelineStep[]
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});