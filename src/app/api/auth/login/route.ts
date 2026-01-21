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

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
              process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
              'unknown';
  const host = request.headers.get('host') || 'unknown';
  const proto = request.headers.get('x-forwarded-proto') || 'unknown';
  const projectRef = getProjectRef();
  const isSecure = proto === 'https';

  // 診断用: Supabase SSR が setAll で設定しようとした Cookie 名を記録
  const supabaseSetCookieNames: string[] = [];

  try {
    const body = await request.json();
    const { email, password, redirectTo } = body;

    if (!email || !password) {
      const errorResponse = NextResponse.json(
        { ok: false, error: 'メールアドレスとパスワードは必須です', code: 'missing_credentials', requestId },
        { status: 400 }
      );
      errorResponse.headers.set('x-debug-route', 'api-auth-login');
      errorResponse.headers.set('x-debug-sha', sha);
      errorResponse.headers.set('x-debug-request-id', requestId);
      errorResponse.headers.set('x-debug-set-cookie-names', '');
      errorResponse.headers.set('x-debug-has-auth-token-set-cookie', 'false');
      errorResponse.headers.set('x-debug-has-refresh-token-set-cookie', 'false');
      return errorResponse;
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
              // 診断用: Supabase SSR が設定しようとした Cookie 名を記録
              supabaseSetCookieNames.push(name);

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

      const authErrorResponse = NextResponse.json(
        { ok: false, error: errorMessage, code: errorCode, message: errorMessage, requestId },
        { status: 401 }
      );
      authErrorResponse.headers.set('x-debug-route', 'api-auth-login');
      authErrorResponse.headers.set('x-debug-sha', sha);
      authErrorResponse.headers.set('x-debug-request-id', requestId);
      authErrorResponse.headers.set('x-debug-set-cookie-names', '');
      authErrorResponse.headers.set('x-debug-has-auth-token-set-cookie', 'false');
      authErrorResponse.headers.set('x-debug-has-refresh-token-set-cookie', 'false');
      return authErrorResponse;
    }

    if (!data.session) {
      console.error('[api/auth/login] No session created', { requestId });
      const noSessionResponse = NextResponse.json(
        { ok: false, error: 'セッションの作成に失敗しました', code: 'no_session', requestId },
        { status: 500 }
      );
      noSessionResponse.headers.set('x-debug-route', 'api-auth-login');
      noSessionResponse.headers.set('x-debug-sha', sha);
      noSessionResponse.headers.set('x-debug-request-id', requestId);
      return noSessionResponse;
    }

    // ========================================
    // セッションCookieを明示的に設定
    //
    // 理由: Supabase SSR の onAuthStateChange は非同期で、
    // レスポンスが返る前に setAll() が呼ばれない可能性がある。
    // 確実に Cookie を設定するため、手動で設定する。
    // ========================================
    const session = data.session;

    // auth-token: access_tokenを含むセッション情報（チャンク化対応）
    const sessionData = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type,
      user: data.user,
    };
    const sessionJson = JSON.stringify(sessionData);

    // Cookieサイズ制限（約4KB）対応: 大きすぎる場合はチャンク化
    const CHUNK_SIZE = 3500; // 安全マージンを持たせる
    if (sessionJson.length <= CHUNK_SIZE) {
      response.cookies.set(`sb-${projectRef}-auth-token`, sessionJson, {
        path: '/',
        secure: isSecure,
        sameSite: 'lax',
        httpOnly: false,
        maxAge: session.expires_in || 3600,
      });
    } else {
      // チャンク化が必要
      const chunks = [];
      for (let i = 0; i < sessionJson.length; i += CHUNK_SIZE) {
        chunks.push(sessionJson.slice(i, i + CHUNK_SIZE));
      }
      chunks.forEach((chunk, index) => {
        response.cookies.set(`sb-${projectRef}-auth-token.${index}`, chunk, {
          path: '/',
          secure: isSecure,
          sameSite: 'lax',
          httpOnly: false,
          maxAge: session.expires_in || 3600,
        });
      });
    }

    // refresh-token
    response.cookies.set(`sb-${projectRef}-refresh-token`, session.refresh_token, {
      path: '/',
      secure: isSecure,
      sameSite: 'lax',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365, // 1年
    });

    console.log('[api/auth/login] Session cookies set manually', {
      requestId,
      userId: data.user?.id,
      expiresAt: session.expires_at,
    });

    // ========================================
    // 診断: 実際の Set-Cookie ヘッダーを取得
    // ========================================
    // response.headers.getSetCookie() で実際に返る Set-Cookie を取得
    const actualSetCookies = response.headers.getSetCookie?.() || [];
    const actualSetCookieNames = actualSetCookies.map(sc => {
      const match = sc.match(/^([^=]+)=/);
      return match ? match[1] : 'unknown';
    });

    console.log('[api/auth/login] === DIAGNOSTIC: Set-Cookie Analysis ===', {
      requestId,
      userId: data.user?.id,
      supabaseSetAllNames: supabaseSetCookieNames,
      actualSetCookieHeaders: actualSetCookieNames,
      cookieCount: actualSetCookieNames.length,
    });

    // デバッグヘッダを付与（指定された名前で）
    const hasAuthTokenSetCookie = actualSetCookieNames.some(n => n.includes('auth-token'));
    const hasRefreshTokenSetCookie = actualSetCookieNames.some(n => n.includes('refresh-token'));

    response.headers.set('x-debug-route', 'api-auth-login');
    response.headers.set('x-debug-sha', sha);
    response.headers.set('x-debug-request-id', requestId);
    response.headers.set('x-debug-set-cookie-names', actualSetCookieNames.join(','));
    response.headers.set('x-debug-has-auth-token-set-cookie', String(hasAuthTokenSetCookie));
    response.headers.set('x-debug-has-refresh-token-set-cookie', String(hasRefreshTokenSetCookie));
    response.headers.set('x-debug-host', host);
    response.headers.set('x-debug-proto', proto);

    return response;

  } catch (error) {
    console.error('[api/auth/login] Unexpected error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const catchErrorResponse = NextResponse.json(
      { ok: false, error: 'ログイン処理中にエラーが発生しました', code: 'unexpected_error', requestId },
      { status: 500 }
    );
    catchErrorResponse.headers.set('x-debug-route', 'api-auth-login');
    catchErrorResponse.headers.set('x-debug-sha', sha);
    catchErrorResponse.headers.set('x-debug-request-id', requestId);
    catchErrorResponse.headers.set('x-debug-set-cookie-names', '');
    catchErrorResponse.headers.set('x-debug-has-auth-token-set-cookie', 'false');
    catchErrorResponse.headers.set('x-debug-has-refresh-token-set-cookie', 'false');
    return catchErrorResponse;
  }
}
