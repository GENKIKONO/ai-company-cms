/**
 * On-demand ISR Revalidation API
 * Supabase cache-purge integration compatible
 * 
 * Expected format (from Supabase):
 * - Authorization: Bearer {REVALIDATE_TOKEN}
 * - Body: { scope: 'url' | 'prefix' | 'all', paths: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { logger } from '@/lib/log';
import { getAllPublicPaths } from '@/lib/cache/public-data-cache';

export async function POST(request: NextRequest) {
  try {
    // セキュリティ: Authorization Bearer Token の確認
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.REVALIDATE_TOKEN;
    
    if (!expectedToken) {
      logger.warn('[Revalidate API] REVALIDATE_TOKEN is not set; returning 503 for safety.');
      return NextResponse.json(
        { 
          ok: false,
          message: 'revalidate disabled' 
        },
        { status: 503 }
      );
    }
    
    // Bearer Token 形式のチェック
    const bearerToken = authHeader?.replace('Bearer ', '');
    if (!bearerToken || bearerToken !== expectedToken) {
      logger.error('[Revalidate API] Invalid or missing Bearer token');
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Invalid revalidation token' 
        },
        { status: 401 }
      );
    }

    // Supabase仕様のJSONボディ解析
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      // 後方互換性: 既存のクエリパラメータ形式もサポート
      const { searchParams } = new URL(request.url);
      const legacyPath = searchParams.get('path');
      if (legacyPath) {
        requestBody = { scope: 'url', paths: [legacyPath] };
      } else {
        logger.error('[Revalidate API] Invalid JSON body');
        return NextResponse.json(
          { 
            error: 'Bad Request',
            message: 'Request body must be valid JSON with scope and paths' 
          },
          { status: 400 }
        );
      }
    }

    const { scope, paths, tags } = requestBody;

    // リクエスト形式の検証
    if (!scope || !['url', 'prefix', 'all', 'tag'].includes(scope)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'scope must be one of: url, prefix, all, tag'
        },
        { status: 400 }
      );
    }

    if (scope === 'tag' && (!Array.isArray(tags) || tags.length === 0)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'tags array is required for tag scope'
        },
        { status: 400 }
      );
    }

    if (['url', 'prefix'].includes(scope) && (!Array.isArray(paths) || paths.length === 0)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'paths array is required for url and prefix scopes'
        },
        { status: 400 }
      );
    }

    // スコープ別の処理実行
    const results = [];
    const processedPaths = [];

    try {
      switch (scope) {
        case 'url':
          // URL単位: 指定されたパスを個別に再検証
          for (const path of paths) {
            const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
            
            if (isAllowedPath(sanitizedPath)) {
              logger.debug(`[Revalidate API] URL revalidating: ${sanitizedPath}`);
              revalidatePath(sanitizedPath);
              processedPaths.push(sanitizedPath);
              results.push({ path: sanitizedPath, status: 'success' });
            } else {
              logger.warn(`[Revalidate API] Unauthorized path skipped: ${sanitizedPath}`);
              results.push({ path: sanitizedPath, status: 'skipped', reason: 'unauthorized' });
            }
          }
          break;

        case 'prefix':
          // Prefix単位: 指定されたプレフィックス配下のパス群を再検証
          for (const prefix of paths) {
            const sanitizedPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`;
            
            if (isAllowedPath(sanitizedPrefix)) {
              logger.debug(`[Revalidate API] Prefix revalidating: ${sanitizedPrefix}`);
              
              // プレフィックス配下の既知パスを取得して個別再検証
              const matchingPaths = await getPathsByPrefix(sanitizedPrefix);
              for (const matchingPath of matchingPaths) {
                revalidatePath(matchingPath);
                processedPaths.push(matchingPath);
              }
              
              // プレフィックス自体も再検証
              revalidatePath(sanitizedPrefix);
              processedPaths.push(sanitizedPrefix);
              
              results.push({ 
                prefix: sanitizedPrefix, 
                status: 'success', 
                affected_paths: matchingPaths.length + 1 
              });
            } else {
              logger.warn(`[Revalidate API] Unauthorized prefix skipped: ${sanitizedPrefix}`);
              results.push({ prefix: sanitizedPrefix, status: 'skipped', reason: 'unauthorized' });
            }
          }
          break;

        case 'tag':
          // タグベース: 指定されたタグのキャッシュを無効化
          for (const tag of tags) {
            // タグ名の検証（org-public, org:slug, org:slug:content_type のみ許可）
            if (isAllowedTag(tag)) {
              logger.debug(`[Revalidate API] Tag revalidating: ${tag}`);
              revalidateTag(tag);
              results.push({ tag, status: 'success' });
            } else {
              logger.warn(`[Revalidate API] Unauthorized tag skipped: ${tag}`);
              results.push({ tag, status: 'skipped', reason: 'unauthorized' });
            }
          }
          break;

        case 'all':
          // 全体: 公開サイト全体を再検証
          logger.debug('[Revalidate API] Full site revalidation');

          // 主要な公開パスを再検証
          const allPublicPaths = await getAllPublicPaths();
          for (const path of allPublicPaths) {
            revalidatePath(path);
            processedPaths.push(path);
          }

          // ルートパスも再検証
          revalidatePath('/');
          processedPaths.push('/');

          // 公開関連のタグも無効化
          revalidateTag('public-content');
          revalidateTag('organization-content');
          revalidateTag('org-public');

          results.push({
            scope: 'all',
            status: 'success',
            affected_paths: processedPaths.length
          });
          break;
      }

      logger.info(`[Revalidate API] ${scope} revalidation completed`, {
        scope,
        paths_requested: paths?.length || 0,
        paths_processed: processedPaths.length
      });
      
      return NextResponse.json(
        { 
          success: true,
          message: `Successfully revalidated ${scope} scope`,
          scope,
          results,
          processed_paths_count: processedPaths.length,
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
      
    } catch (revalidateError) {
      logger.error('[Revalidate API] Revalidation failed:', { 
        data: revalidateError,
        scope,
        paths: paths?.slice(0, 5) // ログに最初の5パスのみ記録
      });
      
      return NextResponse.json(
        { 
          error: 'Revalidation Failed',
          message: `Failed to revalidate ${scope} scope`,
          details: revalidateError instanceof Error ? revalidateError.message : 'Unknown error',
          scope,
          partial_results: results
        },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('[Revalidate API] Unexpected error', { 
      data: error instanceof Error ? error : new Error(String(error)) 
    });
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during revalidation'
      },
      { status: 500 }
    );
  }
}

/**
 * Helper: タグの許可チェック
 * 許可パターン: org-public, org:{slug}, org:{slug}:{content_type}
 */
function isAllowedTag(tag: string): boolean {
  // 全組織タグ
  if (tag === 'org-public') return true;

  // 組織単位タグ: org:{slug} or org:{slug}:{content_type}
  if (tag.startsWith('org:')) {
    const parts = tag.split(':');
    // org:{slug} (2 parts) or org:{slug}:{content_type} (3 parts)
    if (parts.length === 2 || parts.length === 3) {
      const contentTypes = ['services', 'posts', 'faqs', 'case_studies', 'qa_entries'];
      if (parts.length === 3 && !contentTypes.includes(parts[2])) {
        return false;
      }
      return true;
    }
  }

  return false;
}

/**
 * Helper: パスの許可チェック
 */
function isAllowedPath(path: string): boolean {
  const allowedPrefixes = [
    '/',           // ルート
    '/aio',        // AIOHub page
    '/o/',         // 組織ページ: /o/{slug}
    '/hearing-service',
    '/about',      // 静的ページ
    '/features',
    '/pricing', 
    '/contact',
    '/privacy',
    '/terms',
    '/security'
  ];
  
  return allowedPrefixes.some(prefix => path.startsWith(prefix));
}

/**
 * Helper: プレフィックス配下のパス取得
 */
async function getPathsByPrefix(prefix: string): Promise<string[]> {
  // 既知のパスパターンを生成
  const knownPaths: string[] = [];
  
  if (prefix.startsWith('/o/')) {
    // 組織ページの既知パス
    const orgSlug = prefix.split('/')[2];
    if (orgSlug) {
      knownPaths.push(
        `/o/${orgSlug}`,
        `/o/${orgSlug}/services`,
        `/o/${orgSlug}/blog`, 
        `/o/${orgSlug}/case-studies`,
        `/o/${orgSlug}/faqs`,
        `/o/${orgSlug}/news`,
        `/o/${orgSlug}/products`
      );
      
      // 日本語パスも追加
      knownPaths.push(
        `/o/${orgSlug}/ja/services`,
        `/o/${orgSlug}/ja/blog`,
        `/o/${orgSlug}/ja/case-studies`, 
        `/o/${orgSlug}/ja/faqs`,
        `/o/${orgSlug}/ja/news`,
        `/o/${orgSlug}/ja/products`
      );
    }
  }
  
  return knownPaths;
}

// GET メソッドは情報提供のみ（Supabase連携対応）
export async function GET() {
  return NextResponse.json(
    {
      info: 'On-demand ISR Revalidation API (Supabase Compatible)',
      usage: {
        method: 'POST',
        headers: {
          authorization: 'Bearer <REVALIDATE_TOKEN>'
        },
        body: {
          scope: 'url | prefix | all | tag',
          paths: ['array of paths (for url/prefix scope)'],
          tags: ['array of tags (for tag scope)']
        }
      },
      legacy_usage: 'POST /api/revalidate?path=/your-path (deprecated)',
      scopes: {
        url: 'Revalidate specific URLs',
        prefix: 'Revalidate all paths under given prefixes',
        tag: 'Revalidate by cache tags (recommended for org content)',
        all: 'Revalidate entire public site'
      },
      allowed_tags: {
        pattern: 'org-public | org:{slug} | org:{slug}:{content_type}',
        content_types: ['services', 'posts', 'faqs', 'case_studies', 'qa_entries'],
        examples: ['org-public', 'org:luxucare', 'org:luxucare:services']
      },
      allowed_prefixes: [
        '/',
        '/aio',
        '/o/{slug}',
        '/hearing-service',
        '/about',
        '/features',
        '/pricing',
        '/contact',
        '/privacy',
        '/terms',
        '/security'
      ],
      supabase_integration: {
        edge_function: '/cache-purge/drain',
        queue_table: 'cache_invalidation_queue',
        url_format: '/o/{org_slug}{lang_segment}{base_path}/{slug}'
      }
    },
    { status: 200 }
  );
}