import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import { ROUTES } from '@/lib/routes';

/**
 * 認証ミドルウェア
 *
 * 【責務】
 * - 未認証ユーザーを /auth/login へリダイレクト
 * - 認証済みユーザーが認証ページにアクセスした場合 /dashboard へリダイレクト
 * - Supabase セッションの Cookie 同期
 *
 * 【認証戦略】
 * - /dashboard, /account, /my: Cookie存在チェックのみ（認証保証はPageShellに委譲）
 *   → クライアントナビゲーション時の cookie 同期問題を回避
 * - /admin, /management-console: 厳密な getUser() チェック
 *   → 管理者向けページは厳密に保護
 *
 * 【ハードコード禁止】
 * - ルート直書きは禁止、必ず ROUTES 定数を使用
 */
// Phase 0-3: デプロイSHAとリクエストIDを全ログに付与
const DEPLOY_SHA = process.env.VERCEL_GIT_COMMIT_SHA ||
                   process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
                   'unknown';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID();

  // スルーするパス（認証チェックしない）
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
  // 認証戦略: ルート種別によってチェック方式を分ける
  // =====================================================

  // 厳密認証が必要なパス（管理者向け）
  const strictAuthPaths = [ROUTES.admin, ROUTES.managementConsole];
  const isStrictAuthPath = strictAuthPaths.some(path => pathname.startsWith(path));

  // ソフト認証パス（Cookie存在チェックのみ、認証保証はPageShellに委譲）
  // → クライアントナビゲーション時の getUser() 不安定性を回避
  const softAuthPaths = [ROUTES.dashboard, ROUTES.account, ROUTES.my];
  const isSoftAuthPath = softAuthPaths.some(path => pathname.startsWith(path));

  // 認証ページ（ログイン済みなら /dashboard へ）
  const authPaths = [ROUTES.authLogin, ROUTES.authSignin, ROUTES.login, ROUTES.signin];
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));

  // =====================================================
  // Cookie 存在チェック（ソフト認証用）
  // Supabase の cookie パターン:
  // - sb-<project>-auth-token (単一)
  // - sb-<project>-auth-token.0, .1, ... (チャンク分割)
  // - sb-<project>-refresh-token (リフレッシュ)
  // - supabase-auth-token (レガシー)
  // =====================================================
  const supabaseAuthCookiePattern = /^(sb-.*-(auth-token|refresh-token)(\.\d+)?|supabase-auth-token)$/;
  const allCookies = request.cookies.getAll();
  const sbCookies = allCookies.filter(c => c.name.startsWith('sb-') || c.name.startsWith('supabase-'));
  const hasAuthCookie = allCookies.some(cookie => supabaseAuthCookiePattern.test(cookie.name));

  // =====================================================
  // 厳密認証パス: getUser() で検証
  // =====================================================
  if (isStrictAuthPath) {
    const { data: { user }, error } = await supabase.auth.getUser();
    const isLoggedIn = user && !error;

    if (!isLoggedIn) {
      // デバッグ用ログ（cookie名のみ、値は出さない）
      console.warn('[middleware] strict-auth redirect', {
        sha: DEPLOY_SHA,
        requestId,
        path: pathname,
        sbCookieNames: sbCookies.map(c => c.name),
        hasAuthCookie,
        errorCode: error?.code,
      });

      const url = request.nextUrl.clone();
      url.pathname = ROUTES.authLogin;
      url.searchParams.set('redirect', pathname);
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.headers.set('x-request-id', requestId);
      return redirectResponse;
    }
  }

  // =====================================================
  // ソフト認証パス: Cookie存在チェックのみ
  // 認証保証は DashboardPageShell / UserShell に委譲
  // =====================================================

  // Next.js プリフェッチリクエストの検出
  // プリフェッチは Cookie なしで送信されることがあるため、リダイレクトしない
  const isPrefetch = request.headers.get('Next-Router-Prefetch') === '1' ||
                     request.headers.get('RSC') === '1' ||
                     request.headers.get('Purpose') === 'prefetch';

  // デバッグ: ソフト認証パスへのすべてのリクエストをログ
  if (isSoftAuthPath) {
    console.log('[middleware] soft-auth check', {
      sha: DEPLOY_SHA,
      requestId,
      path: pathname,
      hasAuthCookie,
      allCookieCount: allCookies.length,
      sbCookieNames: sbCookies.map(c => c.name),
      isPrefetch,
    });
  }

  if (isSoftAuthPath && !hasAuthCookie && !isPrefetch) {
    // 完全未ログイン（Cookie無し）のみブロック
    // ただしプリフェッチリクエストはリダイレクトしない（Cookie送信されないため）
    console.warn('[middleware] soft-auth REDIRECT (no auth cookie)', {
      sha: DEPLOY_SHA,
      requestId,
      path: pathname,
      sbCookieNames: sbCookies.map(c => c.name),
      allCookieCount: allCookies.length,
      hasAuthCookie,
    });

    const url = request.nextUrl.clone();
    url.pathname = ROUTES.authLogin;
    url.searchParams.set('redirect', pathname);
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.headers.set('x-request-id', requestId);
    return redirectResponse;
  }

  // =====================================================
  // 認証ページ: ログイン済みなら /dashboard へ
  // =====================================================
  if (isAuthPath && hasAuthCookie) {
    // Cookie があれば認証済みとみなしてリダイレクト
    // 厳密チェックはしない（ログインページ表示の遅延を避ける）
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.dashboard;
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.headers.set('x-request-id', requestId);
    return redirectResponse;
  }

  // その他はresponse（Cookie更新済み）をそのまま返す
  // x-request-id ヘッダーを追加
  response.headers.set('x-request-id', requestId);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|static).*)',
  ],
};