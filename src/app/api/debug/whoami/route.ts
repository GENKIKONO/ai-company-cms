// src/app/api/debug/whoami/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET() {
  try {
    // 環境変数の防御的チェック
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        cookieKeys: [],
        user: null,
        error: 'Missing Supabase configuration'
      }, { status: 200 });
    }

    const jar = await cookies();

    // ★ server 側の Supabase クライアントを Cookie 連携ありで作る
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return jar.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Next.js Route Handler では set/remove は try-catch で包むのが安全
            try {
              jar.set({ name, value, ...options });
            } catch (_) {}
          },
          remove(name: string, options: any) {
            try {
              jar.set({ name, value: '', ...options, maxAge: 0 });
            } catch (_) {}
          }
        }
      }
    );

    const allCookieNames = jar.getAll().map((c) => c.name);
    const sbCookies = allCookieNames.filter((n) => n.startsWith('sb-'));

    const { data, error } = await supabase.auth.getUser();

    return NextResponse.json({
      cookieKeys: sbCookies,
      user: data?.user
        ? { id: data.user.id, email: data.user.email }
        : null,
      error: error?.message ?? null
    });
  } catch (error) {
    // 例外時は JSON エラーを返す（HTML エラーを避ける）
    return NextResponse.json({
      cookieKeys: [],
      user: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 });
  }
}