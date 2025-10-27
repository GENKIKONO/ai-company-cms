/**
 * サーバーサイド認証ヘルパー - 唯一の真実
 * 全ての管理APIはこのユーティリティのみを使用
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils/logger';
import 'server-only';

export interface ServerUser {
  id: string;
  email: string;
  appRole: string;
}

/**
 * 現在のユーザー情報を取得（セッション確認）
 * @returns ServerUser | null（ログインしていない場合）
 */
export async function getServerUser(): Promise<ServerUser | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      appRole: user.app_metadata?.role || 'user'
    };
  } catch (error) {
    logger.error('getServerUser error', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * 管理者権限チェック
 * @param user ServerUser オブジェクト
 * @returns boolean
 */
export function isAdmin(user: ServerUser): boolean {
  if (!user) return false;

  // app_metadata.role で admin が設定されている場合
  if (user.appRole === 'admin') {
    return true;
  }

  // 環境変数で指定された管理者メールアドレス
  const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);

  return adminEmails.includes(user.email.toLowerCase());
}

/**
 * ユーザー情報と管理者権限を一括取得（後方互換性用）
 */
export async function getUserWithAdmin(): Promise<{ user: any; isAdmin: boolean }> {
  const serverUser = await getServerUser();
  
  if (!serverUser) {
    return { user: null, isAdmin: false };
  }

  return {
    user: {
      id: serverUser.id,
      email: serverUser.email,
      app_metadata: { role: serverUser.appRole }
    },
    isAdmin: isAdmin(serverUser)
  };
}

/**
 * 管理者判定のみ実行（後方互換性用）
 */
export async function isUserAdmin(): Promise<boolean> {
  const serverUser = await getServerUser();
  return serverUser ? isAdmin(serverUser) : false;
}