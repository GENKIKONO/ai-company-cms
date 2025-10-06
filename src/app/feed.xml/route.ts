/**
 * RSS 2.0 フィード生成 - 全記事
 * REQ-AIO-04: 公開フィード & 変化検出
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { generateRss } from '@/lib/feed/rss-generator';

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 公開済み記事を最新10件取得
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        organizations:organization_id (
          name,
          slug,
          url,
          logo_url
        )
      `)
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('RSS feed error:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
    
    // RSS 2.0 フィード生成
    const rssXml = generateRss({
      title: 'LuxuCare CMS - 最新記事',
      description: 'ビジネス向け最新記事とソリューション情報',
      link: baseUrl,
      language: 'ja',
      posts: posts || [],
      baseUrl
    });

    // ETag計算（最新記事の更新日時をハッシュ化）
    const latestUpdate = posts?.[0]?.updated_at || new Date().toISOString();
    const etag = `"${Buffer.from(latestUpdate).toString('base64')}"`;
    
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
    console.error('RSS feed generation failed:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}