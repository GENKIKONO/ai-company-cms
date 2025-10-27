/**
 * API認証・認可ミドルウェア
 * フロー共存対応の統一認証チェック
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { determineUserFlow, calculateUserAccess, canAccessApiEndpoint } from '@/lib/auth/flow-detection';
import { unauthorizedError, forbiddenError } from './error-responses';
import { createApiUsageMiddleware, BusinessEventLogger, logSecurityEvent } from './audit-logger';
import { logger } from '@/lib/utils/logger';

export interface AuthContext {
  user: any;
  userAccess: any;
  orgId?: string;
}

/**
 * API認証チェック
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext | Response> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
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
      // セキュリティイベントログ
      logSecurityEvent('auth_failed', {
        endpoint: new URL(request.url).pathname,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        error: error?.message
      });
      return unauthorizedError('Authentication required');
    }

    // ユーザーの組織情報を取得
    const { data: organizations } = await supabase
      .from('organization_profiles')
      .select('organization_id, role')
      .eq('user_id', user.id);

    const userRole = user.user_metadata?.role || 'org_owner';
    const userAccess = calculateUserAccess(
      userRole,
      (organizations || []).map(org => ({
        id: org.organization_id,
        user_role: org.role
      }))
    );

    return {
      user,
      userAccess,
    };
  } catch (error) {
    logger.error('Auth middleware error', error instanceof Error ? error : new Error(String(error)));
    return unauthorizedError('Authentication failed');
  }
}

/**
 * API権限チェック
 */
export function requirePermission(
  authContext: AuthContext,
  endpoint: string,
  orgId?: string
): Response | null {
  if (!canAccessApiEndpoint(authContext.userAccess, endpoint, orgId)) {
    return forbiddenError(`Access denied to ${endpoint}`);
  }
  return null;
}

/**
 * パートナー権限チェック
 */
export function requirePartnerAccess(authContext: AuthContext): Response | null {
  if (authContext.userAccess.flow !== 'partner' && authContext.userAccess.flow !== 'admin') {
    return forbiddenError('Partner access required');
  }
  return null;
}

/**
 * 管理者権限チェック
 */
export function requireAdminAccess(authContext: AuthContext): Response | null {
  if (authContext.userAccess.flow !== 'admin') {
    return forbiddenError('Admin access required');
  }
  return null;
}

/**
 * 組織オーナー権限チェック
 */
export function requireOrgOwner(authContext: AuthContext, orgId: string): Response | null {
  if (authContext.userAccess.flow === 'admin') {
    return null; // 管理者は全アクセス可能
  }

  if (authContext.userAccess.flow === 'partner') {
    if (!authContext.userAccess.accessibleOrgIds.includes(orgId)) {
      return forbiddenError('Organization access denied');
    }
    return null;
  }

  if (authContext.userAccess.flow === 'self_serve') {
    if (authContext.userAccess.ownedOrgId !== orgId) {
      return forbiddenError('Organization access denied');
    }
    return null;
  }

  return forbiddenError('Insufficient permissions');
}

/**
 * セルフサーブ専用チェック
 */
export function requireSelfServeAccess(authContext: AuthContext): Response | null {
  if (authContext.userAccess.flow !== 'self_serve') {
    return forbiddenError('Self-serve access required');
  }
  return null;
}