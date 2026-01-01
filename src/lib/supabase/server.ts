import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import type { Database } from '@/types/supabase';

// Note: Using untyped client to avoid 340+ type errors from schema drift
// TODO: [SUPABASE_TYPE_FOLLOWUP] 型再生成後に Database 型を復元

/**
 * Untyped server client (既存) - 互換性のため維持
 */
export const createClient = async () => {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // 静的レンダリング時にエラーが発生する場合があるため、ここでキャッチして無視
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // 静的レンダリング時にエラーが発生する場合があるため、ここでキャッチして無視
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
 */
export const createTypedClient = async () => {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // 静的レンダリング時にエラーが発生する場合があるため、ここでキャッチして無視
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // 静的レンダリング時にエラーが発生する場合があるため、ここでキャッチして無視
          }
        },
      },
    }
  );
};
