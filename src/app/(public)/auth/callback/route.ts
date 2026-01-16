/**
 * Auth Callback Route Handler
 *
 * OAuth/PKCE フローで Supabase からのコールバックを処理し、
 * サーバー側でセッション Cookie を発行する。
 *
 * @supabase/ssr の推奨パターンに準拠
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';
  const origin = requestUrl.origin;

  if (!code) {
    // code がない場合はエラーページへ
    console.error('[auth/callback] No code provided');
    return NextResponse.redirect(
      `${origin}/auth/login?error=no_code`
    );
  }

  // Cookie を設定するための response を作成
  const response = NextResponse.redirect(`${origin}${next}`);

  // サーバー側 Supabase クライアントを作成
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
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // code をセッションに交換（これがサーバー側で Cookie を発行）
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message);
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
    );
  }

  console.log('[auth/callback] Session established, redirecting to:', next);
  return response;
}
