import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export function createClient(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // 読み取り専用: Cookie の変更を許可しない
          //
          // 理由: ログイン API が手動で設定した Cookie 形式と
          //       Supabase SSR が期待する形式が異なるため、
          //       Supabase が「修正」しようとして Cookie を上書き/削除してしまう。
          //       これがダッシュボードアクセス時に Cookie が消える原因。
          //
          // ログイン時のクッキー設定は /api/auth/login で手動で行う。
          // それ以外の場所ではクッキーを変更しない。
        },
      },
    }
  );

  return { supabase, response };
}