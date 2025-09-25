/**
 * Supabase Browser Client（商用レベル統合版）
 * 
 * 責務:
 * - クライアントサイドでのセッション管理
 * - リアルタイム認証状態監視
 * - Cookie-based永続化（サーバーと統一）
 */
'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * ブラウザ用Supabaseクライアント（Cookie-based認証統一）
 * 用途: Client Components,認証フロー, リアルタイム機能
 */
export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // セッション永続化（商用レベル）
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      
      // Cookie設定（サーバーサイドと統一）
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null;
          return localStorage.getItem(key);
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return;
          localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return;
          localStorage.removeItem(key);
        },
      },
    },
    
    // リアルタイム設定
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * レガシー互換性関数
 * @deprecated supabaseBrowser を直接使用してください
 */
export const createClient = () => supabaseBrowser;

/**
 * デフォルトエクスポート（レガシー互換性）
 * @deprecated supabaseBrowser を名前付きインポートしてください
 */
export default supabaseBrowser;