import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware用Supabaseクライアント（Supabase公式パターン）
 *
 * 重要: setAll で以下の3ステップを実行:
 * 1. request.cookies.set() - リクエスト側を更新
 * 2. NextResponse.next({ request }) - レスポンスを再生成
 * 3. response.cookies.set() - レスポンス側にも反映
 *
 * これにより、SSRでトークン更新後のCookieが「リクエスト側」と「レスポンス側」で
 * 同期され、次のサーバ処理で正しいセッションを参照できる。
 */
export function createClient(request: NextRequest): {
  supabase: ReturnType<typeof createServerClient>;
  getResponse: () => NextResponse;
} {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 1) Request 側を更新
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // 2) Response を作り直し（更新されたrequestを含む）
          supabaseResponse = NextResponse.next({ request });

          // 3) Response 側にも反映
          cookiesToSet.forEach(({ name, value, options }) => {
            const opts = { ...options, path: '/' };

            // 診断ログ
            console.log('[middleware] setAll', {
              name,
              opts,
              runtime: (globalThis as Record<string, unknown>).EdgeRuntime ? 'edge' : 'node',
              valueLength: value?.length || 0,
            });

            supabaseResponse.cookies.set(name, value, opts);
          });
        },
      },
    }
  );

  return {
    supabase,
    getResponse: () => supabaseResponse,
  };
}