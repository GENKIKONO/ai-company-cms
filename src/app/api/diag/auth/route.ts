/**
 * 統合認証診断API（Phase 14 集約）
 *
 * 目的: A系(diag/test)のAuth直叩きを1ファイルに集約
 *
 * モード:
 *   - ?mode=full    : 総合診断（Cookie/Header/Auth詳細）
 *   - ?mode=session : セッション診断（簡易版）
 *   - ?mode=simple  : 認証確認のみ（ok/error）
 *   - ?mode=whoami  : ユーザー情報 + Cookie一覧
 *   - (default)     : session と同等
 *
 * 既存URLとの互換:
 *   - /api/diag/auth-context → このファイルに委譲（mode=full）
 *   - /api/diag/session      → このファイルに委譲（mode=session）
 *   - /api/diag-session      → このファイルに委譲（mode=session）
 *   - /api/selftest/auth     → このファイルに委譲（mode=simple）
 *   - /api/debug/whoami      → このファイルに委譲（mode=whoami）
 *   - /api/debug/_debug/whoami → このファイルに委譲（mode=whoami）
 *
 * Phase 20: Auth直叩き撤廃
 *   Core wrapper (getUserFullWithClient, getSessionWithClient) 経由に統一。
 *   userError/sessionError は wrapper が返さないため null に縮退。
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  getUserFullWithClient,
  getSessionWithClient,
  type AuthUserFull,
} from '@/lib/core/auth-state';
import { diagGuard, diagErrorResponse, getSafeEnvironmentInfo } from '@/lib/api/diag-guard';
import type { Session } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Cookie値をマスクする関数（先頭/終端10文字のみ表示）
function maskCookie(value: string): string {
  if (!value || value.length <= 20) return '***masked***';
  return `${value.substring(0, 10)}...${value.substring(value.length - 10)}`;
}

// 共通のno-cacheヘッダー
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, must-revalidate',
  'Content-Type': 'application/json'
};

export async function GET(request: NextRequest) {
  // diagGuard による認証チェック
  const guardResult = await diagGuard(request);
  if (!guardResult.authorized) {
    return guardResult.response!;
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'session';

  try {
    const supabase = await createClient();

    // Phase 20: Core wrapper 経由で Auth情報取得（直叩き撤廃）
    const user = await getUserFullWithClient(supabase);
    const session = await getSessionWithClient(supabase);

    // モード別レスポンス生成
    switch (mode) {
      case 'full':
        return handleFullMode(request, user, session, guardResult.isProduction);
      case 'session':
        return handleSessionMode(request, user, session);
      case 'simple':
        return handleSimpleMode(user);
      case 'whoami':
        return handleWhoamiMode(user, supabase);
      default:
        return handleSessionMode(request, user, session);
    }

  } catch (error) {
    return diagErrorResponse(error, '/api/diag/auth');
  }
}

/**
 * mode=full: 総合診断（Cookie/Header/Auth詳細）
 * 旧 /api/diag/auth-context 互換
 * Phase 20: Core wrapper経由に移行（userError/sessionErrorは縮退）
 */
async function handleFullMode(
  request: NextRequest,
  user: AuthUserFull | null,
  session: Session | null,
  isProduction: boolean
) {
  const cookieStore = await cookies();
  const hdrs = await headers();

  const cookieHeader = hdrs.get('cookie') || '';
  const allCookies = cookieStore.getAll();

  const authTokenCookies = allCookies.filter(cookie =>
    cookie.name.includes('auth-token') && cookie.name.startsWith('sb-')
  );

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
    mode: 'full',
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
        userError: null,  // Phase 20: Core wrapperはエラー詳細を返さない
        sessionError: null,  // Phase 20: Core wrapperはエラー詳細を返さない
        hasSession: !!session,
        sessionExpiresAt: session?.expires_at,
      }
    },
    environment: getSafeEnvironmentInfo(isProduction)
  };

  return NextResponse.json(diagnosticResponse, {
    status: 200,
    headers: NO_CACHE_HEADERS
  });
}

/**
 * mode=session: セッション診断（簡易版）
 * 旧 /api/diag/session, /api/diag-session 互換
 * Phase 20: Core wrapper経由に移行（userError/sessionErrorは縮退）
 */
async function handleSessionMode(
  request: NextRequest,
  user: AuthUserFull | null,
  session: Session | null
) {
  const cookieHeader = request.headers.get('cookie') || '';
  const hasAccessTokenCookie = /sb-[^=;]+-auth-token=/.test(cookieHeader);
  const hasPersistentCookie = /sb-[^=;]+-auth-token\.persistent=/.test(cookieHeader);

  const diagnosticResponse = {
    authenticated: !!user,
    userId: user?.id,
    email: user?.email,
    sessionExpiresAt: session?.expires_at,
    hasAccessTokenCookie,
    hasPersistentCookie,
    cookieHeaderLength: cookieHeader.length,
    timestamp: new Date().toISOString(),
    mode: 'session',
    requestUrl: request.url,
    userError: null,  // Phase 20: Core wrapperはエラー詳細を返さない
    sessionError: null,  // Phase 20: Core wrapperはエラー詳細を返さない
    supabaseUserResult: user ? 'SUCCESS' : 'NO_USER',
    supabaseSessionResult: session ? 'SUCCESS' : 'NO_SESSION',
    cookieCount: cookieHeader.split(';').filter(c => c.trim()).length,
    userAgent: request.headers.get('user-agent')?.substring(0, 100) || 'N/A',
  };

  return NextResponse.json(diagnosticResponse, {
    status: 200,
    headers: NO_CACHE_HEADERS
  });
}

/**
 * mode=simple: 認証確認のみ
 * 旧 /api/selftest/auth 互換
 * Phase 20: Core wrapper経由に移行（userErrorは縮退）
 */
function handleSimpleMode(user: AuthUserFull | null) {
  const userInfo = user ? { id: user.id, email: user.email } : null;
  return NextResponse.json({
    ok: !!user,
    provider: 'supabase',
    user: userInfo,
    mode: 'simple'
  });
}

/**
 * mode=whoami: ユーザー情報 + Cookie一覧
 * 旧 /api/debug/whoami, /api/debug/_debug/whoami 互換
 * Phase 20: Core wrapper経由に移行（userErrorは縮退）
 */
async function handleWhoamiMode(
  user: AuthUserFull | null,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const cookieStore = await cookies();
  const allCookieNames = cookieStore.getAll().map(c => c.name);
  const sbCookies = allCookieNames.filter(n => n.startsWith('sb-'));

  // 組織情報も取得（debug/_debug/whoami互換）
  let orgProbe: { found: boolean; id: string | null; created_by: string | null } = {
    found: false,
    id: null,
    created_by: null
  };

  if (user) {
    try {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, created_by')
        .eq('created_by', user.id)
        .limit(1)
        .maybeSingle();

      if (orgData) {
        orgProbe = {
          found: true,
          id: orgData.id,
          created_by: orgData.created_by
        };
      }
    } catch {
      // org probe failed silently
    }
  }

  return NextResponse.json({
    mode: 'whoami',
    cookieKeys: sbCookies,
    user: user ? { id: user.id, email: user.email } : null,
    orgProbe,
    error: null,  // Phase 20: Core wrapperはエラー詳細を返さない
    timestamp: new Date().toISOString()
  });
}

// 他のHTTPメソッドは許可しない（selftest互換）
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
