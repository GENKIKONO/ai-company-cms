'use client';

import { createBrowserClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';
import { type AppUser, type UserRole } from '@/types/database';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ユーザーの権限をチェック
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    editor: 2,
    admin: 3
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// 現在のユーザー情報を取得
export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return profile
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// 認証関連の関数
export const auth = {
  // サインアップ
  signUp: async (email: string, password: string, fullName?: string) => {
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

    // プロフィール情報を作成
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          role: 'viewer'
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
      }
    }

    return data;
  },

  // サインイン
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Googleサインイン
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  },

  // サインアウト
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // パスワードリセット
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
    return data;
  },

  // 現在のユーザー取得
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // プロフィール更新
  updateProfile: async (updates: Partial<AppUser>) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (error) throw error
  },

  // 認証状態の監視
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// プロフィール管理
export const profile = {
  // プロフィール取得
  get: async (userId: string): Promise<AppUser | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // レコードが見つからない
      throw error;
    }

    return data;
  },

  // プロフィール更新
  update: async (userId: string, updates: Partial<AppUser>) => {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// 保存された検索条件管理
export const savedSearches = {
  // 検索条件一覧取得
  list: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // 検索条件保存
  save: async (userId: string, name: string, searchParams: Record<string, any>) => {
    const { data, error } = await supabase
      .from('user_saved_searches')
      .insert({
        user_id: userId,
        name,
        search_params: searchParams,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 検索条件更新
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('user_saved_searches')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 検索条件削除
  delete: async (id: string) => {
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
    const { data, error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: userId,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // お気に入りから削除
  remove: async (userId: string, organizationId: string) => {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  },

  // お気に入り状態確認
  check: async (userId: string, organizationId: string) => {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },
};