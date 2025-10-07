/**
 * RSS 2.0 フィード生成 - 全記事
 * REQ-AIO-04: 公開フィード & 変化検出
 * 修正: 実DBスキーマ厳密準拠
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { generateRss, PostWithOrg } from '@/lib/feed/rss-generator';

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aiohub.jp';
    
    // 1. 実DBスキーマ準拠のクエリ（LEFT JOINで組織情報も取得）
    const { data: rawData, error: queryError } = await supabase
      .rpc('get_posts_with_orgs', {})
      .limit(50);

    // RPCが使えない場合のフォールバック
    let postsWithOrgs: PostWithOrg[] = [];
    if (queryError || !rawData) {
      // フォールバック: 個別取得
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, title, slug, content_markdown, content_html, published_at, created_at, organization_id')
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) {
        console.error('RSS_ERROR', { message: postsError.message });
        return generateEmptyRssFeed(baseUrl, request);
      }

      // 組織情報取得
      const organizationIds = [...new Set(
        (posts || []).map(p => p.organization_id).filter(Boolean)
      )];
      
      let organizationsMap = new Map();
      if (organizationIds.length > 0) {
        const { data: organizations } = await supabase
          .from('organizations')
          .select('id, name, slug, url')
          .in('id', organizationIds);
        
        if (organizations) {
          organizations.forEach(org => {
            organizationsMap.set(org.id, org);
          });
        }
      }

      // データ変換
      postsWithOrgs = (posts || []).map(post => {
        const org = post.organization_id ? organizationsMap.get(post.organization_id) : null;
        return {
          id: post.id,
          title: post.title ?? '',
          slug: post.slug ?? '',
          content: post.content_markdown ?? post.content_html ?? '',
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
      title: 'LuxuCare CMS - 最新記事',
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
    console.error('RSS_ERROR', { message: error?.message ?? 'Unknown error' });
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
    title: 'LuxuCare CMS - 最新記事',
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