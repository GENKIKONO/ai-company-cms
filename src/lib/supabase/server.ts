import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import type { Database } from '@/types/supabase';

// Note: Using untyped client to avoid 340+ type errors from schema drift
// TODO: [SUPABASE_TYPE_FOLLOWUP] 型再生成後に Database 型を復元

/**
 * Untyped server client (既存) - 互換性のため維持
 *
 * NOTE: @supabase/ssr推奨のgetAll/setAllパターンを使用
 * これによりmiddleware.tsやlayout.tsxとのCookie同期が正しく動作する
 */
export const createClient = async () => {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          } catch {
            // Server Component内ではCookieを設定できない場合がある
            // Middlewareがセッション更新を担当するため、ここでは無視
          }
        },
      },
    }
  );
};

// Legacy exports for compatibility
export const supabaseServer = createClient;
export { supabaseAdmin };

/**
 * Typed server client - 新規/リファクタリング対象ファイル用
 * 型安全なSupabaseクエリを実行する場合に使用
 *
 * NOTE: @supabase/ssr推奨のgetAll/setAllパターンを使用
 */
export const createTypedClient = async () => {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          } catch {
            // Server Component内ではCookieを設定できない場合がある
            // Middlewareがセッション更新を担当するため、ここでは無視
          }
        },
      },
    }
  );
};
