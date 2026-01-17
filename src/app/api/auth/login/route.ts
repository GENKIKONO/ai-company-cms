/**
 * Email/Password Login Route Handler
 *
 * サーバーサイドで signInWithPassword を実行し、Cookie を確実に発行する。
 *
 * 【重要】@supabase/ssr の setAll が自動的に呼ばれない問題への対応：
 * - signInWithPassword 成功後、明示的にセッショントークンを Cookie に設定
 * - これにより、setAll の呼び出しに依存しない確実な Cookie 発行を保証
 *
 * デバッグヘッダ（値は出さない）:
 * - x-auth-set-cookie-count: Cookie発行数
 * - x-auth-set-cookie-names: Cookie名一覧
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
  let manualCookieCount = 0;

  try {
    const body = await request.json();
    const { email, password, redirectTo } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です', requestId },
        { status: 400 }
      );
    }

    // Cookie を設定するための response を先に作成
    const response = NextResponse.json(
      { ok: true, redirectTo: redirectTo || '/dashboard', requestId },
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
            // 診断用に記録（setAll が呼ばれたかどうかを確認）
            setAllCalledCount = cookiesToSet.length;
            setAllCookieNames = cookiesToSet.map(c => c.name);

            console.log('[api/auth/login] setAll called (automatic)', {
              requestId,
              count: setAllCalledCount,
              names: setAllCookieNames,
            });

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
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
      } else if (
        error.message.includes('Email not confirmed') ||
        error.message.includes('email_not_confirmed')
      ) {
        errorMessage = 'メールアドレスが確認されていません。';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = '試行回数が上限に達しました。しばらく時間をおいてからお試しください。';
      }

      const errorResponse = NextResponse.json(
        { ok: false, error: errorMessage, code: error.code, requestId },
        { status: 401 }
      );
      errorResponse.headers.set('x-auth-set-cookie-count', String(setAllCalledCount));
      errorResponse.headers.set('x-auth-host', host);
      errorResponse.headers.set('x-auth-proto', proto);
      return errorResponse;
    }

    if (!data.session) {
      console.error('[api/auth/login] No session created', { requestId });
      return NextResponse.json(
        { ok: false, error: 'セッションの作成に失敗しました', requestId },
        { status: 500 }
      );
    }

    // ========================================
    // 【重要】明示的に Cookie を設定（setAll に依存しない）
    // ========================================
    const session = data.session;
    const cookieOptions = {
      path: '/',
      httpOnly: false, // Supabase クライアントがアクセスできるように
      secure: proto === 'https',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    // Access token (チャンク分割が必要な場合は後で対応)
    const accessTokenCookieName = `sb-${projectRef}-auth-token`;
    response.cookies.set(accessTokenCookieName, session.access_token, cookieOptions);
    manualCookieCount++;

    // Refresh token
    const refreshTokenCookieName = `sb-${projectRef}-refresh-token`;
    response.cookies.set(refreshTokenCookieName, session.refresh_token, cookieOptions);
    manualCookieCount++;

    console.log('[api/auth/login] Manual cookies set', {
      requestId,
      manualCookieCount,
      cookieNames: [accessTokenCookieName, refreshTokenCookieName],
      setAllCalledCount,
      setAllCookieNames,
    });

    // デバッグヘッダを付与
    const totalCookieCount = setAllCalledCount > 0 ? setAllCalledCount : manualCookieCount;
    response.headers.set('x-auth-set-cookie-count', String(totalCookieCount));
    response.headers.set('x-auth-set-cookie-names', setAllCalledCount > 0
      ? setAllCookieNames.join(',')
      : [accessTokenCookieName, refreshTokenCookieName].join(','));
    response.headers.set('x-auth-host', host);
    response.headers.set('x-auth-proto', proto);
    response.headers.set('x-request-id', requestId);
    response.headers.set('x-auth-setall-called', String(setAllCalledCount > 0));
    response.headers.set('x-auth-manual-cookies', String(manualCookieCount));

    console.log('[api/auth/login] Login successful', {
      requestId,
      userId: data.user?.id,
      hasSession: true,
      setAllCalledCount,
      manualCookieCount,
      totalCookieCount,
    });

    return response;
  } catch (error) {
    console.error('[api/auth/login] Unexpected error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { ok: false, error: 'ログイン処理中にエラーが発生しました', requestId },
      { status: 500 }
    );
  }
}
