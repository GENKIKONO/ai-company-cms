// src/app/api/debug/whoami/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET() {
  const jar = await cookies();

  // ★ server 側の Supabase クライアントを Cookie 連携ありで作る
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
}