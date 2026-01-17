/**
 * Email/Password Login Route Handler
 *
 * サーバーサイドで signInWithPassword を実行し、@supabase/ssr 公式パターンで Cookie を発行。
 *
 * レスポンス契約:
 * - 失敗時: HTTP 401 で { ok: false, code, message, requestId }
 * - 成功時: HTTP 200 で { ok: true, requestId }
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

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const host = request.headers.get('host') || 'unknown';
  const proto = request.headers.get('x-forwarded-proto') || 'unknown';
  const projectRef = getProjectRef();

  // Cookie 診断用の変数
  let setAllCalledCount = 0;
  let setAllCookieNames: string[] = [];

  try {
    const body = await request.json();
    const { email, password, redirectTo } = body;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'メールアドレスとパスワードは必須です', code: 'missing_credentials', requestId },
        { status: 400 }
      );
    }

    // Cookie を設定するための response を先に作成
    const response = NextResponse.json(
      { ok: true, redirectTo: redirectTo || '/dashboard', requestId },
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

            console.log('[api/auth/login] setAll called', {
              requestId,
              count: setAllCalledCount,
              names: setAllCookieNames,
            });

            // 公式パターン: cookiesToSet を response.cookies に設定
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
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

    // setAll が呼ばれたか確認（公式パターンでは signInWithPassword 成功後に自動で呼ばれるはず）
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
