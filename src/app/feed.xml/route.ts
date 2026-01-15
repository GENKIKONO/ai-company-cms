/**
 * RSS 2.0 フィード生成 - 全記事
 * REQ-AIO-04: 公開フィード & 変化検出
 * 修正: 実DBスキーマ厳密準拠
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateRss, PostWithOrg } from '@/lib/feed/rss-generator';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aiohub.jp';
    
    // 1. 実DBスキーマ準拠のクエリ（LEFT JOINで組織情報も取得）
    const { data: rawData, error: queryError } = await supabase
      .rpc('get_posts_with_orgs', {})
      .limit(50);

    // RPCが使えない場合のフォールバック
    let postsWithOrgs: PostWithOrg[] = [];
    if (queryError || !rawData) {
      // フォールバック: 個別取得（組織情報埋め込み）
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id, title, slug, content_html, 
          published_at, created_at, organization_id,
          organizations!posts_org_fk(name, slug, url)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) {
        logger.error('RSS_ERROR', { data: { message: postsError.message } });
        return generateEmptyRssFeed(baseUrl, request);
      }

      // データ変換（組織情報埋め込み済み）
      postsWithOrgs = (posts || []).map(post => {
        // organizationsは配列またはオブジェクトの可能性があるため安全に処理
        const org = Array.isArray(post.organizations) 
          ? post.organizations[0] 
          : post.organizations || null;
        return {
          id: post.id,
          title: post.title ?? '',
          slug: post.slug ?? '',
          content: post.content_html ?? '',
          pub_date: post.published_at ?? post.created_at ?? '',
          org_slug: org?.slug ?? null,
          org_name: org?.name ?? null,
          org_url: org?.url ?? null
        };
      });
    } else {
      postsWithOrgs = rawData;
    }

    // 2. RSS 2.0 フィード生成（実DBスキーマ基準）
    const rssXml = generateRss({
      title: 'AIOHub - 最新記事',
      description: 'ビジネス向け最新記事とソリューション情報',
      link: baseUrl,
      language: 'ja',
      posts: postsWithOrgs,
      baseUrl
    });

    // 3. ETag計算（最新記事の日時から）
    const latestUpdate = postsWithOrgs[0]?.pub_date || new Date().toISOString();
    const etag = `"${Buffer.from(latestUpdate).toString('base64')}"`;
    
    // 4. If-None-Match ヘッダーチェック
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'ETag': etag,
        'X-Content-Type-Options': 'nosniff'
      }
    });

  } catch (error: any) {
    logger.error('RSS_ERROR', { data: { message: error?.message ?? 'Unknown error' } });
    return generateEmptyRssFeed(
      process.env.NEXT_PUBLIC_SITE_URL || 'https://aiohub.jp', 
      request
    );
  }
}

/**
 * 空のRSSフィードを生成（エラー時のフォールバック）
 */
function generateEmptyRssFeed(baseUrl: string, request: NextRequest): NextResponse {
  const emptyRssXml = generateRss({
    title: 'AIOHub - 最新記事',
    description: 'ビジネス向け最新記事とソリューション情報',
    link: baseUrl,
    language: 'ja',
    posts: [],
    baseUrl
  });

  const etag = `"${Buffer.from(new Date().toISOString()).toString('base64')}"`;
  
  const ifNoneMatch = request.headers.get('if-none-match');
  if (ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304 });
  }

  return new NextResponse(emptyRssXml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60',
      'ETag': etag,
      'X-Content-Type-Options': 'nosniff'
    }
  });
}