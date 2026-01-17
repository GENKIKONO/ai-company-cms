/**
 * Email/Password Login Route Handler - 自己検証型
 *
 * サーバーサイドで signInWithPassword を実行し、Cookie 契約を保証する。
 *
 * 自己検証:
 * - signIn 成功後、response.cookies.getAll() で Cookie を機械判定
 * - auth-token / refresh-token が不足していれば強制補完
 * - 補完後も auth-token が存在しなければ 500 エラー
 *
 * レスポンス契約:
 * - GET: 200 + { ok: true, route, methods, sha, timestamp }（診断用）
 * - POST 失敗時: HTTP 401 で { ok: false, code, message, requestId }
 * - POST 成功時: HTTP 200 で { ok: true, requestId } + Set-Cookie
 * - Cookie契約違反: HTTP 500 で { ok: false, code: COOKIE_CONTRACT_BROKEN }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Supabase プロジェクト参照を環境変数から取得
function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'unknown';
}

/**
 * GET /api/auth/login - 診断用エンドポイント
 */
export async function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
              process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
              'unknown';

  return NextResponse.json({
    ok: true,
    route: '/api/auth/login',
    methods: ['GET', 'POST'],
    sha,
    timestamp: new Date().toISOString(),
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
}

// Cookie 判定ヘルパー
function hasAuthTokenCookie(cookieNames: string[], projectRef: string): boolean {
  const pattern = new RegExp(`^sb-${projectRef}-auth-token(\\.\\d+)?$`);
  return cookieNames.some(name => pattern.test(name));
}

function hasRefreshTokenCookie(cookieNames: string[], projectRef: string): boolean {
  return cookieNames.includes(`sb-${projectRef}-refresh-token`);
}

// チャンク化ヘルパー
function chunkString(str: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
              process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
              'unknown';
  const host = request.headers.get('host') || 'unknown';
  const proto = request.headers.get('x-forwarded-proto') || 'unknown';
  const projectRef = getProjectRef();
  const isSecure = proto === 'https';

  // Cookie サイズ上限（余裕を持たせる）
  const MAX_COOKIE_SIZE = 3500;

  try {
    const body = await request.json();
    const { email, password, redirectTo } = body;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'メールアドレスとパスワードは必須です', code: 'missing_credentials', requestId },
        { status: 400 }
      );
    }

    // ========================================
    // A-1: 返却する NextResponse を最初に作る
    // ========================================
    const response = NextResponse.json(
      {
        ok: true,
        redirectTo: redirectTo || '/dashboard',
        requestId,
      },
      { status: 200 }
    );

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
            // Supabase SSR が設定する Cookie をそのまま response にセット
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                path: '/',  // 必ず "/" にする
              });
            });

            console.log('[api/auth/login] setAll called', {
              requestId,
              count: cookiesToSet.length,
              names: cookiesToSet.map(c => c.name),
            });
          },
        },
      }
    );

    // サーバーサイドで signInWithPassword を実行
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[api/auth/login] signInWithPassword error', {
        requestId,
        errorCode: error.code,
        errorMessage: error.message,
      });

      let errorMessage = error.message;
      let errorCode = error.code || 'unknown_error';

      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
        errorCode = 'invalid_credentials';
      } else if (
        error.message.includes('Email not confirmed') ||
        error.message.includes('email_not_confirmed')
      ) {
        errorMessage = 'メールアドレスが確認されていません。';
        errorCode = 'email_not_confirmed';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = '試行回数が上限に達しました。しばらく時間をおいてからお試しください。';
        errorCode = 'too_many_requests';
      }

      return NextResponse.json(
        { ok: false, error: errorMessage, code: errorCode, message: errorMessage, requestId },
        { status: 401 }
      );
    }

    if (!data.session) {
      console.error('[api/auth/login] No session created', { requestId });
      return NextResponse.json(
        { ok: false, error: 'セッションの作成に失敗しました', code: 'no_session', requestId },
        { status: 500 }
      );
    }

    // ========================================
    // A-2: response.cookies.getAll() で機械判定
    // ========================================
    const currentCookies = response.cookies.getAll();
    let cookieNames = currentCookies.map(c => c.name);

    console.log('[api/auth/login] After signIn - Cookie check', {
      requestId,
      cookieNames,
      hasAuthToken: hasAuthTokenCookie(cookieNames, projectRef),
      hasRefreshToken: hasRefreshTokenCookie(cookieNames, projectRef),
    });

    // auth-token が不足していれば強制補完
    if (!hasAuthTokenCookie(cookieNames, projectRef) && data.session.access_token) {
      console.log('[api/auth/login] auth-token missing, force setting', { requestId });

      const authTokenCookieName = `sb-${projectRef}-auth-token`;
      const accessToken = data.session.access_token;

      if (accessToken.length <= MAX_COOKIE_SIZE) {
        // 単一 Cookie
        response.cookies.set(authTokenCookieName, accessToken, {
          path: '/',
          secure: isSecure,
          sameSite: 'lax',
          httpOnly: false,
          maxAge: 3600,
        });
      } else {
        // チャンク化
        const chunks = chunkString(accessToken, MAX_COOKIE_SIZE);
        chunks.forEach((chunk, index) => {
          response.cookies.set(`${authTokenCookieName}.${index}`, chunk, {
            path: '/',
            secure: isSecure,
            sameSite: 'lax',
            httpOnly: false,
            maxAge: 3600,
          });
        });

        console.log('[api/auth/login] auth-token chunked', {
          requestId,
          chunkCount: chunks.length,
        });
      }
    }

    // refresh-token が不足していれば強制補完
    if (!hasRefreshTokenCookie(cookieNames, projectRef) && data.session.refresh_token) {
      console.log('[api/auth/login] refresh-token missing, force setting', { requestId });

      response.cookies.set(`sb-${projectRef}-refresh-token`, data.session.refresh_token, {
        path: '/',
        secure: isSecure,
        sameSite: 'lax',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 365, // 1年
      });
    }

    // ========================================
    // A-3: 自己検証 - 補完後も確認して失敗なら 500
    // ========================================
    const finalCookies = response.cookies.getAll();
    const finalCookieNames = finalCookies.map(c => c.name);

    const finalHasAuthToken = hasAuthTokenCookie(finalCookieNames, projectRef);
    const finalHasRefreshToken = hasRefreshTokenCookie(finalCookieNames, projectRef);

    console.log('[api/auth/login] Final verification', {
      requestId,
      finalCookieNames,
      finalHasAuthToken,
      finalHasRefreshToken,
    });

    // auth-token がない場合は契約違反
    if (!finalHasAuthToken) {
      console.error('[api/auth/login] COOKIE_CONTRACT_BROKEN: auth-token still missing', {
        requestId,
        finalCookieNames,
        accessTokenAvailable: !!data.session.access_token,
        accessTokenLength: data.session.access_token?.length,
      });

      return NextResponse.json(
        {
          ok: false,
          code: 'COOKIE_CONTRACT_BROKEN',
          message: 'auth-token Cookie の設定に失敗しました',
          cookieNames: finalCookieNames,
          requestId,
          sha,
        },
        { status: 500 }
      );
    }

    // refresh-token がない場合も警告（ただしログインは成功扱い）
    if (!finalHasRefreshToken) {
      console.warn('[api/auth/login] WARNING: refresh-token missing', {
        requestId,
        finalCookieNames,
      });
    }

    console.log('[api/auth/login] Login successful with valid cookie contract', {
      requestId,
      userId: data.user?.id,
      finalCookieNames,
    });

    // デバッグヘッダを付与
    response.headers.set('x-auth-request-id', requestId);
    response.headers.set('x-auth-cookie-names', finalCookieNames.join(','));
    response.headers.set('x-auth-has-auth-token', String(finalHasAuthToken));
    response.headers.set('x-auth-has-refresh-token', String(finalHasRefreshToken));
    response.headers.set('x-auth-supabase-ref', projectRef);
    response.headers.set('x-auth-host', host);
    response.headers.set('x-auth-proto', proto);

    return response;

  } catch (error) {
    console.error('[api/auth/login] Unexpected error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { ok: false, error: 'ログイン処理中にエラーが発生しました', code: 'unexpected_error', requestId },
      { status: 500 }
    );
  }
}
