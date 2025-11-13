import { createClient } from '@supabase/supabase-js';

export function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  // 注: ここは cookies を使わない純粋な匿名クライアント
  return createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
}