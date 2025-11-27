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
        setAll(cookiesToSet) {
          // ✅ Supabase提供のCookieオプションを完全に保持
          // SameSite、HttpOnly、Secure等の属性を一切上書きしない
          cookiesToSet.forEach(({ name, value, options }) => {
            // optionsが存在する場合はそのまま使用、存在しない場合はundefinedを渡す
            // これによりNext.jsのデフォルト値適用を防ぐ
            if (options) {
              response.cookies.set(name, value, options);
            } else {
              // optionsが未定義の場合、明示的にSupabaseのデフォルトに近い設定
              response.cookies.set(name, value, {
                httpOnly: false, // Supabaseのauth tokenはクライアントアクセス可能
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax', // Supabaseのデフォルト
              });
            }
          });
        },
      },
    }
  );

  return { supabase, response };
}