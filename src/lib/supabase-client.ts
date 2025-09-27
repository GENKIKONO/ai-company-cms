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
    cookies: {
      get: (key) => {
        if (typeof document !== 'undefined') {
          const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
          return match ? decodeURIComponent(match[2]) : undefined;
        }
        return undefined;
      },
      set: (key, value, options) => {
        if (typeof document !== 'undefined') {
          const isProduction = process.env.NODE_ENV === 'production';
          const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
          const domain = isProduction && cookieDomain 
            ? `.${cookieDomain}` 
            : undefined;
          
          const cookieOptions = {
            ...options,
            sameSite: 'lax' as const,
            secure: isProduction,
            domain,
            path: '/',
          };
          
          const cookieString = `${key}=${encodeURIComponent(value)}; ${Object.entries(cookieOptions)
            .filter(([_, v]) => v !== undefined && v !== false)
            .map(([k, v]) => v === true ? k : `${k}=${v}`)
            .join('; ')}`;
          
          document.cookie = cookieString;
        }
      },
      remove: (key, options) => {
        if (typeof document !== 'undefined') {
          const isProduction = process.env.NODE_ENV === 'production';
          const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
          const domain = isProduction && cookieDomain
            ? `.${cookieDomain}`
            : undefined;
            
          const cookieOptions = {
            ...options,
            sameSite: 'lax' as const,
            secure: isProduction,
            domain,
            path: '/',
            maxAge: 0,
            expires: new Date(0),
          };
          
          const cookieString = `${key}=; ${Object.entries(cookieOptions)
            .filter(([_, v]) => v !== undefined && v !== false)
            .map(([k, v]) => v === true ? k : `${k}=${v}`)
            .join('; ')}`;
          
          document.cookie = cookieString;
        }
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