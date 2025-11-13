import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Cookie値をマスクする関数（先頭/終端10文字のみ表示）
function maskCookie(value: string): string {
  if (!value || value.length <= 20) return '***masked***';
  return `${value.substring(0, 10)}...${value.substring(value.length - 10)}`;
}

// ヘッダー値をマスクする関数
function maskHeaderValue(name: string, value: string): string {
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'token'];
  if (sensitiveHeaders.some(h => name.toLowerCase().includes(h))) {
    return maskCookie(value);
  }
  // User-Agentなど長いヘッダーは短縮
  if (value.length > 100) {
    return value.substring(0, 50) + '...[truncated]';
  }
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const hdrs = await headers();
    
    // リクエストボディの取得（JSON以外も対応）
    let requestBody: any = null;
    let bodyParseError: string | null = null;
    
    try {
      const contentType = hdrs.get('content-type') || '';
      if (contentType.includes('application/json')) {
        requestBody = await request.json();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        requestBody = Object.fromEntries(formData.entries());
      } else {
        const text = await request.text();
        requestBody = { 
          contentType, 
          bodyLength: text.length,
          preview: text.substring(0, 100) + (text.length > 100 ? '...' : '')
        };
      }
    } catch (error) {
      bodyParseError = error instanceof Error ? error.message : 'Unknown parsing error';
    }
    
    // 全ヘッダーの収集（マスク処理付き）
    const allHeaders: Record<string, string> = {};
    hdrs.forEach((value, key) => {
      allHeaders[key] = maskHeaderValue(key, value);
    });
    
    // Cookie の詳細解析
    const cookieHeader = hdrs.get('cookie') || '';
    const cookiePairs = cookieHeader.split(';').map(c => c.trim()).filter(Boolean);
    const parsedCookies = cookiePairs.map(pair => {
      const [name, ...valueParts] = pair.split('=');
      const value = valueParts.join('=');
      return {
        name: name?.trim(),
        value: maskCookie(value || ''),
        hasValue: !!value,
        valueLength: value?.length || 0
      };
    });
    
    // Supabase認証Cookieの検出
    const supabaseAuthCookies = parsedCookies.filter(cookie => 
      cookie.name && cookie.name.includes('auth-token') && cookie.name.startsWith('sb-')
    );
    
    const echoResponse = {
      timestamp: new Date().toISOString(),
      request: {
        method: 'POST',
        url: request.url,
        origin: new URL(request.url).origin,
        contentLength: hdrs.get('content-length'),
        contentType: hdrs.get('content-type'),
        userAgent: hdrs.get('user-agent')?.substring(0, 50) + '...',
      },
      headers: {
        total: Object.keys(allHeaders).length,
        all: allHeaders,
        hasAuthorization: !!hdrs.get('authorization'),
        hasCookie: !!hdrs.get('cookie'),
        hasOrigin: !!hdrs.get('origin'),
        hasReferer: !!hdrs.get('referer'),
      },
      cookies: {
        headerLength: cookieHeader.length,
        totalPairs: parsedCookies.length,
        parsed: parsedCookies,
        supabaseAuthCookies: supabaseAuthCookies,
        hasSupabaseAuth: supabaseAuthCookies.length > 0,
      },
      body: {
        received: requestBody,
        parseError: bodyParseError,
        size: JSON.stringify(requestBody || {}).length,
      },
      credentialsCheck: {
        // credentials: 'include' が効いているかの判定指標
        hasCookieHeader: !!hdrs.get('cookie'),
        hasAuthCookies: supabaseAuthCookies.length > 0,
        cookieCount: parsedCookies.length,
        likely_credentials_include: !!hdrs.get('cookie') && supabaseAuthCookies.length > 0,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      }
    };

    return NextResponse.json(echoResponse, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
    
  } catch (error) {
    const errorResponse = {
      timestamp: new Date().toISOString(),
      error: {
        code: 'ECHO_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      request: {
        method: 'POST',
        url: request.url,
        cookieHeaderLength: (await headers()).get('cookie')?.length || 0,
      }
    };
    
    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  }
}

// OPTIONSメソッドのサポート（CORS プリフライト）
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    }
  });
}