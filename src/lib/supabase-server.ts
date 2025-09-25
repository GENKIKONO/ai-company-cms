/**
 * Supabase Server-side Client（商用レベル統合版）
 * 
 * 責務:
 * - サーバーサイドでのCookie-based認証
 * - RLS適用のセキュアなデータアクセス
 * - セッション永続化・管理
 */
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * サーバーサイド用Supabaseクライアント（Cookie-based認証）
 * 用途: API Routes, Server Components, Server Actions
 */
export const supabaseServer = async () => {
  const cookieStore = await cookies();
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: (key: string) => {
            const value = cookieStore.get(key)?.value ?? null;
            return value;
          },
          setItem: (key: string, value: string) => {
            // HTTPOnly Cookie設定（セキュリティ強化）
            cookieStore.set(key, value, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7, // 7日間
              path: '/'
            });
          },
          removeItem: (key: string) => {
            cookieStore.delete(key);
          },
        },
        // セッション自動更新（商用レベル）
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // サーバーサイドではURL検出不要
      },
    }
  );
};

/**
 * 管理者権限Supabaseクライアント（Service Role）
 * 用途: DBトリガー、管理操作、RLSバイパス
 */
export const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

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