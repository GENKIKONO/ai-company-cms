import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import { ROUTES, PROTECTED_ROUTE_PREFIXES } from '@/lib/routes';

/**
 * 認証ミドルウェア
 *
 * 【責務】
 * - 未認証ユーザーを /auth/login へリダイレクト
 * - 認証済みユーザーが認証ページにアクセスした場合 /dashboard へリダイレクト
 * - Supabase セッションの Cookie 同期
 *
 * 【ハードコード禁止】
 * - 保護パスは PROTECTED_ROUTE_PREFIXES (src/lib/routes.ts) を参照
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

  // 認証状態確認（getUser使用、getSessionは不可）
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isLoggedIn = user && !error;

  // 保護されたパス（未ログインなら /auth/login へ）
  // ⚠️ PROTECTED_ROUTE_PREFIXES を Single Source of Truth として使用
  const isProtectedPath = PROTECTED_ROUTE_PREFIXES.some(path => pathname.startsWith(path));

  // 認証ページ（ログイン済みなら /dashboard へ）
  // ⚠️ ROUTES 定数を使用してハードコードを排除
  const authPaths = [ROUTES.authLogin, ROUTES.authSignin, ROUTES.login, ROUTES.signin];
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));

  // 未認証ユーザーが保護されたページにアクセス
  if (isProtectedPath && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.authLogin;
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 認証済みユーザーが認証ページにアクセス
  if (isAuthPath && isLoggedIn) {
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