/**
 * 動的 robots.txt API (K1)
 * 環境に応じたクローラー制御設定
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateRobotsTxt } from '@/lib/utils/sitemap-generator';
import { setCacheHeaders, STATIC_ASSET_CACHE } from '@/lib/utils/cache-strategy';

export async function GET(request: NextRequest) {
  try {
    // robots.txt 生成
    const robotsTxt = generateRobotsTxt();

    // レスポンスヘッダー設定
    const headers = new Headers();
    headers.set('Content-Type', 'text/plain; charset=utf-8');
    
    // 長期キャッシュ設定（robots.txtは頻繁に変更されない）
    setCacheHeaders(headers, {
      ...STATIC_ASSET_CACHE,
      maxAge: 86400, // 1日
      sMaxAge: 86400, // CDNでも1日
    });

    // ETag生成
    const { generateETag } = await import('@/lib/utils/cache-strategy');
    const etag = generateETag(robotsTxt);
    headers.set('ETag', etag);

    // 条件付きレスポンスチェック
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers });
    }

    return new NextResponse(robotsTxt, { headers });

  } catch (error) {
    console.error('robots.txt generation failed:', error);
    
    // フォールバック robots.txt
    const fallbackRobots = `User-agent: *
Disallow: /api/
Disallow: /ops/
Disallow: /auth/
Disallow: /dashboard/
Disallow: /my/

Sitemap: ${process.env.NEXT_PUBLIC_APP_URL || 'https://aiohub.jp'}/sitemap.xml`;

    const headers = new Headers();
    headers.set('Content-Type', 'text/plain; charset=utf-8');
    
    return new NextResponse(fallbackRobots, { headers });
  }
}

// 静的最適化を無効化（動的生成のため）
export const dynamic = 'force-dynamic';