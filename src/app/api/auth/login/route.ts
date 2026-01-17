/**
 * Email/Password Login Route Handler
 *
 * サーバーサイドで signInWithPassword を実行し、Cookie を確実に発行する。
 * クライアントサイドのみの認証では本番で Cookie が設定されない問題を解決。
 *
 * @supabase/ssr 推奨パターンに準拠
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://aiohub.jp';

  try {
    const body = await request.json();
    const { email, password, redirectTo } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です', requestId },
        { status: 400 }
      );
    }

    // Cookie を設定するための response を作成
    const response = NextResponse.json(
      { success: true, redirectTo: redirectTo || '/dashboard', requestId },
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
            // 診断ログ: Set-Cookie が呼ばれたか確認
            console.log('[api/auth/login] setAll called', {
              requestId,
              cookieCount: cookiesToSet.length,
              cookieNames: cookiesToSet.map(c => c.name),
              origin,
              host: request.headers.get('host'),
              xForwardedProto: request.headers.get('x-forwarded-proto'),
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

      return NextResponse.json(
        { error: errorMessage, code: error.code, requestId },
        { status: 401 }
      );
    }

    if (!data.session) {
      console.error('[api/auth/login] No session created', { requestId });
      return NextResponse.json(
        { error: 'セッションの作成に失敗しました', requestId },
        { status: 500 }
      );
    }

    // 成功ログ
    console.log('[api/auth/login] Login successful', {
      requestId,
      userId: data.user?.id,
      hasSession: !!data.session,
      setCookieHeaderPresent: response.headers.has('set-cookie'),
    });

    return response;
  } catch (error) {
    console.error('[api/auth/login] Unexpected error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'ログイン処理中にエラーが発生しました', requestId },
      { status: 500 }
    );
  }
}
