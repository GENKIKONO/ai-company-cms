/**
 * 外部サイト埋め込み用JavaScript Widget生成API
 * GET /api/public/embed/widget/[slug]
 * 
 * 機能:
 * - JSON-LD + HTML構造を組み合わせたWidget出力
 * - XSS防止のサニタイズ処理
 * - CORS制御とキャッシュ最適化
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateOrganizationJsonLd } from '@/lib/json-ld';
import { generateEmbedWidget } from '@/lib/embed/generator';

export const dynamic = 'force-dynamic';

interface WidgetOptions {
  theme?: 'light' | 'dark' | 'auto';
  size?: 'small' | 'medium' | 'large';
  showLogo?: boolean;
  showDescription?: boolean;
  showServices?: boolean;
  customCSS?: string;
}

async function getOrganizationData(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/public/organizations/${slug}`, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'LuxuCare-Embed-Bot/1.0'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to fetch organization data for embed:', error);
    return null;
  }
}

function sanitizeOptions(params: URLSearchParams): WidgetOptions {
  const options: WidgetOptions = {};
  
  // テーマ設定（安全な値のみ許可）
  const theme = params.get('theme');
  if (theme && ['light', 'dark', 'auto'].includes(theme)) {
    options.theme = theme as WidgetOptions['theme'];
  }
  
  // サイズ設定
  const size = params.get('size');
  if (size && ['small', 'medium', 'large'].includes(size)) {
    options.size = size as WidgetOptions['size'];
  }
  
  // 表示オプション（boolean）
  options.showLogo = params.get('showLogo') !== 'false';
  options.showDescription = params.get('showDescription') !== 'false';
  options.showServices = params.get('showServices') === 'true';
  
  // カスタムCSS（XSS対策: 基本的な文字のみ許可）
  const customCSS = params.get('customCSS');
  if (customCSS) {
    // 危険な文字を除去（script, javascript:, data: など）
    const safeCSSPattern = /^[a-zA-Z0-9\s\-_:;.,#()%]+$/;
    if (safeCSSPattern.test(customCSS) && customCSS.length < 1000) {
      options.customCSS = customCSS;
    }
  }
  
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
      // 404の場合もJavaScriptエラーハンドリングを返す
      const errorWidget = `
(function() {
  console.warn('LuxuCare Widget: Organization "${resolvedParams.slug}" not found');
  
  // エラー表示用の最小HTML
  const container = document.currentScript?.parentElement;
  if (container) {
    container.innerHTML = '<div style="padding: 10px; border: 1px solid #ccc; background: #f9f9f9; border-radius: 4px; font-family: Arial, sans-serif; color: #666;">企業情報が見つかりませんでした</div>';
  }
})();`;

      return new NextResponse(errorWidget, {
        status: 404,
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'public, max-age=300', // 5分キャッシュ（エラーは短め）
          'Access-Control-Allow-Origin': 'https://aiohub.jp',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    const { organization, services } = data;
    
    // リクエストパラメータのサニタイズ
    const options = sanitizeOptions(searchParams);
    
    // JSON-LD生成
    const jsonLd = generateOrganizationJsonLd(organization);
    
    // Widget JavaScript生成
    const widgetCode = generateEmbedWidget({
      organization,
      services: options.showServices ? services : undefined,
      jsonLd,
      options,
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    });
    
    // レスポンス
    return new NextResponse(widgetCode, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        // キャッシュ設定: 15分
        'Cache-Control': 'public, max-age=900, s-maxage=900, stale-while-revalidate=3600',
        // CORS設定: aiohub.jpのみ許可
        'Access-Control-Allow-Origin': 'https://aiohub.jp',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
        // セキュリティヘッダー
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        // Widget識別用ヘッダー
        'X-LuxuCare-Widget-Version': '1.0.0',
        'X-LuxuCare-Organization': organization.slug,
      }
    });

  } catch (error) {
    console.error('Widget generation error:', error);
    
    // エラー時のフォールバックWidget
    const fallbackWidget = `
(function() {
  console.error('LuxuCare Widget: Generation failed', ${JSON.stringify(error.message)});
  
  const container = document.currentScript?.parentElement;
  if (container) {
    container.innerHTML = '<div style="padding: 10px; border: 1px solid #f44336; background: #ffebee; border-radius: 4px; font-family: Arial, sans-serif; color: #c62828;">Widget読み込みエラーが発生しました</div>';
  }
})();`;

    return new NextResponse(fallbackWidget, {
      status: 500,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': 'https://aiohub.jp',
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
      'Access-Control-Max-Age': '86400', // 24時間
    }
  });
}