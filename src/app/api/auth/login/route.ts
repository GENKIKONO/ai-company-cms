/**
 * Email/Password Login Route Handler
 *
 * サーバーサイドで signInWithPassword を実行し、@supabase/ssr 公式パターンで Cookie を発行。
 *
 * レスポンス契約:
 * - GET: 200 + { ok: true, route, methods, sha, timestamp }（診断用）
 * - POST 失敗時: HTTP 401 で { ok: false, code, message, requestId }
 * - POST 成功時: HTTP 200 で { ok: true, requestId } + Set-Cookie
 *
 * デバッグヘッダ:
 * - x-auth-request-id: リクエストID
 * - x-auth-set-cookie-count: Set-Cookie の数
 * - x-auth-cookie-names: Cookie 名一覧
 * - x-auth-supabase-ref: projectRef
 * - x-auth-host: リクエストHost
 * - x-auth-proto: プロトコル
 *
 * 2024-01: Cookie発行を公式chunk方式に統一
 * - httpOnly は削除（Supabase SSR はクライアントアクセス可能にする必要あり）
 * - Set-Cookie ヘッダーの詳細をログ出力
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
 * ルートが存在するかを確認するため
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

// Cookie属性を診断用に記録
interface CookieDiagnostic {
  name: string;
  path: string;
  domain: string | undefined;
  sameSite: string | undefined;
  secure: boolean | undefined;
  httpOnly: boolean | undefined;
  maxAge: number | undefined;
  valueLength: number;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const host = request.headers.get('host') || 'unknown';
  const proto = request.headers.get('x-forwarded-proto') || 'unknown';
  const projectRef = getProjectRef();
  const isSecure = proto === 'https';

  // Cookie 診断用の変数
  let setAllCalledCount = 0;
  let setAllCookieNames: string[] = [];
  const cookieDiagnostics: CookieDiagnostic[] = [];

  try {
    const body = await request.json();
    const { email, password, redirectTo } = body;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'メールアドレスとパスワードは必須です', code: 'missing_credentials', requestId },
        { status: 400 }
      );
    }

    // 成功時のレスポンスを先に作成（@supabase/ssr公式パターン）
    // setAll内でこのresponseにCookieをセットする
    const response = NextResponse.json(
      {
        ok: true,
        redirectTo: redirectTo || '/dashboard',
        requestId,
      },
      { status: 200 }
    );

    // サーバー側 Supabase クライアントを作成（@supabase/ssr 公式パターン）
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // 診断用に記録
            setAllCalledCount = cookiesToSet.length;
            setAllCookieNames = cookiesToSet.map(c => c.name);

            // 各Cookieの属性を診断用に記録
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieDiagnostics.push({
                name,
                path: options?.path || '(not set)',
                domain: options?.domain,
                sameSite: options?.sameSite as string | undefined,
                secure: options?.secure,
                httpOnly: options?.httpOnly,
                maxAge: options?.maxAge,
                valueLength: value.length,
              });
            });

            console.log('[api/auth/login] setAll called', {
              requestId,
              count: setAllCalledCount,
              names: setAllCookieNames,
              diagnostics: cookieDiagnostics,
            });

            // 公式パターン: Supabase SSR が渡すオプションをそのまま使用
            // ただし path は必ず "/" にする（重要）
            // httpOnly は false にする（Supabase クライアントがアクセスする必要あり）
            cookiesToSet.forEach(({ name, value, options }) => {
              // 重要: Supabase SSR のデフォルトオプションを尊重しつつ、path のみ強制
              const cookieOptions = {
                ...options,
                path: '/',  // 最重要: 必ず "/" にする
                // httpOnly は Supabase のデフォルト（false）を使う
                // secure は options から継承
                // sameSite は options から継承
              };

              console.log('[api/auth/login] Setting cookie', {
                requestId,
                name,
                valueLength: value.length,
                originalPath: options?.path,
                finalOptions: cookieOptions,
              });

              response.cookies.set(name, value, cookieOptions);
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
        setAllCalledCount,
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

      const errorResponse = NextResponse.json(
        { ok: false, error: errorMessage, code: errorCode, message: errorMessage, requestId },
        { status: 401 }
      );
      errorResponse.headers.set('x-auth-request-id', requestId);
      errorResponse.headers.set('x-auth-set-cookie-count', String(setAllCalledCount));
      errorResponse.headers.set('x-auth-supabase-ref', projectRef);
      errorResponse.headers.set('x-auth-host', host);
      errorResponse.headers.set('x-auth-proto', proto);
      return errorResponse;
    }

    if (!data.session) {
      console.error('[api/auth/login] No session created', { requestId });
      const errorResponse = NextResponse.json(
        { ok: false, error: 'セッションの作成に失敗しました', code: 'no_session', message: 'セッションの作成に失敗しました', requestId },
        { status: 500 }
      );
      errorResponse.headers.set('x-auth-request-id', requestId);
      errorResponse.headers.set('x-auth-set-cookie-count', String(setAllCalledCount));
      errorResponse.headers.set('x-auth-supabase-ref', projectRef);
      return errorResponse;
    }

    // ========================================
    // Set-Cookie ヘッダーの検証（重要）
    // ========================================
    const setCookieHeaders = response.headers.getSetCookie();
    const setCookieNames = setCookieHeaders.map(header => {
      const match = header.match(/^([^=]+)=/);
      return match ? match[1] : 'unknown';
    });
    const setCookieSizes = setCookieHeaders.map(header => header.length);

    // auth-token が含まれているか確認
    const hasAuthTokenInSetCookie = setCookieNames.some(name =>
      name.includes('auth-token') || name.match(/auth-token\.\d+/)
    );
    const hasRefreshTokenInSetCookie = setCookieNames.some(name =>
      name.includes('refresh-token')
    );

    console.log('[api/auth/login] Final Set-Cookie analysis', {
      requestId,
      userId: data.user?.id,
      setAllCalledCount,
      setAllCookieNames,
      setCookieHeaderCount: setCookieHeaders.length,
      setCookieNames,
      setCookieSizes,
      hasAuthTokenInSetCookie,
      hasRefreshTokenInSetCookie,
      // 各Set-Cookieヘッダーの最初の50文字（デバッグ用）
      setCookiePreviews: setCookieHeaders.map(h => h.substring(0, 80) + '...'),
    });

    // 警告: auth-token が Set-Cookie に含まれていない場合
    if (!hasAuthTokenInSetCookie) {
      console.warn('[api/auth/login] WARNING: auth-token NOT in Set-Cookie headers!', {
        requestId,
        setCookieNames,
        setAllCookieNames,
        diagnostics: cookieDiagnostics,
      });
    }

    // setAll が呼ばれなかった場合は警告
    if (setAllCalledCount === 0) {
      console.warn('[api/auth/login] WARNING: setAll was NOT called by signInWithPassword', {
        requestId,
        userId: data.user?.id,
        sessionPresent: !!data.session,
      });
    }

    console.log('[api/auth/login] Login successful', {
      requestId,
      userId: data.user?.id,
      hasSession: true,
      setAllCalledCount,
      setAllCookieNames,
      setCookieHeaderCount: setCookieHeaders.length,
    });

    // デバッグヘッダを付与
    response.headers.set('x-auth-request-id', requestId);
    response.headers.set('x-auth-set-cookie-count', String(setCookieHeaders.length));
    response.headers.set('x-auth-set-cookie-names', setCookieNames.join(','));
    response.headers.set('x-auth-has-auth-token', String(hasAuthTokenInSetCookie));
    response.headers.set('x-auth-has-refresh-token', String(hasRefreshTokenInSetCookie));
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
      { ok: false, error: 'ログイン処理中にエラーが発生しました', code: 'unexpected_error', message: 'ログイン処理中にエラーが発生しました', requestId },
      { status: 500 }
    );
  }
}
