/**
 * Email/Password Login Route Handler
 *
 * @supabase/ssr パターンを Route Handler に適用:
 * - request.cookies で読み取り + setAll で更新
 * - 最終レスポンスに Cookie を直接設定
 *
 * レスポンス契約:
 * - GET: 200 + { ok: true, route, methods, sha, timestamp }（診断用）
 * - POST 失敗時: HTTP 401 で { ok: false, code, message, requestId }
 * - POST 成功時: HTTP 200 で { ok: true, requestId } + Set-Cookie
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

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

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
              process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
              'unknown';
  const host = request.headers.get('host') || 'unknown';
  const proto = request.headers.get('x-forwarded-proto') || 'unknown';
  const projectRef = getProjectRef();

  // setAll で設定された Cookie を収集
  const cookiesToSetOnResponse: Array<{ name: string; value: string; options: CookieOptions }> = [];

  try {
    const body = await request.json();
    const { email, password, redirectTo } = body;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'メールアドレスとパスワードは必須です', code: 'missing_credentials', requestId },
        { status: 400 }
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const allCookies = request.cookies.getAll();
            console.log('[api/auth/login] getAll called', {
              requestId,
              count: allCookies.length,
              names: allCookies.map(c => c.name),
            });
            return allCookies;
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
            console.log('[api/auth/login] setAll called', {
              requestId,
              count: cookiesToSet.length,
              names: cookiesToSet.map(c => c.name),
            });

            // request.cookies を更新（後続の getAll が最新値を返すように）
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });

            // レスポンスに設定する Cookie を収集
            cookiesToSet.forEach(({ name, value, options }) => {
              cookiesToSetOnResponse.push({ name, value, options });
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

    // Cookie 検証（診断用）
    const setCookieNames = cookiesToSetOnResponse.map(c => c.name);
    const finalHasAuthToken = hasAuthTokenCookie(setCookieNames, projectRef);

    console.log('[api/auth/login] Cookie verification', {
      requestId,
      setCookieNames,
      finalHasAuthToken,
      sessionAccessToken: !!data.session.access_token,
      sessionRefreshToken: !!data.session.refresh_token,
    });

    // レスポンス作成
    const response = NextResponse.json(
      {
        ok: true,
        redirectTo: redirectTo || '/dashboard',
        requestId,
      },
      { status: 200 }
    );

    // 収集した Cookie をレスポンスに設定
    cookiesToSetOnResponse.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, {
        ...options,
        path: options.path || '/',
      });
    });

    console.log('[api/auth/login] Login successful', {
      requestId,
      userId: data.user?.id,
      cookiesSet: setCookieNames,
    });

    // デバッグヘッダを付与（診断用）
    response.headers.set('x-auth-request-id', requestId);
    response.headers.set('x-auth-set-cookie-names', setCookieNames.join(','));
    response.headers.set('x-auth-has-auth-token', String(finalHasAuthToken));
    response.headers.set('x-auth-supabase-ref', projectRef);
    response.headers.set('x-auth-host', host);
    response.headers.set('x-auth-proto', proto);
    response.headers.set('x-auth-sha', sha);

    return response;

  } catch (error) {
    console.error('[api/auth/login] Unexpected error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { ok: false, error: 'ログイン処理中にエラーが発生しました', code: 'unexpected_error', requestId },
      { status: 500 }
    );
  }
}
