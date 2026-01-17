/**
 * Email/Password Login Route Handler
 *
 * サーバーサイドで signInWithPassword を実行し、Cookie を確実に発行する。
 * クライアントサイドのみの認証では本番で Cookie が設定されない問題を解決。
 *
 * @supabase/ssr 推奨パターンに準拠
 *
 * デバッグヘッダ（値は出さない）:
 * - x-auth-set-cookie-count: Cookie発行数
 * - x-auth-set-cookie-names: Cookie名一覧
 * - x-auth-host: リクエストHost
 * - x-auth-proto: プロトコル
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const host = request.headers.get('host') || 'unknown';
  const proto = request.headers.get('x-forwarded-proto') || 'unknown';

  // Cookie 診断用の変数
  let setCookieCount = 0;
  let setCookieNames: string[] = [];

  try {
    const body = await request.json();
    const { email, password, redirectTo } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です', requestId },
        { status: 400 }
      );
    }

    // Cookie を設定するための response を先に作成（公式パターン）
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
            // 診断用に記録
            setCookieCount = cookiesToSet.length;
            setCookieNames = cookiesToSet.map(c => c.name);

            // サーバーログ（Step 3-B）
            console.log('[api/auth/login] setAll called', {
              requestId,
              count: setCookieCount,
              names: setCookieNames,
              host,
              proto,
            });

            // response.cookies.set に書く（これが Set-Cookie ヘッダになる）
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
        setCookieCount, // エラー時も setAll が走ったか確認
      });

      // エラーメッセージを日本語化
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
      // エラー時もデバッグヘッダを付与
      errorResponse.headers.set('x-auth-set-cookie-count', String(setCookieCount));
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

    // デバッグヘッダを付与（Step 3-A）
    response.headers.set('x-auth-set-cookie-count', String(setCookieCount));
    response.headers.set('x-auth-set-cookie-names', setCookieNames.join(','));
    response.headers.set('x-auth-host', host);
    response.headers.set('x-auth-proto', proto);
    response.headers.set('x-request-id', requestId);

    // 成功ログ
    console.log('[api/auth/login] Login successful', {
      requestId,
      userId: data.user?.id,
      hasSession: !!data.session,
      setCookieCount,
      setCookieNames,
      setCookieHeaderPresent: response.headers.has('set-cookie'),
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
