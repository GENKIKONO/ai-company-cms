/**
 * Cache Purge Edge Function
 * P4-8: CDN キャッシュ無効化機能
 * 
 * 機能:
 * 1. エンティティ更新時のCDNキャッシュpurge
 * 2. URL生成とCloudflare/CloudFront APIの呼び出し
 * 3. 言語別・エンティティ別のURL管理
 * 4. 失敗時のリトライとログ記録
 */

import { createServiceRoleClient } from '../_shared/supabase.ts';
import { createEdgeLogger } from '../_shared/logging.ts';
import { beginRun, completeSuccess, completeFailure, type JobMeta } from '../_shared/job-runs.ts';
import { corsHeaders } from '../_shared/cors.ts';

// TypeScript インタフェース定義
interface CachePurgeRequest {
  entity_type: 'post' | 'service' | 'faq' | 'news' | 'case_study';
  entity_id: string;
  entity_slug?: string;
  organization_slug?: string;
  target_languages: string[];
  purge_options?: {
    include_feeds?: boolean;
    include_sitemaps?: boolean;
    include_api_endpoints?: boolean;
  };
}

interface CachePurgeResponse {
  success: boolean;
  job_id?: string;
  purged_urls: string[];
  failed_urls: string[];
  cdn_responses: Array<{
    url: string;
    status: 'purged' | 'failed';
    response_code?: number;
    error_message?: string;
  }>;
  total_purged: number;
  total_failed: number;
}

// URL生成ヘルパー
interface UrlGenerationContext {
  entity_type: string;
  entity_id: string;
  entity_slug?: string;
  organization_slug?: string;
  language: string;
  base_domain: string;
}

/**
 * エンティティタイプ別URL生成
 */
function generateEntityUrls(context: UrlGenerationContext): string[] {
  const { entity_type, entity_slug, organization_slug, language, base_domain } = context;
  const urls: string[] = [];
  
  // 基本パス構築
  const langPrefix = language === 'ja' ? '' : `/${language}`;
  const basePath = `${base_domain}${langPrefix}`;
  
  switch (entity_type) {
    case 'post':
      if (entity_slug) {
        urls.push(`${basePath}/posts/${entity_slug}`);
        urls.push(`${basePath}/articles/${entity_slug}`); // 別名対応
      }
      urls.push(`${basePath}/posts`); // 一覧ページ
      break;
      
    case 'service':
      if (entity_slug && organization_slug) {
        urls.push(`${basePath}/organizations/${organization_slug}/services/${entity_slug}`);
        urls.push(`${basePath}/services/${entity_slug}`); // 直接アクセス
      }
      urls.push(`${basePath}/services`); // 一覧ページ
      break;
      
    case 'faq':
      if (organization_slug) {
        urls.push(`${basePath}/organizations/${organization_slug}/faqs`);
      }
      urls.push(`${basePath}/faqs`);
      break;
      
    case 'news':
      if (entity_slug) {
        urls.push(`${basePath}/news/${entity_slug}`);
      }
      urls.push(`${basePath}/news`);
      break;
      
    case 'case_study':
      if (entity_slug && organization_slug) {
        urls.push(`${basePath}/organizations/${organization_slug}/case-studies/${entity_slug}`);
        urls.push(`${basePath}/case-studies/${entity_slug}`);
      }
      urls.push(`${basePath}/case-studies`);
      break;
  }
  
  // 組織関連ページ
  if (organization_slug) {
    urls.push(`${basePath}/organizations/${organization_slug}`);
  }
  
  return urls.filter((url, index, arr) => arr.indexOf(url) === index); // 重複除去
}

/**
 * 関連URL生成（フィード、サイトマップ等）
 */
function generateAdditionalUrls(
  context: UrlGenerationContext,
  options: { include_feeds?: boolean; include_sitemaps?: boolean; include_api_endpoints?: boolean } = {}
): string[] {
  const urls: string[] = [];
  const { language, base_domain } = context;
  const langPrefix = language === 'ja' ? '' : `/${language}`;
  
  if (options.include_feeds) {
    urls.push(`${base_domain}${langPrefix}/feeds/rss.xml`);
    urls.push(`${base_domain}${langPrefix}/feeds/atom.xml`);
  }
  
  if (options.include_sitemaps) {
    urls.push(`${base_domain}/sitemap.xml`);
    urls.push(`${base_domain}/sitemap-${language}.xml`);
  }
  
  if (options.include_api_endpoints) {
    // 公開API向けの JSON endpoints
    urls.push(`${base_domain}/api/public/${context.entity_type}s`);
    if (context.entity_id) {
      urls.push(`${base_domain}/api/public/${context.entity_type}s/${context.entity_id}`);
    }
  }
  
  return urls;
}

/**
 * CDN purge API呼び出し (Cloudflare想定)
 */
async function purgeCdnUrls(
  urls: string[],
  logger: ReturnType<typeof createEdgeLogger>
): Promise<Array<{ url: string; status: 'purged' | 'failed'; response_code?: number; error_message?: string }>> {
  const results = [];
  const cdnApiKey = Deno.env.get('CLOUDFLARE_API_KEY');
  const cdnZoneId = Deno.env.get('CLOUDFLARE_ZONE_ID');
  
  if (!cdnApiKey || !cdnZoneId) {
    logger.warn('CDN API credentials not configured, simulating purge success');
    
    // 開発環境ではシミュレーション
    return urls.map(url => ({
      url,
      status: 'purged' as const,
      response_code: 200
    }));
  }
  
  try {
    // Cloudflare Purge API
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${cdnZoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cdnApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: urls
      })
    });
    
    const responseData = await response.json();
    
    if (response.ok && responseData.success) {
      // 全URL成功
      results.push(...urls.map(url => ({
        url,
        status: 'purged' as const,
        response_code: response.status
      })));
      
      logger.info('CDN purge successful', {
        purged_count: urls.length,
        urls: urls.slice(0, 5) // ログには最初の5件のみ記録
      });
    } else {
      // API レベルでの失敗
      const errorMsg = responseData.errors?.[0]?.message || 'CDN API error';
      results.push(...urls.map(url => ({
        url,
        status: 'failed' as const,
        response_code: response.status,
        error_message: errorMsg
      })));
      
      logger.error('CDN purge API failed', {
        status: response.status,
        error: errorMsg,
        urls_count: urls.length
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown CDN error';
    results.push(...urls.map(url => ({
      url,
      status: 'failed' as const,
      error_message: errorMsg
    })));
    
    logger.error('CDN purge exception', {
      error: errorMsg,
      urls_count: urls.length
    });
  }
  
  return results;
}

/**
 * URL hash生成（idempotency用）
 */
async function generateUrlHash(urls: string[]): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(urls.sort().join('\n'));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.slice(0, 8);
}

// メインハンドラー
Deno.serve(async (req: Request): Promise<Response> => {
  const logger = createEdgeLogger(req, "cache-purge");
  
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
    let requestBody: CachePurgeRequest;
    try {
      requestBody = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // パラメータ検証
    const {
      entity_type,
      entity_id,
      entity_slug,
      organization_slug,
      target_languages,
      purge_options = {}
    } = requestBody;

    if (!entity_type || !entity_id || !target_languages?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: entity_type, entity_id, target_languages' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Cache purge started', {
      entity_type,
      entity_id,
      entity_slug,
      organization_slug,
      target_languages,
      purge_options
    });

    // ベースドメイン取得
    const baseDomain = Deno.env.get('SITE_BASE_DOMAIN') || 'https://example.com';
    
    // 全言語の対象URL生成
    let allUrls: string[] = [];
    
    for (const language of target_languages) {
      const context: UrlGenerationContext = {
        entity_type,
        entity_id,
        entity_slug,
        organization_slug,
        language,
        base_domain: baseDomain
      };
      
      // エンティティ固有URL
      const entityUrls = generateEntityUrls(context);
      allUrls.push(...entityUrls);
      
      // 追加URL（フィード等）
      const additionalUrls = generateAdditionalUrls(context, purge_options);
      allUrls.push(...additionalUrls);
    }
    
    // 重複除去
    allUrls = [...new Set(allUrls)];
    
    // idempotency_key生成
    const urlHash = await generateUrlHash(allUrls);
    const idempotencyKey = `cache-purge:${entity_type}:${entity_id}:${target_languages.join(',')}:${urlHash}`;

    // job_runs_v2記録開始
    const jobMeta: JobMeta = {
      scope: 'edge',
      runner: 'edge_function',
      input_summary: {
        entity_type,
        entity_id,
        target_languages,
        purge_options,
        urls_count: allUrls.length
      }
    };

    const beginResult = await beginRun({
      job_name: 'content-refresh/cache-purge',
      idempotency_key: idempotencyKey,
      request: req,
      meta: jobMeta
    }, logger);

    if (!beginResult.success) {
      return new Response(
        JSON.stringify({ error: 'Failed to start purge job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jobId = beginResult.record.id;

    // CDN purge実行
    const purgeResults = await purgeCdnUrls(allUrls, logger);
    
    // 結果集計
    const purgedUrls = purgeResults.filter(r => r.status === 'purged').map(r => r.url);
    const failedUrls = purgeResults.filter(r => r.status === 'failed').map(r => r.url);
    
    const overallSuccess = failedUrls.length === 0;
    
    // job_runs_v2完了記録
    const finalMeta: JobMeta = {
      ...jobMeta,
      output_summary: {
        total_urls: allUrls.length,
        purged_urls: purgedUrls.length,
        failed_urls: failedUrls.length,
        target_languages,
        entity_info: {
          entity_type,
          entity_id,
          entity_slug,
          organization_slug
        }
      },
      stats: {
        items_processed: purgedUrls.length
      }
    };

    if (overallSuccess) {
      await completeSuccess({
        job_id: jobId,
        meta: finalMeta
      }, logger);
    } else {
      await completeFailure({
        job_id: jobId,
        error_code: 'PARTIAL_PURGE_FAILURE',
        error_message: `Failed to purge ${failedUrls.length} out of ${allUrls.length} URLs`,
        meta: {
          ...finalMeta,
          error_details: {
            message_full: `Cache purge completed with ${failedUrls.length} failures`,
            context: {
              failed_urls: failedUrls.slice(0, 10), // ログには最初の10件のみ
              purge_results: purgeResults.filter(r => r.status === 'failed').slice(0, 5)
            }
          }
        }
      }, logger);
    }

    const response: CachePurgeResponse = {
      success: overallSuccess,
      job_id: jobId,
      purged_urls: purgedUrls,
      failed_urls: failedUrls,
      cdn_responses: purgeResults,
      total_purged: purgedUrls.length,
      total_failed: failedUrls.length
    };

    logger.info('Cache purge completed', {
      entity_type,
      entity_id,
      job_id: jobId,
      total_urls: allUrls.length,
      purged: purgedUrls.length,
      failed: failedUrls.length,
      success: overallSuccess
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Cache purge error', { error: errorMsg });

    const errorResponse: CachePurgeResponse = {
      success: false,
      purged_urls: [],
      failed_urls: [],
      cdn_responses: [],
      total_purged: 0,
      total_failed: 0
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});