/**
 * CDN Purge Library
 * P4-2: Supabase Edge Function連携用クライアント
 */

import 'server-only';

export interface CdnPurgeOptions {
  scope: 'url' | 'prefix' | 'all';
  paths: string[];
  immediate?: boolean; // キューをバイパスして直接実行
}

export interface CdnPurgeResult {
  success: boolean;
  message: string;
  processed_paths?: number;
  error?: string;
  timestamp: string;
}

/**
 * Vercel /api/revalidate への直接呼び出し
 * 主に内部テスト・デバッグ用
 */
export async function purgeVercelCache(options: CdnPurgeOptions): Promise<CdnPurgeResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aiohub.jp';
    const token = process.env.REVALIDATE_TOKEN;
    
    if (!token) {
      throw new Error('REVALIDATE_TOKEN not configured');
    }
    
    const response = await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scope: options.scope,
        paths: options.paths
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Revalidate failed: ${result.message || response.statusText}`);
    }
    
    return {
      success: true,
      message: result.message || 'CDN purge completed',
      processed_paths: result.processed_paths_count,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CDN Purge] Vercel revalidation failed:', error);
    
    return {
      success: false,
      message: 'CDN purge failed',
      error: errorMsg,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Supabase Edge Function 経由でキューに追加
 * 本番推奨: cache_invalidation_queue を利用
 */
export async function enqueueSupabasePurge(options: CdnPurgeOptions): Promise<CdnPurgeResult> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const endpoint = options.immediate 
      ? `${supabaseUrl}/functions/v1/cache-purge/purge`
      : `${supabaseUrl}/functions/v1/cache-purge/enqueue`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scope: options.scope,
        paths: options.paths
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Supabase purge failed: ${result.message || response.statusText}`);
    }
    
    return {
      success: true,
      message: options.immediate ? 'Immediate purge completed' : 'Purge enqueued successfully',
      processed_paths: options.paths.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CDN Purge] Supabase enqueue failed:', error);
    
    return {
      success: false,
      message: 'Supabase purge enqueue failed',
      error: errorMsg,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 統合CDNパージ関数
 * 環境に応じて適切な手法を選択
 */
export async function purgeCdn(options: CdnPurgeOptions): Promise<CdnPurgeResult> {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL_ENV;
  
  // 本番環境ではSupabase Edge Function経由を推奨
  if (isProduction && !options.immediate) {
    console.log('[CDN Purge] Using Supabase queue for production');
    return enqueueSupabasePurge(options);
  }
  
  // 開発環境またはimmediate指定時は直接Vercel
  if (isVercel) {
    console.log('[CDN Purge] Using direct Vercel revalidation');
    return purgeVercelCache(options);
  }
  
  // ローカル環境では何もしない
  console.log('[CDN Purge] Skipping CDN purge in local environment');
  return {
    success: true,
    message: 'CDN purge skipped in local environment',
    timestamp: new Date().toISOString()
  };
}

/**
 * 便利関数: 組織単位のパージ
 */
export async function purgeOrganizationCache(orgSlug: string): Promise<CdnPurgeResult> {
  return purgeCdn({
    scope: 'prefix',
    paths: [`/o/${orgSlug}`]
  });
}

/**
 * 便利関数: コンテンツ単位のパージ
 */
export async function purgeContentCache(
  orgSlug: string,
  contentType: string,
  slug?: string,
  lang?: string
): Promise<CdnPurgeResult> {
  const langSegment = (lang && lang !== 'ja') ? `/${lang}` : '';
  const basePathMap: Record<string, string> = {
    posts: '/blog',
    news: '/news',
    products: '/products',
    case_studies: '/case-studies',
    faqs: '/faqs',
    services: '/services'
  };
  
  const basePath = basePathMap[contentType] || `/${contentType}`;
  
  if (slug) {
    // 個別コンテンツページ
    const contentUrl = `/o/${orgSlug}${langSegment}${basePath}/${slug}`;
    return purgeCdn({
      scope: 'url',
      paths: [contentUrl]
    });
  } else {
    // コンテンツ一覧ページ
    const listUrl = `/o/${orgSlug}${langSegment}${basePath}`;
    return purgeCdn({
      scope: 'prefix',
      paths: [listUrl]
    });
  }
}

/**
 * 便利関数: サイト全体パージ（緊急時用）
 */
export async function purgeEntireSite(): Promise<CdnPurgeResult> {
  console.warn('[CDN Purge] Executing full site purge - this may impact performance');
  
  return purgeCdn({
    scope: 'all',
    paths: [] // 'all' scope では paths は無視される
  });
}

/**
 * バッチパージ: 複数のコンテンツを一括処理
 */
export async function purgeBatch(items: Array<{
  orgSlug: string;
  contentType: string;
  slug?: string;
  lang?: string;
}>): Promise<CdnPurgeResult> {
  
  const paths = items.map(item => {
    const langSegment = (item.lang && item.lang !== 'ja') ? `/${item.lang}` : '';
    const basePathMap: Record<string, string> = {
      posts: '/blog',
      news: '/news',
      products: '/products',
      case_studies: '/case-studies',
      faqs: '/faqs',
      services: '/services'
    };
    
    const basePath = basePathMap[item.contentType] || `/${item.contentType}`;
    
    if (item.slug) {
      return `/o/${item.orgSlug}${langSegment}${basePath}/${item.slug}`;
    } else {
      return `/o/${item.orgSlug}${langSegment}${basePath}`;
    }
  });
  
  return purgeCdn({
    scope: 'url',
    paths
  });
}

/**
 * デバッグ情報取得
 */
export function getCdnPurgeDebugInfo() {
  return {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      has_revalidate_token: !!process.env.REVALIDATE_TOKEN,
      has_supabase_config: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      app_url: process.env.NEXT_PUBLIC_APP_URL
    },
    endpoints: {
      revalidate: '/api/revalidate',
      supabase_enqueue: '/functions/v1/cache-purge/enqueue',
      supabase_purge: '/functions/v1/cache-purge/purge',
      supabase_drain: '/functions/v1/cache-purge/drain'
    },
    timestamp: new Date().toISOString()
  };
}