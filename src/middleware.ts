import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;

  // 静的ファイル、API、auth callbackは認証チェックから除外
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
    return response;
  }

  // Supabase認証処理
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 認証状態を確認
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // 認証が必要なページ
  const protectedPaths = ['/dashboard', '/admin', '/management-console', '/my'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // 認証ページ
  const authPaths = ['/auth/login', '/auth/signin', '/login', '/signin'];
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));

  // 未認証ユーザーが保護されたページにアクセス
  if (isProtectedPath && (!user || error)) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 認証済みユーザーが認証ページにアクセス
  if (isAuthPath && user && !error) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // ルートページの処理
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    if (user && !error) {
      url.pathname = '/dashboard';
    } else {
      url.pathname = '/auth/login';
    }
    return NextResponse.redirect(url);
  }

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