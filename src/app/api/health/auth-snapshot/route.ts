// Phase 0-2: 認証診断エンドポイント
// 目的: 「Cookieが来てないのか」「判定ロジックが間違いか」を本番で即断できるようにする
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

// Supabase auth cookie パターン
const SB_AUTH_COOKIE_PATTERNS = [
  /^sb-.*-auth-token$/,
  /^sb-.*-auth-token\.\d+$/,
];

// middleware の判定ロジックを再現
function wouldMiddlewareRedirect(cookieNames: string[], path: string): boolean {
  // soft-auth で保護されるパス
  const SOFT_AUTH_PATHS = ['/dashboard', '/account', '/management-console'];

  const isSoftAuthPath = SOFT_AUTH_PATHS.some(p => path.startsWith(p));
  if (!isSoftAuthPath) {
    return false;
  }

  // Supabase auth cookie が1つでもあれば redirect しない
  const hasAuthCookie = cookieNames.some(name =>
    SB_AUTH_COOKIE_PATTERNS.some(pattern => pattern.test(name))
  );

  return !hasAuthCookie;
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
              process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
              'unknown';

  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const allCookieNames = allCookies.map(c => c.name);

    // Supabase auth cookie のみ抽出（値は出さない）
    const matchedCookieNames = allCookieNames.filter(name =>
      SB_AUTH_COOKIE_PATTERNS.some(pattern => pattern.test(name))
    );

    const hasSbAuthCookie = matchedCookieNames.length > 0;

    // テスト用パス（固定）
    const testPath = '/dashboard/posts';
    const middlewareWouldRedirect = wouldMiddlewareRedirect(allCookieNames, testPath);

    // Supabase getUser チェック（PIIなし、成否のみ）
    let getUserStatus: 'success' | 'error' | 'no_user' = 'error';
    let getUserErrorCode: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        getUserStatus = 'error';
        getUserErrorCode = error.message || 'unknown_error';
      } else if (user) {
        getUserStatus = 'success';
      } else {
        getUserStatus = 'no_user';
      }
    } catch (e) {
      getUserStatus = 'error';
      getUserErrorCode = e instanceof Error ? e.message : 'exception';
    }

    const response = NextResponse.json({
      hasSbAuthCookie,
      matchedCookieNames,
      middlewareWouldRedirect,
      requestPath: testPath,
      totalCookieCount: allCookieNames.length,
      getUserStatus,
      getUserErrorCode,
      sha,
      requestId,
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json',
        'x-request-id': requestId
      }
    });

    return response;
  } catch (error) {
    console.error('[auth-snapshot] Error:', {
      sha,
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json({
      hasSbAuthCookie: false,
      matchedCookieNames: [],
      middlewareWouldRedirect: true,
      requestPath: '/dashboard/posts',
      error: error instanceof Error ? error.message : 'Unknown error',
      sha,
      requestId,
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json',
        'x-request-id': requestId
      }
    });
  }
}
