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
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  // =====================================================
  const hasAuthCookie = request.cookies.getAll().some(cookie =>
    cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
  );

  // =====================================================
  // 厳密認証パス: getUser() で検証
  // =====================================================
  if (isStrictAuthPath) {
    const { data: { user }, error } = await supabase.auth.getUser();
    const isLoggedIn = user && !error;

    if (!isLoggedIn) {
      // デバッグ用ログ（再発時の原因特定用）
      console.warn('[middleware] Strict auth failed', {
        path: pathname,
        hasAuthCookie,
        errorCode: error?.code,
      });

      const url = request.nextUrl.clone();
      url.pathname = ROUTES.authLogin;
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // =====================================================
  // ソフト認証パス: Cookie存在チェックのみ
  // 認証保証は DashboardPageShell / UserShell に委譲
  // =====================================================
  if (isSoftAuthPath && !hasAuthCookie) {
    // 完全未ログイン（Cookie無し）のみブロック
    // デバッグ用ログ
    console.warn('[middleware] Soft auth failed - no auth cookie', {
      path: pathname,
      cookies: request.cookies.getAll().map(c => c.name).filter(n => n.startsWith('sb-')),
    });

    const url = request.nextUrl.clone();
    url.pathname = ROUTES.authLogin;
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // =====================================================
  // 認証ページ: ログイン済みなら /dashboard へ
  // =====================================================
  if (isAuthPath && hasAuthCookie) {
    // Cookie があれば認証済みとみなしてリダイレクト
    // 厳密チェックはしない（ログインページ表示の遅延を避ける）
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.dashboard;
    return NextResponse.redirect(url);
  }

  // その他はresponse（Cookie更新済み）をそのまま返す
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