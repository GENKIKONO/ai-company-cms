// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// 公開ルート（常に素通し）
const PUBLIC_PATHS = new Set([
  '/', '/help', '/contact', '/terms', '/privacy',
  '/auth/login', '/login',
  '/auth/signin',
  '/auth/signup', '/signup',
  '/auth/confirm',
  '/auth/forgot-password',
  '/auth/reset-password-confirm',
  '/search',
]);

// 要ログインのプレフィックス  
const PROTECTED_PREFIXES = ['/dashboard', '/settings', '/profile'];

// 管理者専用パス（admin判定が必要）
const ADMIN_PATHS = ['/management-console'];

// 半公開ルート（ディレクトリ表示は公開、編集は要ログイン）
const SEMI_PUBLIC_PREFIXES = ['/organizations'];

// 認証系ページ（ログイン済ならリダイレクト）
const AUTH_PAGES = new Set([
  '/auth/login', '/login',
  '/auth/signin',
  '/auth/signup', '/signup',
  '/auth/forgot-password',
  '/auth/reset-password-confirm',
]);

export async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;

    // Next内部・API・静的リソースは対象外
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml' ||
      pathname.startsWith('/og-image') ||
      pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|webp)$/)
    ) {
      return NextResponse.next();
    }

    console.log(`[Middleware] Processing: ${pathname}`);

  // 公開パスは認証チェック不要
  if (PUBLIC_PATHS.has(pathname)) {
    console.log(`[Middleware] Public path, skipping auth: ${pathname}`);
    return NextResponse.next();
  }

  // Supabase SSR クライアント（セキュアCookie設定付き）
  const res = NextResponse.next();
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = isProduction && process.env.NEXT_PUBLIC_APP_URL?.includes('aiohub.jp') 
    ? '.aiohub.jp' 
    : undefined;
    
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          const secureOptions = {
            ...options,
            sameSite: 'lax' as const,
            secure: isProduction,
            domain,
            path: '/',
            httpOnly: false, // Supabase needs client access to auth tokens
          };
          res.cookies.set(name, value, secureOptions);
        },
        remove: (name: string, options: any) => {
          const secureOptions = {
            ...options,
            sameSite: 'lax' as const,
            secure: isProduction,
            domain,
            path: '/',
            maxAge: 0,
          };
          res.cookies.set(name, '', secureOptions);
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isAuthed = !!user;
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  const isSemiPublic = SEMI_PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.has(pathname);
  const isAdminPath = ADMIN_PATHS.some(p => pathname.startsWith(p));

  console.log(`[Middleware] Auth check: ${pathname}, isAuthed: ${isAuthed}, isProtected: ${isProtected}, isAuthPage: ${isAuthPage}`);

  // 半公開ルートの処理（/organizations/new や /organizations/[id]/edit は要ログイン）
  const requiresAuthInSemiPublic = isSemiPublic && (
    pathname.includes('/new') || 
    pathname.includes('/edit') ||
    pathname.match(/\/organizations\/[^\/]+\/(edit|settings)$/)
  );

  // 未ログインで保護ページ、または半公開の編集ページ、または管理者ページに来たら /auth/login に intended redirect 付きで送る
  if (!isAuthed && (isProtected || requiresAuthInSemiPublic || isAdminPath)) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 管理者ページの場合は追加チェック（ログイン済みでも非管理者は /dashboard へ）
  if (isAdminPath && isAuthed) {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    const isAdmin = user?.app_metadata?.role === 'admin' || adminEmails.includes(user?.email || '');
    
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // ログイン済みで認証系ページに来たら /dashboard へ
  if (isAuthed && isAuthPage) {
    const redirectParam = req.nextUrl.searchParams.get('redirect');
    const target =
      redirectParam && PROTECTED_PREFIXES.some(p => redirectParam.startsWith(p))
        ? redirectParam
        : '/dashboard';
    return NextResponse.redirect(new URL(target, req.url));
  }

    // それ以外はそのまま通過
    return res;
  } catch (error) {
    console.error('[Middleware] Exception caught:', error);
    // 例外時は素通り（フォールバック）
    return NextResponse.next();
  }
}

// API と静的は除外（包括的マッチャー）
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};