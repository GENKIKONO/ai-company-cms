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
 * - /admin, /management-console → 厳密認証（getUser で検証、失敗時リダイレクト）
 * - /dashboard, /account, /my → Cookie なしならログインへリダイレクト
 * - /auth/login 等 → Cookie があれば /dashboard へ
 * - 全ページ → Cookie がある場合はセッションリフレッシュ（公開ページでもログイン状態維持）
 *
 * 【ハードコード禁止】
 * - ルート直書きは禁止、必ず ROUTES 定数を使用
 */

const DEPLOY_SHA = process.env.VERCEL_GIT_COMMIT_SHA ||
                   process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
                   'unknown';

// =====================================================
// セキュリティヘッダー設定（世界商用レベル）
// =====================================================
function setSecurityHeaders(response: NextResponse): void {
  // XSS対策
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // クリックジャッキング対策
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // HTTPS強制（本番環境のみ）
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // リファラーポリシー
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 権限ポリシー（不要な機能を無効化）
  response.headers.set('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Content Security Policy
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

  // キャッシュ制御（セキュリティ関連ページ）
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
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
  //    → Cookieクリアはしない（LoginFormで明示的に行う）
  //    → prefetchでCookieが消える問題を防ぐため
  // =====================================================
  if (isAuthPath) {
    const authResponse = NextResponse.next({
      request: { headers: request.headers },
    });
    setSecurityHeaders(authResponse);
    authResponse.headers.set('x-request-id', requestId);
    return authResponse;
  }

  // =====================================================
  // 5. セッション更新（全ページ対象）
  //    → Cookie がある場合、getUser() でセッションリフレッシュを実行
  //    → これにより公開ページでもログイン状態が正しく表示される
  //    → ダッシュボード系パスは追加でリダイレクト制御も行う
  // =====================================================
  const protectedPaths = [ROUTES.dashboard, '/account', '/my'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // 保護パス（ダッシュボード等）: Cookie がなければログインへリダイレクト
  if (isProtectedPath && !hasAuthCookie) {
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

  // 全ページ: セッションリフレッシュは行わない
  // 理由: getUser()がCookieを検証し、形式が異なる場合にクリアしてしまうため
  // セッションの検証は各ページのShellで行う

  // =====================================================
  // 6. セキュリティヘッダー追加
  // =====================================================
  setSecurityHeaders(response);
  response.headers.set('x-request-id', requestId);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|static).*)',
  ],
};
