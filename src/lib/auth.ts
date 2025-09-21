'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';

export const supabase = createClientComponentClient();

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  search_params: {
    query?: string;
    industry?: string;
    region?: string;
    size?: string;
    founded?: string;
    has_url?: boolean;
    has_logo?: boolean;
    has_services?: boolean;
    has_case_studies?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  favorite_industries: string[];
  default_search_filters: SavedSearch['search_params'];
  language: 'ja' | 'en';
  created_at: string;
  updated_at: string;
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

  // 認証状態の監視
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// プロフィール管理
export const profile = {
  // プロフィール取得
  get: async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('user_profiles')
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
  update: async (userId: string, updates: Partial<UserProfile>) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// 保存された検索条件管理
export const savedSearches = {
  // 検索条件一覧取得
  list: async (userId: string): Promise<SavedSearch[]> => {
    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // 検索条件保存
  save: async (userId: string, name: string, searchParams: SavedSearch['search_params']) => {
    const { data, error } = await supabase
      .from('saved_searches')
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
  update: async (id: string, updates: Partial<SavedSearch>) => {
    const { data, error } = await supabase
      .from('saved_searches')
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
      .from('saved_searches')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ユーザー設定管理
export const preferences = {
  // 設定取得
  get: async (userId: string): Promise<UserPreferences | null> => {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // レコードが見つからない
      throw error;
    }

    return data;
  },

  // 設定更新
  update: async (userId: string, updates: Partial<UserPreferences>) => {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // デフォルト設定作成
  createDefault: async (userId: string) => {
    const defaultPreferences: Partial<UserPreferences> = {
      user_id: userId,
      email_notifications: true,
      favorite_industries: [],
      default_search_filters: {},
      language: 'ja',
    };

    return await preferences.update(userId, defaultPreferences);
  },
};