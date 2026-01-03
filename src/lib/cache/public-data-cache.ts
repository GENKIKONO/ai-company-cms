/**
 * Public Data Cache Library
 * P4-2: public_* × CDN キャッシュ戦略対応
 */

import 'server-only';
import { logger } from '@/lib/utils/logger';

/**
 * 公開ページの全パスリストを取得
 * ISR 'all' scope での再検証対象パスを生成
 */
export async function getAllPublicPaths(): Promise<string[]> {
  const publicPaths = [
    // ルートページ
    '/',
    
    // 静的ページ
    '/aio',
    '/hearing-service', 
    '/about',
    '/features',
    '/pricing',
    '/contact',
    '/privacy',
    '/terms',
    '/security',
    
    // 公開一覧ページ
    '/organizations',
    '/news',
    
    // APIエンドポイント（公開用）
    '/api/public/cms',
    '/api/public/organizations',
  ];

  try {
    // 動的に組織別パスを追加
    const orgPaths = await getOrganizationPublicPaths();
    publicPaths.push(...orgPaths);

  } catch (error) {
    logger.warn('[getAllPublicPaths] Failed to load org paths:', { data: error });
    // 基本パスのみで継続
  }

  return publicPaths;
}

/**
 * 組織の公開パスを生成
 * Supabase URL生成ルールに準拠: /o/{org_slug}{lang_segment}{base_path}/{slug}
 */
async function getOrganizationPublicPaths(): Promise<string[]> {
  const orgPaths: string[] = [];

  try {
    // 公開中の組織を取得（簡易版、実際は public_organizations_tbl から取得）
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 公開組織の取得
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, slug')
      .eq('published', true)
      .limit(100);

    if (orgs) {
      for (const org of orgs) {
        if (org.slug) {
          // 基本組織ページ
          orgPaths.push(`/o/${org.slug}`);
          
          // サブページ（日本語なし）
          orgPaths.push(
            `/o/${org.slug}/services`,
            `/o/${org.slug}/blog`,
            `/o/${org.slug}/case-studies`,
            `/o/${org.slug}/faqs`,
            `/o/${org.slug}/news`,
            `/o/${org.slug}/products`
          );
          
          // 日本語版（lang_segment省略ルールに準拠）
          // 注意: 'ja' の場合は lang_segment を省略
        }
      }
    }

  } catch (error) {
    logger.warn('[getOrganizationPublicPaths] Database error:', { data: error });
  }

  return orgPaths;
}

/**
 * キャッシュタグ管理
 * revalidateTag で使用するタグ一覧
 */
export const CACHE_TAGS = {
  PUBLIC_CONTENT: 'public-content',
  ORGANIZATION_CONTENT: 'organization-content',
  POSTS: 'posts',
  SERVICES: 'services', 
  CASE_STUDIES: 'case-studies',
  FAQS: 'faqs',
  NEWS: 'news',
  PRODUCTS: 'products'
} as const;

/**
 * 組織別のキャッシュタグ生成
 */
export function getOrgCacheTag(orgId: string): string {
  return `org-${orgId}`;
}

/**
 * コンテンツタイプ別のキャッシュタグ生成
 */
export function getContentCacheTag(contentType: string, orgId?: string): string {
  const baseTag = CACHE_TAGS[contentType.toUpperCase() as keyof typeof CACHE_TAGS] || contentType;
  return orgId ? `${baseTag}-${orgId}` : baseTag;
}

/**
 * キャッシュ設定の推奨値
 * P4-2 方針: revalidate 300-900秒
 */
export const CACHE_CONFIG = {
  // ISR revalidate値（秒）
  REVALIDATE: {
    HOMEPAGE: 300,        // 5分
    ORGANIZATION: 600,    // 10分 
    CONTENT_LIST: 600,    // 10分
    CONTENT_DETAIL: 900,  // 15分
    STATIC_PAGE: 1800,    // 30分
  },
  
  // HTTP Cache-Control
  HTTP_CACHE: {
    STATIC_ASSETS: 'public, max-age=31536000, immutable', // 1年
    API_PUBLIC: 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
    JSON_LD: 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400',
    HTML_PUBLIC: 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600', // P4-2: public pages
    HTML_STATIC: 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400', // P4-2: static pages
    DYNAMIC: 'no-store, must-revalidate',
  }
} as const;

/**
 * URL正規化
 * Supabase build_public_url 関数と整合性を保つ
 */
export function normalizePublicUrl(
  table: string,
  orgSlug: string, 
  lang?: string | null,
  slug?: string
): string {
  // lang_segmentルール: null または 'ja' の場合は省略
  const langSegment = (lang && lang !== 'ja') ? `/${lang}` : '';
  
  // base_pathマッピング
  const basePathMap: Record<string, string> = {
    posts: '/blog',
    news: '/news', 
    products: '/products',
    case_studies: '/case-studies',
    faqs: '/faqs',
    services: '/services'
  };
  
  const basePath = basePathMap[table] || `/${table}`;
  
  if (slug) {
    return `/o/${orgSlug}${langSegment}${basePath}/${slug}`;
  } else {
    return `/o/${orgSlug}${langSegment}${basePath}`;
  }
}

/**
 * パス階層分析
 * prefix revalidation の対象パス判定用
 */
export function analyzePathHierarchy(path: string): {
  isOrgPath: boolean;
  orgSlug?: string;
  contentType?: string;
  lang?: string;
  slug?: string;
} {
  const segments = path.split('/').filter(Boolean);
  
  if (segments[0] !== 'o') {
    return { isOrgPath: false };
  }
  
  const orgSlug = segments[1];
  if (!orgSlug) {
    return { isOrgPath: false };
  }
  
  // 言語セグメント判定
  const possibleLang = segments[2];
  const isLangSegment = possibleLang && possibleLang.length === 2;
  
  const contentTypeIndex = isLangSegment ? 3 : 2;
  const contentType = segments[contentTypeIndex];
  
  const slugIndex = contentTypeIndex + 1;
  const slug = segments[slugIndex];
  
  return {
    isOrgPath: true,
    orgSlug,
    contentType,
    lang: isLangSegment ? possibleLang : undefined,
    slug
  };
}

/**
 * P4-2: Cache-Control ヘッダー適用
 * 公開ページに適切なキャッシュヘッダーを設定
 */
export function applyCacheHeaders(headers: Headers, cacheType: 'public' | 'static'): void {
  if (process.env.NODE_ENV === 'production') {
    const cacheControl = cacheType === 'static' 
      ? CACHE_CONFIG.HTTP_CACHE.HTML_STATIC
      : CACHE_CONFIG.HTTP_CACHE.HTML_PUBLIC;
    
    headers.set('Cache-Control', cacheControl);
    headers.set('Vary', 'Accept-Encoding, User-Agent');
  }
}

/**
 * 開発・デバッグ用: キャッシュ統計情報
 */
export function getCacheDebugInfo() {
  return {
    config: CACHE_CONFIG,
    tags: CACHE_TAGS,
    timestamp: new Date().toISOString(),
    env: {
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV
    }
  };
}