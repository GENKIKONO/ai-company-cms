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

    // ========================================
    // 【重要】setAll が自動で呼ばれない問題への対応
    // @supabase/ssr の setAll が確実に呼ばれない場合があるため、
    // 手動で Cookie を設定する（フォールバック）
    // ========================================

    // まず setSession を試して setAll をトリガー
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    // setAll が呼ばれなかった場合、手動で Cookie を設定
    if (setAllCalledCount === 0) {
      console.log('[api/auth/login] setAll was NOT called, setting cookies manually', { requestId });

      const session = data.session;
      const isSecure = proto === 'https';

      // Supabase SSR 形式: セッション情報を Base64 エンコードして Cookie に設定
      const sessionData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type || 'bearer',
        user: session.user,
      };

      const cookieValue = Buffer.from(JSON.stringify(sessionData)).toString('base64');
      const cookieName = `sb-${projectRef}-auth-token`;

      // チャンク分割が必要な場合（4KB制限）
      const CHUNK_SIZE = 3500;
      if (cookieValue.length > CHUNK_SIZE) {
        const chunks = Math.ceil(cookieValue.length / CHUNK_SIZE);
        for (let i = 0; i < chunks; i++) {
          const chunkName = `${cookieName}.${i}`;
          const chunkValue = cookieValue.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          response.cookies.set(chunkName, chunkValue, {
            path: '/',
            httpOnly: false,
            secure: isSecure,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });
          setAllCookieNames.push(chunkName);
        }
      } else {
        response.cookies.set(cookieName, cookieValue, {
          path: '/',
          httpOnly: false,
          secure: isSecure,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        setAllCookieNames.push(cookieName);
      }

      setAllCalledCount = setAllCookieNames.length;
      console.log('[api/auth/login] Manual cookies set', {
        requestId,
        cookieNames: setAllCookieNames,
        cookieValueLength: cookieValue.length,
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
