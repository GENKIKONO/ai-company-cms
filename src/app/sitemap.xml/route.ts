/**
 * 動的サイトマップAPI (K1)
 * 組織・サービス・投稿等の動的コンテンツから自動生成
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateFullSitemap } from '@/lib/utils/sitemap-generator';
import { setCacheHeaders, PUBLIC_CONTENT_CACHE } from '@/lib/utils/cache-strategy';

export async function GET(request: NextRequest) {
  try {
    // サイトマップ生成
    const sitemap = await generateFullSitemap();

    // レスポンスヘッダー設定
    const headers = new Headers();
    headers.set('Content-Type', 'application/xml; charset=utf-8');
    
    // キャッシュ設定（公開コンテンツとして1時間キャッシュ）
    setCacheHeaders(headers, {
      ...PUBLIC_CONTENT_CACHE,
      maxAge: 3600, // 1時間
      sMaxAge: 1800, // CDNで30分
    });

    // ETag生成
    const { generateETag } = await import('@/lib/utils/cache-strategy');
    const etag = generateETag(sitemap);
    headers.set('ETag', etag);

    // 条件付きレスポンスチェック
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers });
    }

    return new NextResponse(sitemap, { headers });

  } catch (error) {
    console.error('Sitemap generation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to generate sitemap'
      },
      { status: 500 }
    );
  }
}

// 静的最適化を無効化（動的コンテンツのため）
export const dynamic = 'force-dynamic';