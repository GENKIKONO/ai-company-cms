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
  const requestId = crypto.randomUUID();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';
  const origin = requestUrl.origin;

  // 診断ログ: リクエスト情報
  console.log('[auth/callback] Request received', {
    requestId,
    hasCode: !!code,
    origin,
    host: request.headers.get('host'),
    xForwardedProto: request.headers.get('x-forwarded-proto'),
  });

  if (!code) {
    console.error('[auth/callback] No code provided', { requestId });
    return NextResponse.redirect(
      `${origin}/auth/login?error=no_code&rid=${requestId.slice(0, 8)}`
    );
  }

  // Cookie を設定するための response を作成
  const response = NextResponse.redirect(`${origin}${next}`);

  let setCookieCount = 0;

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
          setCookieCount = cookiesToSet.length;

          // 診断ログ: Set-Cookie が呼ばれたか確認
          console.log('[auth/callback] setAll called', {
            requestId,
            cookieCount: cookiesToSet.length,
            cookieNames: cookiesToSet.map(c => c.name),
            cookieDetails: cookiesToSet.map(c => ({
              name: c.name,
              valueLength: c.value?.length || 0,
              options: c.options,
            })),
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            // Cookie オプションを明示的に設定（Supabase のデフォルトを尊重しつつ確実に動作させる）
            const cookieOptions = {
              ...options,
              // path は必ず / を設定（全ページで有効にする）
              path: options?.path || '/',
              // SameSite は lax を推奨
              sameSite: options?.sameSite || 'lax' as const,
              // Secure は本番環境のみ
              secure: options?.secure ?? process.env.NODE_ENV === 'production',
            };

            console.log('[auth/callback] Setting cookie', {
              requestId,
              name,
              valueLength: value?.length || 0,
              options: cookieOptions,
            });

            response.cookies.set(name, value, cookieOptions);
          });
        },
      },
    }
  );

  // code をセッションに交換（これがサーバー側で Cookie を発行）
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error', {
      requestId,
      errorMessage: error.message,
      errorCode: error.code,
    });
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error.message)}&rid=${requestId.slice(0, 8)}`
    );
  }

  // 成功ログ: 実際に設定されるCookie名を確認
  const setCookieHeaders = response.headers.getSetCookie();
  console.log('[auth/callback] Session established', {
    requestId,
    redirectTo: next,
    setCookieCount,
    actualSetCookieCount: setCookieHeaders.length,
    setCookieNames: setCookieHeaders.map(h => h.split('=')[0]),
  });

  return response;
}
