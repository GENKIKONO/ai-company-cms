/**
 * RSS 2.0 フィード生成 - 企業別記事
 * REQ-AIO-04: 企業スコープフィード
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateRss } from '@/lib/feed/rss-generator';
import { logger } from '@/lib/utils/logger';

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const supabase = await createClient();
    
    // 企業情報を取得（VIEW経由 - SST強制）
    const { data: organization, error: orgError } = await supabase
      .from('v_organizations_public')
      .select('id, name, slug, description, website_url, logo_url, created_at, updated_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (orgError || !organization) {
      return new NextResponse('Organization not found', { status: 404 });
    }

    // 企業の公開済み記事を最新10件取得（VIEW経由 - SST強制）
    // 🔒 select('*') ではなく必要カラムのみ取得（セキュリティ）
    const { data: posts, error: postsError } = await supabase
      .from('v_posts_public')
      .select(`
        id,
        title,
        slug,
        content_markdown,
        content_html,
        status,
        published_at,
        created_at,
        updated_at
      `)
      .eq('organization_id', organization.id)
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(10);

    if (postsError) {
      logger.error('Organization RSS feed error:', { data: postsError });
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
    const orgUrl = `${baseUrl}/o/${slug}`;

    // PostWithOrg形式に変換（generateRssの期待する型）
    const postsWithOrg = (posts || []).map(post => ({
      id: post.id,
      title: post.title || '',
      slug: post.slug || '',
      content: post.content_html || post.content_markdown || '',
      pub_date: post.published_at || '',
      org_slug: organization.slug,
      org_name: organization.name,
      org_url: organization.website_url || null,
    }));

    // RSS 2.0 フィード生成
    const rssXml = generateRss({
      title: `${organization.name} - 最新記事`,
      description: organization.description || `${organization.name}の最新記事とお知らせ`,
      link: orgUrl,
      language: 'ja',
      posts: postsWithOrg,
      baseUrl,
      organizationSlug: slug
    });

    // ETag計算
    const latestUpdate = posts?.[0]?.updated_at || organization.updated_at;
    const etag = `"${Buffer.from(`${slug}-${latestUpdate}`).toString('base64')}"`;
    
    // If-None-Match ヘッダーチェック
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300', // 5分キャッシュ
        'ETag': etag,
        'X-Content-Type-Options': 'nosniff'
      }
    });

  } catch (error) {
    logger.error('Organization RSS feed generation failed', { data: error instanceof Error ? error : new Error(String(error)) });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}