'use client';

import { supabaseBrowser } from '@/lib/supabase-client';
import { User } from '@supabase/supabase-js';
import { type AppUser, type UserRole } from '@/types/database';

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
    const { data: { user } } = await supabaseBrowser.auth.getUser()
    
    if (!user) return null

    // migrated from users → app_users
    const { data: profile, error } = await supabaseBrowser
      .from('app_users')
      .select('id, email, name, role, created_at, updated_at')
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
    const { data, error } = await supabaseBrowser.auth.signUp({
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
      // migrated from users → app_users
      const { error: profileError } = await supabaseBrowser
        .from('app_users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          name: fullName,
          role: 'user'
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
      }
    }

    return data;
  },

  // サインイン
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Googleサインイン
  signInWithGoogle: async () => {
    const { data, error } = await supabaseBrowser.auth.signInWithOAuth({
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
      console.log('[auth.signOut] Starting complete sign out process');
      
      // 1. Supabase クライアント サインアウト
      const { error: signOutError } = await supabaseBrowser.auth.signOut();
      if (signOutError) {
        console.error('[auth.signOut] Supabase signOut error:', signOutError);
      }
      
      // 2. 全ての認証関連 Cookie を手動削除
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
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
      
      console.log('[auth.signOut] Complete sign out finished');
      
      if (signOutError) throw signOutError;
    } catch (error) {
      console.error('[auth.signOut] Sign out process failed:', error);
      throw error;
    }
  },

  // パスワードリセット
  resetPassword: async (email: string) => {
    const { data, error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
    return data;
  },

  // 現在のユーザー取得
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    return user;
  },

  // プロフィール更新
  updateProfile: async (updates: Partial<AppUser>) => {
    const { data: { user } } = await supabaseBrowser.auth.getUser()
    
    if (!user) throw new Error('Not authenticated')

    // migrated from users → app_users
    const { error } = await supabaseBrowser
      .from('app_users')
      .update(updates)
      .eq('id', user.id)

    if (error) throw error
  },

  // 認証状態の監視
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabaseBrowser.auth.onAuthStateChange(callback);
  },
};

// プロフィール管理
export const profile = {
  // プロフィール取得
  get: async (userId: string): Promise<AppUser | null> => {
    // migrated from users → app_users
    const { data, error } = await supabaseBrowser
      .from('app_users')
      .select('id, email, name, role, created_at, updated_at')
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
    // migrated from users → app_users
    const { data, error } = await supabaseBrowser
      .from('app_users')
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
    const { data, error } = await supabaseBrowser
      .from('user_saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // 検索条件保存
  save: async (userId: string, name: string, searchParams: Record<string, any>) => {
    const { data, error } = await supabaseBrowser
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
    const { data, error } = await supabaseBrowser
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
    const { error } = await supabaseBrowser
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
    const { data, error } = await supabaseBrowser
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
    const { data, error } = await supabaseBrowser
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
    const { error } = await supabaseBrowser
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  },

  // お気に入り状態確認
  check: async (userId: string, organizationId: string) => {
    const { data, error } = await supabaseBrowser
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },
};

// ユーザー設定管理
export const preferences = {
  // 設定取得
  get: async (userId: string) => {
    const { data, error } = await supabaseBrowser
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || {};
  },

  // 設定更新
  update: async (userId: string, preferences: Record<string, any>) => {
    const { data, error } = await supabaseBrowser
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};