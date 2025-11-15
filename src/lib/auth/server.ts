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
      .maybeSingle();

    // If profile doesn't exist, try to create it automatically 
    if (!profile) {
      logger.info('Auto-creating missing profile for user in getServerUser', {
        component: 'auth-server',
        userId: user.id,
        userEmail: user.email
      });

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
          account_status: 'active',
          role: 'user'
        })
        .select('role')
        .single();

      if (createError) {
        logger.warn('Failed to auto-create profile in getServerUser, using defaults', {
          component: 'auth-server',
          userId: user.id,
          userEmail: user.email,
          error: createError.message
        });
      }

      return {
        id: user.id,
        email: user.email || '',
        appRole: newProfile?.role || 'user'
      };
    }

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
    .maybeSingle();

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
      .maybeSingle();

    // If profile doesn't exist, create it automatically
    if (!profile) {
      logger.info('Auto-creating missing profile for authenticated user', {
        component: 'auth-server',
        userId: user.id,
        userEmail: user.email
      });

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
          account_status: 'active',
          role: 'user'
        })
        .select('role, account_status')
        .single();

      if (createError) {
        logger.error('Failed to auto-create profile for authenticated user', {
          component: 'auth-server',
          userId: user.id,
          userEmail: user.email,
          error: createError.message
        });
        
        // Return safe defaults even if profile creation fails
        return {
          id: user.id,
          email: user.email || '',
          appRole: 'user',
          accountStatus: 'active' as AccountStatus
        };
      }

      return {
        id: user.id,
        email: user.email || '',
        appRole: newProfile?.role || 'user',
        accountStatus: (newProfile?.account_status || 'active') as AccountStatus
      };
    }

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