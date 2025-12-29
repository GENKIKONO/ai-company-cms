'use client';

import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import type { AppUser } from '@/types/legacy/database';
import type { UserRole } from '@/types/utils/database';;
import type { DatabaseResult, TableRow, TableUpdate } from '@/types/database.types';
import type { ApiResponse, createApiResponse, createErrorResponse } from '@/types/api.types';
import { authLogger, logger } from '@/lib/utils/logger';
import { handleMaybeSingleResult } from '@/lib/error-mapping';
import { getCurrentUserClient, getRawUserClient } from '@/lib/core/auth-state.client';

// Profile update interface
interface ProfileUpdates {
  full_name?: string;
  avatar_url?: string;
}

// Search params interface
interface SearchParams {
  query?: string;
  category?: string;
  location?: string;
  [key: string]: string | undefined;
}

// Saved search updates interface
interface SavedSearchUpdates {
  name?: string;
  search_params?: SearchParams;
}

// User preferences interface - type-safe version
interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: string; // ISO language codes
  notifications?: boolean;
  email_notifications?: boolean;
  dashboard_view?: 'grid' | 'list';
  items_per_page?: number;
  timezone?: string;
  [key: string]: string | number | boolean | undefined;
}

// ユーザーの権限をチェック
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    editor: 2,
    admin: 3
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * 現在のユーザー情報を取得
 *
 * @deprecated `@/lib/core/auth-state.client` の `getCurrentUserClient` を使用してください
 */
export { getCurrentUserClient as getCurrentUser } from '@/lib/core/auth-state.client';

// 認証関連の関数
export const auth = {
  // サインアップ
  signUp: async (email: string, password: string, fullName?: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    // プロフィール情報は handle_new_user() トリガーで自動作成される
    // manual profile creation is no longer needed

    return data;
  },

  // サインイン
  signIn: async (email: string, password: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Googleサインイン
  signInWithGoogle: async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  },

  // サインアウト - 完全なセッション クリア
  signOut: async () => {
    try {
      logger.info('Starting complete sign out process');
      
      // 1. Supabase クライアント サインアウト
      const supabase = await createClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        authLogger.error('Supabase signOut', signOutError);
      }
      
      // 2. 全ての認証関連 Cookie を手動削除
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.startsWith('sb-') || name.includes('auth')) {
          // 複数のドメイン・パスで削除を試行
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.aiohub.jp`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=aiohub.jp`;
        }
      }
      
      // 3. localStorage と sessionStorage をクリア
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            sessionStorage.removeItem(key);
          }
        });
      }
      
      logger.info('Complete sign out finished');
      
      if (signOutError) throw signOutError;
    } catch (error) {
      authLogger.error('Sign out process failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  // パスワードリセット
  resetPassword: async (email: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
    return data;
  },

  // 現在のユーザー取得（Supabase User型を返すため Core wrapper 経由）
  getCurrentUser: async (): Promise<User | null> => {
    return getRawUserClient();
  },

  // プロフィール更新
  updateProfile: async (updates: Partial<AppUser>) => {
    const supabase = await createClient();
    const user = await getCurrentUserClient();

    if (!user) throw new Error('Not authenticated')

    // migrated from users → app_users → profiles
    // Only update fields that exist in profiles table
    const profileUpdates: ProfileUpdates = {};
    if (updates.full_name !== undefined) profileUpdates.full_name = updates.full_name;
    if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url;

    const { error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id)

    if (error) throw error
  },

  // NOTE: onAuthStateChange は Core正本 (src/lib/core/auth-state.client.ts) の
  // onAuthChangeClient を使用してください。このモジュールからは削除しました。
};

// プロフィール管理
export const profile = {
  // プロフィール取得
  get: async (userId: string): Promise<AppUser | null> => {
    // migrated from users → app_users → profiles
    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!profile) return null; // レコードが見つからない

    // Get email from auth.users since it's not in profiles
    const currentUser = await getCurrentUserClient();
    const email = currentUser?.id === userId ? currentUser.email || '' : ''; // Only return email if it's current user
    
    return {
      id: profile.id,
      email: email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      role: 'viewer', // Default role since profiles doesn't store role
      created_at: profile.created_at,
      updated_at: profile.created_at, // profiles doesn't have updated_at
      email_verified: currentUser?.email_verified ?? false
    };
  },

  // プロフィール更新
  update: async (userId: string, updates: Partial<AppUser>) => {
    // migrated from users → app_users → profiles
    // Only update fields that exist in profiles table
    const profileUpdates: ProfileUpdates = {};
    if (updates.full_name !== undefined) profileUpdates.full_name = updates.full_name;
    if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url;

    const supabase = await createClient();
    const result = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    return handleMaybeSingleResult(result, 'プロフィール');
  },
};

// 保存された検索条件管理
export const savedSearches = {
  // 検索条件一覧取得
  list: async (userId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // 検索条件保存
  save: async (userId: string, name: string, searchParams: SearchParams) => {
    const supabase = await createClient();
    const result = await supabase
      .from('user_saved_searches')
      .insert({
        user_id: userId,
        name,
        search_params: searchParams,
      })
      .select()
      .maybeSingle();

    return handleMaybeSingleResult(result, '保存された検索条件');
  },

  // 検索条件更新
  update: async (id: string, updates: SavedSearchUpdates) => {
    const supabase = await createClient();
    const result = await supabase
      .from('user_saved_searches')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    return handleMaybeSingleResult(result, '保存された検索条件');
  },

  // 検索条件削除
  delete: async (id: string) => {
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_saved_searches')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// お気に入り管理
export const favorites = {
  // お気に入り一覧取得
  list: async (userId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // お気に入りに追加
  add: async (userId: string, organizationId: string) => {
    const supabase = await createClient();
    const result = await supabase
      .from('user_favorites')
      .insert({
        user_id: userId,
        organization_id: organizationId,
      })
      .select()
      .maybeSingle();

    return handleMaybeSingleResult(result, 'お気に入り');
  },

  // お気に入りから削除
  remove: async (userId: string, organizationId: string) => {
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  },

  // お気に入り状態確認
  check: async (userId: string, organizationId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    // エラーがある場合は0件として扱う（お気に入りしていない）
    if (error) return false;
    return !!data;
  },
};

// ユーザー設定管理
export const preferences = {
  // 設定取得
  get: async (userId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // 設定が見つからない場合はデフォルト値を返す
    if (error || !data) return {};
    return data;
  },

  // 設定更新
  update: async (userId: string, preferences: UserPreferences) => {
    const supabase = await createClient();
    const result = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    return handleMaybeSingleResult(result, 'ユーザー設定');
  },
};