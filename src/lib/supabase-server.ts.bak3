/**
 * Supabase Server-side Client（商用レベル統合版）
 * 
 * 責務:
 * - サーバーサイドでのCookie-based認証
 * - RLS適用のセキュアなデータアクセス
 * - セッション永続化・管理
 */
// テスト環境以外でserver-onlyを読み込み
if (process.env.NODE_ENV !== 'test' && typeof window === 'undefined') {
  require('server-only');
}
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * サーバーサイド用Supabaseクライアント（Cookie-based認証）
 * 用途: API Routes, Server Components, Server Actions
 */
export const supabaseServer = async () => {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

/**
 * 管理者権限Supabaseクライアント（Service Role）
 * 用途: DBトリガー、管理操作、RLSバイパス
 */
export const supabaseAdmin = () => {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

/**
 * レガシー互換性エクスポート
 * @deprecated supabaseServer() を直接使用してください
 */
export const supabaseBrowserServer = supabaseServer;

/**
 * レガシー互換性エクスポート
 * @deprecated supabaseAdmin() を直接使用してください
 */
export const supabaseBrowserAdmin = supabaseAdmin;