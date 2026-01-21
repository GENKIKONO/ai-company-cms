/**
 * Clear Session API
 *
 * ログイン前に古いSupabase Cookieをクリアするためのエンドポイント。
 * LoginFormから呼び出され、クリーンな状態でログインを開始できるようにする。
 */
import { NextRequest, NextResponse } from 'next/server';

function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'unknown';
}

export async function POST(request: NextRequest) {
  const projectRef = getProjectRef();
  const response = NextResponse.json({ ok: true, cleared: [] as string[] });

  // Supabase Cookie のパターン
  const supabaseCookiePattern = new RegExp(`^sb-${projectRef}-(auth-token|refresh-token)(\\.\\d+)?$`);

  // リクエストから全Cookieを取得
  const allCookies = request.cookies.getAll();
  const clearedCookies: string[] = [];

  // Supabase Cookieをクリア
  allCookies.forEach(cookie => {
    if (supabaseCookiePattern.test(cookie.name)) {
      clearedCookies.push(cookie.name);
      response.cookies.set(cookie.name, '', {
        path: '/',
        maxAge: 0,
      });
    }
  });

  // レスポンスにクリアしたCookie名を含める
  return NextResponse.json({
    ok: true,
    cleared: clearedCookies,
  }, {
    headers: response.headers,
  });
}
