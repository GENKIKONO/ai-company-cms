import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/log';
import { assertAccountUsable, type AccountStatus } from '@/lib/auth/account-status-guard';

// P1-3: Supabase設計に合わせたapp_users.roleの型定義
// app_users.role CHECK制約に対応: ['admin','partner','user','owner']
export type AppUserRole = 'admin' | 'partner' | 'user' | 'owner';

export interface ServerUser {
  id: string;
  email: string;
  appRole: AppUserRole;
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

    // P1-3: app_usersテーブルを権限の真実のソースとして使用（安全版）
    // 既存のprofilesとの互換性も維持
    let appUserRole: AppUserRole = 'user';
    
    try {
      // v_app_users_compat2 互換ビュー使用
      const { data: appUser } = await supabase
        .from('v_app_users_compat2')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (appUser?.role) {
        appUserRole = appUser.role as AppUserRole;
      } else {
        logger.info('app_user not found, checking profiles as fallback', {
          component: 'auth-server',
          userId: user.id
        });
        
        // フォールバック: profilesから既存のロール情報を取得
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.role) {
          // profilesのroleがapp_usersの制約に合う場合のみ使用
          const validRoles: AppUserRole[] = ['admin', 'partner', 'user', 'owner'];
          if (validRoles.includes(profile.role as AppUserRole)) {
            appUserRole = profile.role as AppUserRole;
          }
        }
      }
    } catch (tableError) {
      logger.warn('app_users table access failed, falling back to profiles', {
        component: 'auth-server',
        userId: user.id,
        error: tableError instanceof Error ? tableError.message : 'Unknown error'
      });
      
      // app_usersテーブルが存在しない場合のフォールバック
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.role) {
          const validRoles: AppUserRole[] = ['admin', 'partner', 'user', 'owner'];
          if (validRoles.includes(profile.role as AppUserRole)) {
            appUserRole = profile.role as AppUserRole;
          }
        }
      } catch (profileError) {
        logger.error('Both app_users and profiles access failed', {
          component: 'auth-server',
          userId: user.id,
          error: profileError instanceof Error ? profileError.message : 'Unknown error'
        });
      }
    }

    return {
      id: user.id,
      email: user.email || '',
      appRole: appUserRole
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

  const user = await getServerUser();
  if (!user) {
    throw new Error('Authentication required');
  }

  if (!isAdmin(user)) {
    throw new Error('Admin permission required');
  }
}

/**
 * Super Admin権限チェック（AIOHub P3-1 用）
 * P3-1: システム管理コンソールへのアクセスは最高権限のみ許可
 */
export async function requireSuperAdminUser(): Promise<ServerUser> {
  // サービスロールキーがある場合は自動的に許可
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      id: 'service-role',
      email: 'service@aiohub.system',
      appRole: 'admin'
    };
  }

  const user = await getServerUser();
  if (!user) {
    throw new Error('Authentication required');
  }

  // P3-1: Super Admin = 'admin' ロール + 追加の環境変数チェック
  if (!isAdmin(user)) {
    throw new Error('Super admin privileges required');
  }

  // 追加のSuper Adminチェック（環境変数で制御可能）
  const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',') || [];
  if (superAdminEmails.length > 0 && !superAdminEmails.includes(user.email)) {
    logger.warn('Super admin access denied - email not in whitelist', {
      userId: user.id,
      email: user.email,
      component: 'auth-server'
    });
    throw new Error('Super admin privileges required');
  }

  logger.info('Super admin access granted', {
    userId: user.id,
    email: user.email,
    component: 'auth-server'
  });

  return user;
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
    // P1-3: 安全版 - 既存のgetServerUserを再利用し、status情報のみ追加取得
    const user = await getServerUser();
    
    if (!user) {
      return null;
    }

    // profilesからaccount_statusのみ取得（存在しない場合は'active'をデフォルトとする）
    let accountStatus: AccountStatus = 'active';
    
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('account_status')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.account_status) {
        accountStatus = profile.account_status as AccountStatus;
      }
    } catch (profileError) {
      logger.warn('Failed to get account status from profiles, using default', {
        component: 'auth-server',
        userId: user.id,
        error: profileError instanceof Error ? profileError.message : 'Unknown error'
      });
    }

    return {
      id: user.id,
      email: user.email,
      appRole: user.appRole,
      accountStatus
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

// P1-3: 権限ガード関数（SSR & API共通）

import { 
  getOrgMemberInfo, 
  isOrgMember, 
  hasOrgRole, 
  type OrgMemberInfo, 
  type OrgRole 
} from '@/lib/server/organizations';
import { redirect } from 'next/navigation';

export interface AuthRequiredError extends Error {
  code: 'AUTH_REQUIRED';
  redirectUrl?: string;
}

export interface OrgAccessError extends Error {
  code: 'ORG_ACCESS_DENIED';
  orgId: string;
  userId: string;
}

export interface OrgRoleError extends Error {
  code: 'ORG_ROLE_INSUFFICIENT';
  orgId: string;
  userId: string;
  requiredRoles: OrgRole[];
  userRole: OrgRole | null;
}

/**
 * 認証が必要な処理でユーザー情報を要求
 * P1-3要件: SSR/API共通で使用可能
 */
export async function requireAuthUser(): Promise<ServerUser> {
  const user = await getServerUser();
  
  if (!user) {
    const error = new Error('Authentication required') as AuthRequiredError;
    error.code = 'AUTH_REQUIRED';
    error.redirectUrl = '/auth/login';
    throw error;
  }
  
  return user;
}

/**
 * 組織メンバーシップが必要な処理でメンバー情報を要求
 * P1-3要件: SSR/API共通で使用可能
 */
export async function requireOrgMember(orgId: string): Promise<{ user: ServerUser; organization: any }> {
  const user = await requireAuthUser();
  
  const memberInfo = await getOrgMemberInfo(user.id, orgId, user.email);
  
  if (!memberInfo) {
    const error = new Error(`Organization access denied for org: ${orgId}`) as OrgAccessError;
    error.code = 'ORG_ACCESS_DENIED';
    error.orgId = orgId;
    error.userId = user.id;
    throw error;
  }
  
  return {
    user,
    organization: memberInfo.organization
  };
}

/**
 * 特定ロール以上が必要な処理でロール付きメンバー情報を要求
 * P1-3要件: SSR/API共通で使用可能
 */
export async function requireOrgRole(
  orgId: string, 
  allowedRoles: OrgRole[]
): Promise<{ user: ServerUser; organization: any; role: OrgRole }> {
  const user = await requireAuthUser();
  
  const memberInfo = await getOrgMemberInfo(user.id, orgId, user.email);
  
  if (!memberInfo) {
    const error = new Error(`Organization access denied for org: ${orgId}`) as OrgAccessError;
    error.code = 'ORG_ACCESS_DENIED';
    error.orgId = orgId;
    error.userId = user.id;
    throw error;
  }
  
  const userRole = memberInfo.membership.role;
  if (!allowedRoles.includes(userRole)) {
    const error = new Error(
      `Insufficient role. Required: ${allowedRoles.join('|')}, User has: ${userRole}`
    ) as OrgRoleError;
    error.code = 'ORG_ROLE_INSUFFICIENT';
    error.orgId = orgId;
    error.userId = user.id;
    error.requiredRoles = allowedRoles;
    error.userRole = userRole;
    throw error;
  }
  
  return {
    user,
    organization: memberInfo.organization,
    role: userRole
  };
}

/**
 * SSRページでの権限エラーハンドリング用ヘルパー
 * P1-3: エラーハンドリング方針 - セキュリティ重視で情報漏洩防止を優先
 * 
 * 方針:
 * - 認証エラー: ログインページにリダイレクト (UX重視)
 * - 組織アクセスエラー: 404で存在を隠す (セキュリティ重視)
 * - RLSで「存在しても見えない」ケースを考慮し、組織の存在自体を隠蔽
 * 
 * 注意:
 * - 管理ダッシュボード系では 403 も検討可能だが、一般ユーザー向けは 404 で統一
 * - 組織が存在するかどうかの情報漏洩を防ぐため、基本的に 404 を返す
 */
export function handleAuthErrorForSSR(error: Error, currentPath?: string): never {
  if ('code' in error) {
    switch ((error as { code: string }).code) {
      case 'AUTH_REQUIRED': {
        const redirectUrl = currentPath ? `?redirect=${encodeURIComponent(currentPath)}` : '';
        redirect(`/auth/login${redirectUrl}`);
        break;
      }
      case 'ORG_ACCESS_DENIED':
      case 'ORG_ROLE_INSUFFICIENT': {
        // セキュリティ重視: 組織の存在を隠すため 404 で統一
        redirect('/404');
        break;
      }
      default:
        throw error;
    }
  }
  throw error;
}

/**
 * API Routeでの権限エラーハンドリング用ヘルパー
 * P1-3: エラーハンドリング方針 - API では詳細なエラー情報を提供
 * 
 * 方針:
 * - 認証エラー: 401 Unauthorized (標準的な HTTP ステータス)
 * - 組織アクセスエラー: 403 Forbidden (詳細情報は最小限)
 * - ロール不足エラー: 403 Forbidden + 詳細情報 (開発時のデバッグ用)
 * 
 * 注意:
 * - API は開発者が使用する前提なので、SSR より詳細なエラー情報を返す
 * - ただし、組織の存在確認に使われないよう、メッセージは最小限に留める
 * - RLS により見えない組織も 403 で返すことで、存在の有無を隠蔽
 */
/**
 * Supabase RPC エラーの分類
 * P1-3: JSONB更新系とauth系で共通使用
 */
function classifySupabaseRPCError(errorMessage: string): 'auth' | 'permission' | 'validation' | 'unknown' {
  if (errorMessage.includes('unauthenticated')) {
    return 'auth';
  }
  if (errorMessage.includes('forbidden')) {
    return 'permission';
  }
  if (errorMessage.includes('invalid') || errorMessage.includes('too large') || errorMessage.includes('must be')) {
    return 'validation';
  }
  return 'unknown';
}

/**
 * API Route用エラーレスポンス生成（RPC対応版）
 * P1-3: Supabase RPC エラーも適切に処理
 */
export function createAuthErrorResponse(error: Error): NextResponse {
  // P1-3 権限ガードエラー
  if ('code' in error) {
    switch ((error as { code: string }).code) {
      case 'AUTH_REQUIRED': {
        return NextResponse.json(
          { error: 'Authentication required' }, 
          { status: 401 }
        );
      }
      case 'ORG_ACCESS_DENIED': {
        return NextResponse.json(
          { error: 'Organization access denied' }, 
          { status: 403 }
        );
      }
      case 'ORG_ROLE_INSUFFICIENT': {
        const roleError = error as OrgRoleError;
        return NextResponse.json(
          { 
            error: 'Insufficient role', 
            details: {
              required: roleError.requiredRoles,
              current: roleError.userRole
            }
          }, 
          { status: 403 }
        );
      }
    }
  }

  // Supabase RPC エラーの分類・変換
  const rpcErrorType = classifySupabaseRPCError(error.message);
  switch (rpcErrorType) {
    case 'auth':
      return NextResponse.json(
        { error: 'Authentication required', details: 'RPC authentication failed' }, 
        { status: 401 }
      );
    case 'permission':
      return NextResponse.json(
        { error: 'Permission denied', details: 'Insufficient organization role' }, 
        { status: 403 }
      );
    case 'validation':
      return NextResponse.json(
        { error: 'Validation error', details: error.message }, 
        { status: 400 }
      );
    case 'unknown':
    default:
      return NextResponse.json(
        { error: 'Internal server error', details: 'RPC operation failed' }, 
        { status: 500 }
      );
  }
}

//
// P1-3 最終エクスポート: 本番で使用する権限ガード関数
//
// 【SSRページ用】
// - requireAuthUser(): 基本認証要求
// - requireOrgMember(): 組織メンバー権限要求  
// - requireOrgRole(): 特定ロール以上要求
// - handleAuthErrorForSSR(): SSRエラー処理（404重視）
//
// 【API Route用】
// - requireAuthUser(): 基本認証要求（SSRと同じ）
// - requireOrgMember(): 組織メンバー権限要求（SSRと同じ）
// - requireOrgRole(): 特定ロール以上要求（SSRと同じ）
// - createAuthErrorResponse(): API JSONエラー処理（401/403）
//
// 【想定ユースケース】
// 1. SSR組織メンバー限定ページ: requireOrgMember() + handleAuthErrorForSSR()
// 2. SSR管理者限定ページ: requireOrgRole(['owner','admin']) + handleAuthErrorForSSR()
// 3. API組織メンバー限定: requireOrgMember() + createAuthErrorResponse()
// 4. API管理操作: requireOrgRole(['owner','admin']) + createAuthErrorResponse()
// 5. JSONB更新と権限の組み合わせ: requireOrgRole() → updateOrgFeatureFlags()
//