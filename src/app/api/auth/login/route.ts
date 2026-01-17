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

// Cookie属性を診断用にマスクして文字列化
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

            // Task 1: 各Cookieの属性を診断用に記録
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

            // Task 2: Cookie属性を強制的に正規化（Path問題を確実に潰す）
            cookiesToSet.forEach(({ name, value, options }) => {
              const normalizedOptions = {
                ...options,
                path: '/',  // 最重要: 必ず "/" にする
                sameSite: 'lax' as const,
                secure: isSecure,
                httpOnly: true,
              };

              console.log('[api/auth/login] Setting cookie with normalized options', {
                requestId,
                name,
                originalPath: options?.path,
                normalizedPath: normalizedOptions.path,
                secure: normalizedOptions.secure,
                sameSite: normalizedOptions.sameSite,
              });

              response.cookies.set(name, value, normalizedOptions);
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
    // 公式パターン: signInWithPassword が setAll を自動で呼ぶ
    // 手動Cookie発行は禁止（混線の原因）
    // setSession の追加呼び出しも禁止（上書きの原因）
    // ========================================

    // setAll が呼ばれなかった場合は警告ログのみ（手動設定しない）
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
    });

    // デバッグヘッダを付与
    response.headers.set('x-auth-request-id', requestId);
    response.headers.set('x-auth-set-cookie-count', String(setAllCalledCount));
    response.headers.set('x-auth-cookie-names', setAllCookieNames.join(','));
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
