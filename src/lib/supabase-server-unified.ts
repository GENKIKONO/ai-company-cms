import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function supabaseServer() {
  const cookieStore = await cookies();
  
  // SSR Cookie を Supabase クライアントに委譲。NextResponse.setCookie 等は使わない。
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => cookieStore.get(key)?.value,
        set: () => {}, // SSR 認証では原則サーバからは書かない
        remove: () => {}
      }
    }
  );
}