/**
 * 外部サイト埋め込み用iframe HTML生成API
 * GET /api/public/embed/[slug]/iframe
 * 
 * 機能:
 * - セキュアなiframe用HTML生成
 * - レスポンシブ対応
 * - JSON-LD構造化データ含有
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateOrganizationJsonLd } from '@/lib/json-ld';
import { generateIframeHtml } from '@/lib/embed/html-template';

export const dynamic = 'force-dynamic';

interface IframeOptions {
  width?: string;
  height?: string;
  theme?: 'light' | 'dark' | 'auto';
  showHeader?: boolean;
  showFooter?: boolean;
  responsive?: boolean;
}

async function getOrganizationData(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/public/organizations/${slug}`, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'LuxuCare-Iframe-Bot/1.0'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to fetch organization data for iframe:', error);
    return null;
  }
}

function sanitizeIframeOptions(params: URLSearchParams): IframeOptions {
  const options: IframeOptions = {};
  
  // 幅・高さ（CSS値として安全な文字のみ）
  const width = params.get('width');
  if (width && /^[\d]+(px|%|em|rem|vw)?$/.test(width)) {
    options.width = width;
  }
  
  const height = params.get('height');
  if (height && /^[\d]+(px|%|em|rem|vh)?$/.test(height)) {
    options.height = height;
  }
  
  // テーマ
  const theme = params.get('theme');
  if (theme && ['light', 'dark', 'auto'].includes(theme)) {
    options.theme = theme as IframeOptions['theme'];
  }
  
  // 表示オプション
  options.showHeader = params.get('showHeader') !== 'false';
  options.showFooter = params.get('showFooter') !== 'false';
  options.responsive = params.get('responsive') !== 'false';
  
  return options;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    
    // 組織データ取得
    const data = await getOrganizationData(resolvedParams.slug);
    
    if (!data || !data.organization) {
      const notFoundHtml = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>企業情報が見つかりません</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .error { background: white; padding: 24px; border-radius: 8px; border-left: 4px solid #f44336; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .error h2 { margin: 0 0 8px 0; color: #d32f2f; font-size: 18px; }
        .error p { margin: 0; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="error">
        <h2>企業情報が見つかりません</h2>
        <p>指定された企業「${resolvedParams.slug}」の情報は存在しないか、非公開に設定されています。</p>
    </div>
</body>
</html>`;

      return new NextResponse(notFoundHtml, {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300', // 5分キャッシュ
          'X-Frame-Options': 'ALLOWALL', // iframe許可
          'Content-Security-Policy': "default-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:",
        }
      });
    }

    const { organization, services, posts, case_studies, faqs } = data;
    
    // オプションのサニタイズ
    const options = sanitizeIframeOptions(searchParams);
    
    // JSON-LD生成
    const jsonLd = generateOrganizationJsonLd(organization);
    
    // iframe用HTML生成
    const iframeHtml = generateIframeHtml({
      organization,
      services,
      posts,
      case_studies,
      faqs,
      jsonLd,
      options,
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    });
    
    return new NextResponse(iframeHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // キャッシュ設定: 30分
        'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600',
        // iframe許可
        'X-Frame-Options': 'ALLOWALL',
        // セキュリティ設定
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' https:",
          "connect-src 'self' https:",
          "frame-ancestors *" // 任意のサイトからのiframe埋め込み許可
        ].join('; '),
        'X-Content-Type-Options': 'nosniff',
        // CORS設定
        'Access-Control-Allow-Origin': 'https://aiohub.jp',
        'Access-Control-Allow-Methods': 'GET',
        // カスタムヘッダー
        'X-LuxuCare-Iframe-Version': '1.0.0',
        'X-LuxuCare-Organization': organization.slug,
        'X-LuxuCare-Content-Type': 'iframe-embed',
      }
    });

  } catch (error) {
    console.error('Iframe generation error:', error);
    
    const errorHtml = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>読み込みエラー</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 20px; background: #ffebee; }
        .error { background: white; padding: 20px; border-radius: 6px; border: 1px solid #f44336; }
        .error h2 { color: #c62828; margin: 0 0 10px 0; }
        .error p { color: #666; margin: 0; }
    </style>
</head>
<body>
    <div class="error">
        <h2>読み込みエラー</h2>
        <p>企業情報の読み込み中にエラーが発生しました。しばらく後に再度お試しください。</p>
    </div>
    <script>
        console.error('LuxuCare Iframe Error:', ${JSON.stringify(error.message)});
    </script>
</body>
</html>`;

    return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Frame-Options': 'ALLOWALL',
      }
    });
  }
}

// OPTIONS request support (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://aiohub.jp',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
      'Access-Control-Max-Age': '86400',
    }
  });
}