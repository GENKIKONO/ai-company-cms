/**
 * Email/Password Login Route Handler - Supabase SSR 公式パターン準拠版
 *
 * @supabase/ssr 公式パターンに完全準拠:
 * - cookies() (next/headers) を使用してCookieの読み書き
 * - getAll/setAll でCookieブリッジを実装
 * - cookieStore.set() でNext.jsが自動的にSet-Cookieヘッダーを追加
 *
 * レスポンス契約:
 * - GET: 200 + { ok: true, route, methods, sha, timestamp }（診断用）
 * - POST 失敗時: HTTP 401 で { ok: false, code, message, requestId }
 * - POST 成功時: HTTP 200 で { ok: true, requestId } + Set-Cookie
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

  // 診断用: setAll で設定された Cookie 名を記録
  const setCookieNames: string[] = [];

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
    // 公式パターン: cookies() (next/headers) を使用
    // Route Handler では cookieStore.set() が呼ばれると
    // Next.js が自動的にレスポンスに Set-Cookie ヘッダーを追加
    // ========================================
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const allCookies = cookieStore.getAll();
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

            // Cookie を直接 cookieStore に設定
            // Next.js が自動的にレスポンスの Set-Cookie ヘッダーに追加
            cookiesToSet.forEach(({ name, value, options }) => {
              setCookieNames.push(name);
              try {
                cookieStore.set(name, value, {
                  ...options,
                  // セキュリティ設定を明示
                  path: options.path || '/',
                  httpOnly: options.httpOnly !== false,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
                });
              } catch (error) {
                // Server Component から呼ばれた場合のエラーを無視
                // Route Handler では発生しないはず
                console.error('[api/auth/login] cookieStore.set error', {
                  requestId,
                  name,
                  error: error instanceof Error ? error.message : 'Unknown',
                });
              }
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
    // Cookie 検証（診断用）
    // ========================================
    const finalHasAuthToken = hasAuthTokenCookie(setCookieNames, projectRef);

    console.log('[api/auth/login] Cookie verification', {
      requestId,
      setCookieNames,
      finalHasAuthToken,
      sessionAccessToken: !!data.session.access_token,
      sessionRefreshToken: !!data.session.refresh_token,
    });

    // ========================================
    // レスポンス作成
    // cookieStore.set() で設定した Cookie は
    // Next.js が自動的にレスポンスヘッダーに追加
    // ========================================
    const response = NextResponse.json(
      {
        ok: true,
        redirectTo: redirectTo || '/dashboard',
        requestId,
      },
      { status: 200 }
    );

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
    });

    return NextResponse.json(
      { ok: false, error: 'ログイン処理中にエラーが発生しました', code: 'unexpected_error', requestId },
      { status: 500 }
    );
  }
}
