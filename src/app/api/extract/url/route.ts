/**
 * URL Content Extraction API
 *
 * HTMLページからテキストとメタデータを抽出する
 * SSRF対策: 内部ネットワーク・メタデータサービスへのアクセスをブロック
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { extractionRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/utils/logger';
import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

/**
 * SSRF対策: 内部IPアドレス/ホスト名をブロック
 */
function isInternalOrDangerousHost(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();

  // 危険なホスト名パターン
  const blockedHostnames = [
    'localhost',
    'localhost.localdomain',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '[::1]',
    // AWS/GCP/Azure メタデータサービス
    '169.254.169.254',
    'metadata.google.internal',
    'metadata.gcp.internal',
    // Kubernetes
    'kubernetes.default',
    'kubernetes.default.svc',
  ];

  if (blockedHostnames.includes(lowerHostname)) {
    return true;
  }

  // *.internal, *.local などの内部ドメイン
  const blockedSuffixes = ['.internal', '.local', '.localhost', '.localdomain'];
  if (blockedSuffixes.some(suffix => lowerHostname.endsWith(suffix))) {
    return true;
  }

  return false;
}

/**
 * SSRF対策: 内部IPアドレスをブロック
 */
function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  const ipv4PrivateRanges = [
    /^127\./,                     // 127.0.0.0/8 (loopback)
    /^10\./,                      // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
    /^192\.168\./,                // 192.168.0.0/16
    /^169\.254\./,                // 169.254.0.0/16 (link-local, AWS metadata)
    /^0\./,                       // 0.0.0.0/8
    /^100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\./, // 100.64.0.0/10 (Carrier-grade NAT)
    /^192\.0\.0\./,               // 192.0.0.0/24
    /^192\.0\.2\./,               // 192.0.2.0/24 (TEST-NET-1)
    /^198\.51\.100\./,            // 198.51.100.0/24 (TEST-NET-2)
    /^203\.0\.113\./,             // 203.0.113.0/24 (TEST-NET-3)
    /^224\./,                     // 224.0.0.0/4 (Multicast)
    /^240\./,                     // 240.0.0.0/4 (Reserved)
    /^255\.255\.255\.255$/,       // Broadcast
  ];

  for (const range of ipv4PrivateRanges) {
    if (range.test(ip)) {
      return true;
    }
  }

  // IPv6 private/special ranges (simplified check)
  if (ip.includes(':')) {
    const lowerIP = ip.toLowerCase();
    if (
      lowerIP === '::1' ||           // Loopback
      lowerIP.startsWith('fe80:') || // Link-local
      lowerIP.startsWith('fc') ||    // Unique local (fc00::/7)
      lowerIP.startsWith('fd') ||    // Unique local
      lowerIP.startsWith('::ffff:127.') || // IPv4-mapped loopback
      lowerIP.startsWith('::ffff:10.') ||  // IPv4-mapped private
      lowerIP.startsWith('::ffff:192.168.') // IPv4-mapped private
    ) {
      return true;
    }
  }

  return false;
}

/**
 * DNSリバインディング対策を含むURL検証
 */
async function validateUrlForSSRF(url: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const urlObj = new URL(url);

    // プロトコル検証
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS protocols are allowed' };
    }

    // ホスト名検証
    if (isInternalOrDangerousHost(urlObj.hostname)) {
      logger.warn('[URL Extract] Blocked internal hostname', { hostname: urlObj.hostname });
      return { valid: false, error: 'Access to internal resources is not allowed' };
    }

    // IPアドレス直接指定の検証
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(urlObj.hostname)) {
      if (isPrivateIP(urlObj.hostname)) {
        logger.warn('[URL Extract] Blocked private IP', { ip: urlObj.hostname });
        return { valid: false, error: 'Access to private IP addresses is not allowed' };
      }
    }

    // DNS解決してIPアドレスを検証（DNSリバインディング対策）
    try {
      const { address } = await dnsLookup(urlObj.hostname);
      if (isPrivateIP(address)) {
        logger.warn('[URL Extract] DNS resolved to private IP', {
          hostname: urlObj.hostname,
          resolvedIP: address
        });
        return { valid: false, error: 'Target resolves to a private IP address' };
      }
    } catch (dnsError) {
      // DNS解決失敗は許可しない
      logger.warn('[URL Extract] DNS lookup failed', {
        hostname: urlObj.hostname,
        error: dnsError instanceof Error ? dnsError.message : String(dnsError)
      });
      return { valid: false, error: 'Unable to resolve hostname' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

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
    const supabaseBrowser = await createClient();
    const user = await getUserWithClient(supabaseBrowser);
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // SSRF対策を含むURL検証
    const urlValidation = await validateUrlForSSRF(url);
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: urlValidation.error || '無効なURLです' },
        { status: 400 }
      );
    }

    const userAgent = 'AIOHub-CMS/1.0 (+https://aiohub.jp)';

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
        signal: controller.signal,
        redirect: 'follow', // リダイレクトは自動フォロー（ただし最大5回に制限される）
      });

      clearTimeout(timeoutId);

      // リダイレクト先のURLも検証
      if (response.url !== url) {
        const redirectValidation = await validateUrlForSSRF(response.url);
        if (!redirectValidation.valid) {
          logger.warn('[URL Extract] Redirect to blocked URL', {
            originalUrl: url,
            redirectUrl: response.url
          });
          return NextResponse.json(
            { error: 'リダイレクト先が無効です' },
            { status: 400 }
          );
        }
      }

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

      logger.error('[URL Extract] Fetch error', {
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      return NextResponse.json(
        { error: 'サイトの内容を取得できませんでした' },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('[URL Extract] API error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: 'テキスト抽出に失敗しました' },
      { status: 500 }
    );
  }
}

// HTMLからテキストとメタデータを抽出
function extractFromHTML(html: string, sourceUrl: string) {
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
    const cleanHtml = html
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
      headings: headings.slice(0, 10),
      sourceUrl
    };

  } catch (error) {
    logger.error('[URL Extract] HTML parsing error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      text: 'テキストの抽出に失敗しました',
      title: title || 'Unknown',
      headings: [],
      sourceUrl
    };
  }
}
