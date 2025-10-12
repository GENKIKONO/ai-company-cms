/**
 * サーバーサイド認証ヘルパー
 * admin判定とユーザー情報取得
 */

import { supabaseServer } from '@/lib/supabase-server';
import 'server-only';

export interface UserWithAdmin {
  user: any;
  isAdmin: boolean;
}

/**
 * ユーザー情報と管理者権限を取得
 */
export async function getUserWithAdmin(): Promise<UserWithAdmin> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { user: null, isAdmin: false };
  }

  // 管理者判定
  const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL)?.split(',').map(email => email.trim()) || [];
  const isAdmin = user.app_metadata?.role === 'admin' || adminEmails.includes(user.email || '');

  return { user, isAdmin };
}

/**
 * 管理者判定のみ実行
 */
export async function isUserAdmin(): Promise<boolean> {
  const { isAdmin } = await getUserWithAdmin();
  return isAdmin;
}