import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import { ROUTES } from '@/lib/routes';

/**
 * 認証ミドルウェア（世界商用レベル）
 *
 * 【設計原則】
 * - Middleware は「交通整理」に徹する（門番ではない）
 * - 認証の責務は各領域の Shell に委譲
 * - Cookie/RSC の不安定性に依存しない
 *
 * 【責務の分離】
 * - /admin, /management-console → 厳密認証（getUser）
 * - /dashboard, /account, /my → Middleware は何もしない（DashboardPageShell に委譲）
 * - /auth/login 等 → Cookie があれば /dashboard へ
 * - Supabase セッションの Cookie 同期
 *
 * 【ハードコード禁止】
 * - ルート直書きは禁止、必ず ROUTES 定数を使用
 */

const DEPLOY_SHA = process.env.VERCEL_GIT_COMMIT_SHA ||
                   process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
                   'unknown';

// Supabase プロジェクト参照を環境変数から取得
function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'unknown';
}

/**
 * 壊れた Supabase Cookie を全削除する
 * refresh-token はあるが getUser() が失敗する状態を解消
 */
function clearSupabaseCookies(response: NextResponse, projectRef: string, allCookies: { name: string }[]): void {
  // 削除対象のパターン
  const deletePatternsPrefix = `sb-${projectRef}-`;

  allCookies.forEach(cookie => {
    if (cookie.name.startsWith(deletePatternsPrefix)) {
      // Cookie を削除（expires を過去にする）
      response.cookies.set(cookie.name, '', {
        path: '/',
        expires: new Date(0),
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID();

  // =====================================================
  // 1. スルーするパス（認証チェック不要）
  // =====================================================
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/auth/callback' ||
    pathname === '/auth/confirm' ||
    pathname === '/auth/reset-password-confirm'
  ) {
    return NextResponse.next();
  }

  // Supabaseクライアント作成（Cookieの同期処理込み）
  const { supabase, response } = createClient(request);

  // =====================================================
  // 2. パス分類
  // =====================================================
  const strictAuthPaths = [ROUTES.admin, ROUTES.managementConsole];
  const isStrictAuthPath = strictAuthPaths.some(path => pathname.startsWith(path));

  const authPaths = [ROUTES.authLogin, ROUTES.authSignin, ROUTES.login, ROUTES.signin];
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));

  // Cookie 存在チェック（認証ページのリダイレクト判定用）
  const allCookies = request.cookies.getAll();
  const sbCookies = allCookies.filter(c => c.name.startsWith('sb-') || c.name.startsWith('supabase-'));
  const hasAuthCookie = sbCookies.length > 0;

  // =====================================================
  // 3. 厳密認証パス: /admin, /management-console
  //    → getUser() で検証、失敗なら /auth/login
  // =====================================================
  if (isStrictAuthPath) {
    const { data: { user }, error } = await supabase.auth.getUser();
    const isLoggedIn = user && !error;

    if (!isLoggedIn) {
      console.warn('[middleware] strict-auth redirect', {
        sha: DEPLOY_SHA,
        requestId,
        path: pathname,
        errorCode: error?.code,
      });

      const url = request.nextUrl.clone();
      url.pathname = ROUTES.authLogin;
      url.searchParams.set('redirect', pathname);
      url.searchParams.set('reason', 'strict-auth');
      url.searchParams.set('rid', requestId.slice(0, 8));

      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.headers.set('x-request-id', requestId);
      return redirectResponse;
    }
  }

  // =====================================================
  // 4. 認証ページ: /auth/login 等
  //    → Cookie があれば /dashboard へ
  // =====================================================
  if (isAuthPath && hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.dashboard;
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.headers.set('x-request-id', requestId);
    return redirectResponse;
  }

  // =====================================================
  // 5. セッション更新パス: /dashboard, /account, /my
  //    → getUser() でセッション検証
  //    → 「refresh-token があるのに getUser 失敗」= 壊れた状態
  //    → Cookie を全削除して /auth/login にリダイレクト
  // =====================================================
  const sessionRefreshPaths = [ROUTES.dashboard, '/account', '/my'];
  const isSessionRefreshPath = sessionRefreshPaths.some(path => pathname.startsWith(path));

  if (isSessionRefreshPath) {
    const projectRef = getProjectRef();
    const hasRefreshToken = allCookies.some(c => c.name === `sb-${projectRef}-refresh-token`);

    // getUser() でセッション検証
    const { data: { user }, error } = await supabase.auth.getUser();
    const isValidSession = user && !error;

    // 壊れた状態: refresh-token があるのに getUser が失敗
    if (hasRefreshToken && !isValidSession) {
      console.warn('[middleware] Broken session detected - clearing cookies and redirecting', {
        sha: DEPLOY_SHA,
        requestId,
        path: pathname,
        hasRefreshToken,
        errorCode: error?.code,
        errorMessage: error?.message,
      });

      // Cookie を全削除してリダイレクト
      const url = request.nextUrl.clone();
      url.pathname = ROUTES.authLogin;
      url.searchParams.set('reason', 'session_missing');
      url.searchParams.set('rid', requestId.slice(0, 8));

      const redirectResponse = NextResponse.redirect(url);
      clearSupabaseCookies(redirectResponse, projectRef, allCookies);
      redirectResponse.headers.set('x-request-id', requestId);
      redirectResponse.headers.set('x-auth-recover', 'clear-cookies-and-relogin');
      return redirectResponse;
    }

    // Cookie がないのにダッシュボードにアクセス → ログインへ
    if (!hasAuthCookie) {
      console.warn('[middleware] No auth cookie - redirecting to login', {
        sha: DEPLOY_SHA,
        requestId,
        path: pathname,
      });

      const url = request.nextUrl.clone();
      url.pathname = ROUTES.authLogin;
      url.searchParams.set('redirect', pathname);
      url.searchParams.set('reason', 'no_cookie');
      url.searchParams.set('rid', requestId.slice(0, 8));

      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.headers.set('x-request-id', requestId);
      return redirectResponse;
    }
  }

  // =====================================================
  // 6. その他（公開ページ等）
  //    → Middleware は何もしない
  // =====================================================
  response.headers.set('x-request-id', requestId);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|static).*)',
  ],
};
