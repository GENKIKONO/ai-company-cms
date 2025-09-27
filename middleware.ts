// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// 公開ルート（常に素通し）
const PUBLIC_PATHS = new Set([
  '/', '/help', '/contact', '/terms', '/privacy',
  '/auth/login', '/login',
  '/auth/signup', '/signup',
  '/auth/confirm',
  '/auth/forgot-password',
  '/auth/reset-password-confirm',
  '/search',
]);

// 要ログインのプレフィックス  
const PROTECTED_PREFIXES = ['/dashboard', '/settings', '/profile'];

// 半公開ルート（ディレクトリ表示は公開、編集は要ログイン）
const SEMI_PUBLIC_PREFIXES = ['/organizations'];

// 認証系ページ（ログイン済ならリダイレクト）
const AUTH_PAGES = new Set([
  '/auth/login', '/login',
  '/auth/signup', '/signup',
  '/auth/forgot-password',
  '/auth/reset-password-confirm',
]);

export async function middleware(req: NextRequest) {
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

  // 公開パスは認証チェック不要
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // Supabase SSR クライアント（最小・公式推奨パターン）
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          // ❗ request ではなく response 側にのみセット
          res.cookies.set(name, value, options);
        },
        remove: (name: string, options: any) => {
          res.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isAuthed = !!user;
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  const isSemiPublic = SEMI_PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.has(pathname);

  // 半公開ルートの処理（/organizations/new や /organizations/[id]/edit は要ログイン）
  const requiresAuthInSemiPublic = isSemiPublic && (
    pathname.includes('/new') || 
    pathname.includes('/edit') ||
    pathname.match(/\/organizations\/[^\/]+\/(edit|settings)$/)
  );

  // 未ログインで保護ページ、または半公開の編集ページに来たら /auth/login に intended redirect 付きで送る
  if (!isAuthed && (isProtected || requiresAuthInSemiPublic)) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
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
}

// API と静的は除外（最小マッチャー）
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};