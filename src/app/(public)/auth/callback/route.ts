/**
 * Auth Callback Route Handler
 *
 * OAuth/PKCE フローで Supabase からのコールバックを処理し、
 * サーバー側でセッション Cookie を発行する。
 *
 * @supabase/ssr の推奨パターンに準拠
 *
 * 重要: 古いCookieが残っていると新しいセッションと競合するため、
 * exchangeCodeForSession の前に古いSupabase Cookieをクリアする
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Supabase project ref を抽出（URLから取得）
const getProjectRef = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] || '';
};

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';
  const origin = requestUrl.origin;
  const projectRef = getProjectRef();

  // 診断ログ: リクエスト情報
  console.log('[auth/callback] Request received', {
    requestId,
    hasCode: !!code,
    origin,
    host: request.headers.get('host'),
    xForwardedProto: request.headers.get('x-forwarded-proto'),
    projectRef,
  });

  if (!code) {
    console.error('[auth/callback] No code provided', { requestId });
    return NextResponse.redirect(
      `${origin}/auth/login?error=no_code&rid=${requestId.slice(0, 8)}`
    );
  }

  // Cookie を設定するための response を作成
  const response = NextResponse.redirect(`${origin}${next}`);

  // =====================================================
  // 重要: 古いSupabase Cookieをクリア
  // 古いセッションのCookieが残っていると、新しいセッションと競合して
  // トークンローテーションが正しく機能しない
  // =====================================================
  const existingCookies = request.cookies.getAll();
  const supabaseCookiePattern = new RegExp(`^sb-${projectRef}-(auth-token|refresh-token)(\\.\\d+)?$`);

  existingCookies.forEach(cookie => {
    if (supabaseCookiePattern.test(cookie.name)) {
      console.log('[auth/callback] Clearing old cookie', {
        requestId,
        name: cookie.name,
      });
      // 古いCookieを削除（maxAge: 0 で即座に失効させる）
      response.cookies.set(cookie.name, '', {
        path: '/',
        maxAge: 0,
      });
    }
  });

  let setCookieCount = 0;
  const setCookieNames: string[] = [];

  // サーバー側 Supabase クライアントを作成
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // 古いCookieを除外して返す（クリア済みのため新しい値を使用）
          return [];
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
            setCookieNames.push(name);

            // Cookie オプションを明示的に設定（Supabase のデフォルトを尊重しつつ確実に動作させる）
            const cookieOptions = {
              ...options,
              // path は必ず / を設定（全ページで有効にする）
              path: options?.path || '/',
              // SameSite は lax を推奨
              sameSite: options?.sameSite || 'lax' as const,
              // Secure は本番環境のみ
              secure: options?.secure ?? process.env.NODE_ENV === 'production',
              // httpOnly は false を明示（クライアント側JSからアクセス可能にする）
              // Supabaseのデフォルトに従う
              httpOnly: options?.httpOnly ?? false,
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
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

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
    setCookieNames,
    actualSetCookieCount: setCookieHeaders.length,
    actualSetCookieNames: setCookieHeaders.map(h => h.split('=')[0]),
    hasSession: !!data?.session,
    hasUser: !!data?.user,
    userId: data?.user?.id,
  });

  return response;
}
