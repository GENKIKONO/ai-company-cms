import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { logger } from '@/lib/log';
import { assertAccountUsable, type AccountStatus } from '@/lib/auth/account-status-guard';
export interface ServerUser {
  id: string;
  email: string;
  appRole: string;
}

export interface ServerUserWithStatus extends ServerUser {
  accountStatus: AccountStatus;
}

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || '',
      appRole: profile?.role || 'user'
    };
  } catch (error) {
    logger.error('getServerUser error:', { data: error });
    return null;
  }
}

export function isAdmin(user: ServerUser): boolean {
  if (!user) return false;
  return user.appRole === 'admin';
}

export async function requireAdminPermission(): Promise<void> {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

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
          } catch {}
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Authentication required');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Admin permission required');
  }
}

export async function getUserWithAdmin(): Promise<{ user: ServerUser | null; isAdmin: boolean }> {
  try {
    const user = await getServerUser();
    const adminStatus = user ? isAdmin(user) : false;
    return { user, isAdmin: adminStatus };
  } catch (error) {
    logger.error('getUserWithAdmin error:', { data: error });
    return { user: null, isAdmin: false };
  }
}

/**
 * プロファイル情報を取得（account_status含む）
 * @returns ユーザープロファイル（アカウントステータス含む）
 */
export async function getServerUserWithStatus(): Promise<ServerUserWithStatus | null> {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, account_status')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || '',
      appRole: profile?.role || 'user',
      accountStatus: (profile?.account_status || 'active') as AccountStatus
    };
  } catch (error) {
    logger.error('getServerUserWithStatus error:', { data: error });
    return null;
  }
}

/**
 * Enforcement制裁チェック付きプロファイル取得
 * suspended/frozen/deletedの場合は例外を投げる
 * @returns 利用可能なユーザープロファイル
 * @throws AccountRestrictedError | AccountDeletedError
 */
export async function getEnforcedProfile(): Promise<ServerUserWithStatus> {
  const profile = await getServerUserWithStatus();
  
  if (!profile) {
    throw new Error('Authentication required');
  }

  // アカウント状態をチェック（active/warned以外は例外）
  assertAccountUsable(profile.accountStatus);
  
  return profile;
}