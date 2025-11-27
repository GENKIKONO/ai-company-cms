import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Cookie値をマスクする関数（先頭/終端10文字のみ表示）
function maskCookie(value: string): string {
  if (!value || value.length <= 20) return '***masked***';
  return `${value.substring(0, 10)}...${value.substring(value.length - 10)}`;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const hdrs = await headers();
    
    // Cookie の解析
    const cookieHeader = hdrs.get('cookie') || '';
    const allCookies = cookieStore.getAll();
    
    // sb-*-auth-token の検出
    const authTokenCookies = allCookies.filter(cookie => 
      cookie.name.includes('auth-token') && cookie.name.startsWith('sb-')
    );
    
    // Supabase認証の確認
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // 主要ヘッダーの収集
    const relevantHeaders = {
      'user-agent': hdrs.get('user-agent')?.substring(0, 50) + '...',
      'accept': hdrs.get('accept'),
      'accept-language': hdrs.get('accept-language'),
      'referer': hdrs.get('referer'),
      'origin': hdrs.get('origin'),
      'host': hdrs.get('host'),
      'x-forwarded-for': hdrs.get('x-forwarded-for'),
      'x-forwarded-proto': hdrs.get('x-forwarded-proto'),
    };
    
    const diagnosticResponse = {
      timestamp: new Date().toISOString(),
      request: {
        method: 'GET',
        url: request.url,
        origin: new URL(request.url).origin,
      },
      cookies: {
        headerLength: cookieHeader.length,
        totalCount: allCookies.length,
        authTokenCookies: authTokenCookies.map(cookie => ({
          name: cookie.name,
          value: maskCookie(cookie.value),
          hasValue: !!cookie.value,
          valueLength: cookie.value.length
        })),
        hasSupabaseTokens: authTokenCookies.length > 0,
        allCookieNames: allCookies.map(c => c.name)
      },
      headers: relevantHeaders,
      supabase: {
        auth: {
          user: user ? {
            id: user.id,
            email: user.email,
            emailConfirmedAt: user.email_confirmed_at,
            lastSignInAt: user.last_sign_in_at,
          } : null,
          userError: userError?.message,
          sessionError: sessionError?.message,
          hasSession: !!session,
          sessionExpiresAt: session?.expires_at,
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        deploymentUrl: process.env.VERCEL_URL,
      }
    };

    return NextResponse.json(diagnosticResponse, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    const errorResponse = {
      timestamp: new Date().toISOString(),
      error: {
        code: 'DIAGNOSTIC_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      cookieHeaderLength: (await headers()).get('cookie')?.length || 0,
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