import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

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
  const protectedPaths = ['/dashboard', '/admin', '/management-console', '/my'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // 認証ページ（ログイン済みなら /dashboard へ）
  const authPaths = ['/auth/login', '/auth/signin', '/login', '/signin'];
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));


  // 未認証ユーザーが保護されたページにアクセス
  if (isProtectedPath && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 認証済みユーザーが認証ページにアクセス
  if (isAuthPath && isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
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