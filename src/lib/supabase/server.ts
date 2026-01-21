/**
 * Server-only Supabase Client
 *
 * @note このファイルはサーバーサイド専用です。
 *       クライアントコンポーネント（hooks/components）からは
 *       @/lib/supabase/client を使用してください。
 */
import 'server-only';

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
        setAll() {
          // 読み取り専用: Cookie の変更を許可しない
          // ログイン時のクッキー設定は /api/auth/login で手動で行う
          // それ以外の場所ではクッキーを変更しない
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
        setAll() {
          // 読み取り専用: Cookie の変更を許可しない
          // ログイン時のクッキー設定は /api/auth/login で手動で行う
          // それ以外の場所ではクッキーを変更しない
        },
      },
    }
  );
};
