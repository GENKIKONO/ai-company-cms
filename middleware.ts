import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// 公開ルート（ミドルウェア対象外）
const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/confirm', // メール確認後の遷移で常に素通し
  '/auth/forgot-password',
  '/auth/reset-password-confirm',
  '/login', // middleware path alignment
  '/help',
  '/contact',
  '/terms',
  '/privacy'
];

// 保護対象のルートプレフィックス（要ログイン）
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/organizations',
  '/settings',
  '/profile'
];

// 認証系ページ（ログイン済みの場合はダッシュボードにリダイレクト）
const AUTH_PAGES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password-confirm',
  '/login' // middleware path alignment
];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // 静的アセット、API、Next.js内部ルートはスキップ
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/) ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.startsWith('/og-image')
  ) {
    return NextResponse.next();
  }

  // 公開ルートは素通し
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Supabaseクライアント作成
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // セッション確認
  const { data: { user }, error } = await supabase.auth.getUser();
  const isAuthenticated = !!user && !error;
  
  // 保護ルートかチェック
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // 認証ガードロジック
  if (!isAuthenticated && isProtectedRoute) {
    // 未ログイン & 保護ルート → ログインページへリダイレクト（intended redirect付き）
    const loginUrl = new URL('/auth/login', request.url);
    
    // 無限リダイレクト防止：既に/auth/loginで、redirectが/auth/loginを指す場合は素通し
    if (pathname === '/auth/login' && searchParams.get('redirect') === '/auth/login') {
      return NextResponse.next();
    }
    
    // 現在のパスをredirectパラメータとして追加
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAuthPage) {
    // ログイン済み & 認証系ページ → ダッシュボードへリダイレクト
    // ただし、redirectパラメータがある場合は適切な遷移先を決定
    const redirectParam = searchParams.get('redirect');
    let targetUrl = '/dashboard';
    
    // redirectパラメータが有効な保護ルートの場合はそれを使用
    if (redirectParam && 
        !PUBLIC_PATHS.includes(redirectParam) && 
        PROTECTED_PREFIXES.some(prefix => redirectParam.startsWith(prefix))) {
      targetUrl = redirectParam;
    }
    
    const dashboardUrl = new URL(targetUrl, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next (Next.js internal routes)  
     * - favicon, robots, sitemap (static files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};