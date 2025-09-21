import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowserServer } from '@/lib/supabase-server';
import { extractionRateLimit } from '@/lib/rate-limit';
import { trackBusinessEvent, notifyError } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
  try {
    // レート制限チェック
    const rateLimitResponse = await extractionRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URLが必要です' },
        { status: 400 }
      );
    }

    // 認証チェック
    const supabaseBrowser = supabaseBrowserServer();
    const { data: { user }, error: authError } = await supabaseBrowser.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // URLバリデーション
    let urlObj;
    try {
      urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { error: '有効なURLを入力してください' },
        { status: 400 }
      );
    }

    // レート制限チェック（簡易版）
    const userAgent = 'LuxuCare-CMS/1.0 (+https://luxucare.ai)';
    
    try {
      // タイムアウト付きでフェッチ
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: `サイトへのアクセスに失敗しました: HTTP ${response.status}` },
          { status: 400 }
        );
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        return NextResponse.json(
          { error: 'HTMLページのみサポートされています' },
          { status: 400 }
        );
      }

      const html = await response.text();
      
      // HTMLからテキストとメタデータを抽出
      const extractedData = extractFromHTML(html, url);

      return NextResponse.json({
        success: true,
        ...extractedData
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'タイムアウトしました（10秒）' },
          { status: 408 }
        );
      }

      console.error('URL extraction error:', error);
      return NextResponse.json(
        { error: 'サイトの内容を取得できませんでした' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('URL extraction API error:', error);
    return NextResponse.json(
      { error: 'テキスト抽出に失敗しました' },
      { status: 500 }
    );
  }
}

// HTMLからテキストとメタデータを抽出
function extractFromHTML(html: string, sourceUrl: string) {
  // 簡易的なHTMLパースと抽出
  let text = '';
  let title = '';
  const headings: string[] = [];

  try {
    // タイトル抽出
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim().replace(/&[a-zA-Z0-9#]+;/g, '');
    }

    // メタディスクリプション抽出
    const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    let metaDescription = '';
    if (metaDescMatch) {
      metaDescription = metaDescMatch[1].trim();
    }

    // スクリプトとスタイルを除去
    let cleanHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

    // 見出し抽出
    const headingMatches = cleanHtml.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi);
    if (headingMatches) {
      headingMatches.forEach(match => {
        const headingText = match.replace(/<[^>]+>/g, '').trim();
        if (headingText && headingText.length < 100) {
          headings.push(headingText);
        }
      });
    }

    // メインコンテンツ抽出の優先順位
    const contentSelectors = [
      /<main[^>]*>([\s\S]*?)<\/main>/i,
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id=["']content["'][^>]*>([\s\S]*?)<\/div>/i,
      /<body[^>]*>([\s\S]*?)<\/body>/i
    ];

    let mainContent = '';
    for (const selector of contentSelectors) {
      const match = cleanHtml.match(selector);
      if (match) {
        mainContent = match[1];
        break;
      }
    }

    if (!mainContent) {
      mainContent = cleanHtml;
    }

    // HTMLタグを除去してテキスト化
    text = mainContent
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-zA-Z0-9#]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // メタディスクリプションがある場合は先頭に追加
    if (metaDescription && metaDescription !== title) {
      text = metaDescription + '\n\n' + text;
    }

    // 長すぎる場合は切り詰め（最初の5000文字）
    if (text.length > 5000) {
      text = text.substring(0, 5000) + '...';
    }

    return {
      text,
      title,
      headings: headings.slice(0, 10), // 最大10個の見出し
      sourceUrl
    };

  } catch (error) {
    console.error('HTML parsing error:', error);
    return {
      text: 'テキストの抽出に失敗しました',
      title: title || 'Unknown',
      headings: [],
      sourceUrl
    };
  }
}