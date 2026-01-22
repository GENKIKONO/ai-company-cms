import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import { ROUTES } from '@/lib/routes';

/**
 * 認証ミドルウェア（Supabase SSR 公式パターン準拠）
 *
 * 【設計原則】
 * - getUser() が唯一の Source of Truth
 * - 全パスで getUser() を1回呼び、Cookie 同期（setAll）を発火させる
 * - レスポンスは必ず getResponse() から取得して返す
 * - NextResponse.next() を直接返すのは静的アセットのみ
 *
 * 【責務】
 * 1. Cookie 同期: getUser() 呼び出しで setAll が発火し、トークンリフレッシュ後の Cookie が response に反映
 * 2. 認証ゲート: 保護パスで user がいなければログインへリダイレクト
 *
 * 【パス分類】
 * - 静的アセット → NextResponse.next() で即座返却（Cookie 不要）
 * - /api/* → NextResponse.next() で即座返却（API は別途認証）
 * - それ以外 → getUser() で Cookie 同期後、認証判定
 */

const DEPLOY_SHA = process.env.VERCEL_GIT_COMMIT_SHA ||
                   process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
                   'unknown';

// =====================================================
// セキュリティヘッダー設定
// =====================================================
function setSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://vercel.live https://*.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://vercel.live https://*.vercel-scripts.com https://*.openai.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://vercel.live",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ];
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID();

  // =====================================================
  // 1. 静的アセット・API は即座に返却（Cookie 同期不要）
  //    理由: これらは認証不要、かつ getUser() を呼ぶ必要がない
  // =====================================================
  const isStaticAsset =
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml';

  const isApiPath = pathname.startsWith('/api/');

  if (isStaticAsset || isApiPath) {
    return NextResponse.next();
  }

  // =====================================================
  // 2. Supabase クライアント作成
  //    重要: setAll で response が再生成されるため、
  //    常に getResponse() で最新の response を取得する
  // =====================================================
  const { supabase, getResponse } = createClient(request);

  // =====================================================
  // 3. getUser() を1回呼び、Cookie 同期を発火
  //    理由: トークンリフレッシュが必要な場合、ここで setAll が呼ばれ、
  //    更新された Cookie が response に反映される
  //    以降の分岐では user を再取得せず、この結果を使い回す
  // =====================================================
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();

  // Cookie 存在チェック（ログ用）
  const allCookies = request.cookies.getAll();
  const sbCookies = allCookies.filter(c => c.name.startsWith('sb-') || c.name.startsWith('supabase-'));
  const hasAuthCookie = sbCookies.length > 0;

  // =====================================================
  // 4. パス分類
  // =====================================================
  const strictAuthPaths = [ROUTES.admin, ROUTES.managementConsole];
  const isStrictAuthPath = strictAuthPaths.some(path => pathname.startsWith(path));

  const authPaths = [ROUTES.authLogin, ROUTES.authSignin, ROUTES.login, ROUTES.signin];
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));

  const authCallbackPaths = ['/auth/callback', '/auth/confirm', '/auth/reset-password-confirm'];
  const isAuthCallbackPath = authCallbackPaths.some(path => pathname === path);

  const protectedPaths = [ROUTES.dashboard, '/account', '/my'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // =====================================================
  // 5. 厳密認証パス: /admin, /management-console
  //    → user がいなければログインへリダイレクト
  //    注意: getUser() は上で1回呼び済み。ここでは呼ばない
  // =====================================================
  if (isStrictAuthPath) {
    if (!user) {
      console.warn('[middleware] strict-auth redirect', {
        sha: DEPLOY_SHA,
        requestId,
        path: pathname,
        errorCode: getUserError?.code,
      });

      const url = request.nextUrl.clone();
      url.pathname = ROUTES.authLogin;
      url.searchParams.set('redirect', pathname);
      url.searchParams.set('reason', 'strict-auth');
      url.searchParams.set('rid', requestId.slice(0, 8));

      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.headers.set('x-request-id', requestId);

      // 重要: setAll で設定された Cookie を redirect response にコピー
      const currentResponse = getResponse();
      currentResponse.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });

      return redirectResponse;
    }
  }

  // =====================================================
  // 6. 認証コールバック: /auth/callback 等
  //    → Cookie 同期のみ（認証チェックなし）
  //    理由: コールバック処理中はまだセッションが確立していない
  // =====================================================
  if (isAuthCallbackPath) {
    const response = getResponse();
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // =====================================================
  // 7. 認証ページ: /auth/login 等
  //    → Cookie 同期済みの response を返す
  //    注意: NextResponse.next() を直接返さない（setAll の結果が失われる）
  // =====================================================
  if (isAuthPath) {
    const response = getResponse();
    setSecurityHeaders(response);
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // =====================================================
  // 8. 保護パス: /dashboard, /account, /my
  //    → user がいなければログインへリダイレクト
  //    注意: getUser() は上で1回呼び済み。ここでは呼ばない
  // =====================================================
  if (isProtectedPath) {
    // 診断ログ
    console.error('[middleware][auth-check]', {
      pathname,
      hasCookies: hasAuthCookie,
      cookieKeys: allCookies.map(c => c.name),
      userId: user?.id || null,
      getUserError: getUserError?.name || null,
      getUserErrorMessage: getUserError?.message || null,
    });

    const responseAfterGetUser = getResponse();
    const setCookiesAfterGetUser = responseAfterGetUser.cookies.getAll();
    console.log('[middleware] getUser result', {
      sha: DEPLOY_SHA,
      requestId,
      path: pathname,
      hasAuthCookie,
      hasUser: !!user,
      getUserError: getUserError?.code || null,
      getUserErrorMsg: getUserError?.message || null,
      setCookieCount: setCookiesAfterGetUser.length,
      setCookieNames: setCookiesAfterGetUser.map(c => c.name),
    });

    if (!user) {
      console.warn('[middleware] No valid session - redirecting to login', {
        sha: DEPLOY_SHA,
        requestId,
        path: pathname,
        hasAuthCookie,
        getUserError: getUserError?.code || null,
      });

      const url = request.nextUrl.clone();
      url.pathname = ROUTES.authLogin;
      url.searchParams.set('redirect', pathname);
      url.searchParams.set('reason', 'no_session');
      url.searchParams.set('rid', requestId.slice(0, 8));

      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.headers.set('x-request-id', requestId);

      // 重要: setAll で設定された Cookie を redirect response にコピー
      const currentResponse = getResponse();
      currentResponse.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });

      return redirectResponse;
    }
  }

  // =====================================================
  // 9. その他のパス（公開ページ等）
  //    → Cookie 同期済みの response を返す
  //    理由: 公開ページでもログイン状態を維持するため、
  //    トークンリフレッシュ後の Cookie を返す必要がある
  // =====================================================
  const finalResponse = getResponse();
  setSecurityHeaders(finalResponse);
  finalResponse.headers.set('x-request-id', requestId);
  return finalResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|static).*)',
  ],
};
