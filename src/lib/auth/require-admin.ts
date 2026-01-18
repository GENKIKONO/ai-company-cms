/**
 * Admin Guard Utility
 *
 * SSR/Route Handler両方で利用可能な管理者認証ガード
 * site_admins テーブルで user_id が存在するかチェック
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse, NextRequest } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { checkIPAllowlist } from '@/lib/security/ip-allowlist';

export interface AdminCheckResult {
  isAdmin: boolean;
  userId: string | null;
  error?: {
    success: false;
    error_code: 'UNAUTHORIZED' | 'FORBIDDEN';
    message: string;
  };
}

export interface AdminGuardResponse {
  success: false;
  error_code: 'UNAUTHORIZED' | 'FORBIDDEN';
  message: string;
}

// 明示的なユニオン型定義
export type AdminAuthResult =
  | { authorized: true; userId: string }
  | { authorized: false; response: NextResponse<AdminGuardResponse> };

// 型ガード関数
export function isAuthorized(
  result: AdminAuthResult
): result is { authorized: true; userId: string } {
  return result.authorized === true;
}

/**
 * 管理者権限をチェック（SSR/Route Handler両方対応）
 * @returns AdminCheckResult
 */
export async function checkAdminAuth(): Promise<AdminCheckResult> {
  try {
    const supabase = await createClient();

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        isAdmin: false,
        userId: null,
        error: {
          success: false,
          error_code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };
    }

    // site_admins チェック（主キーは user_id、DB確認済み）
    const { data: adminCheck, error: adminError } = await supabase
      .from('site_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminCheck) {
      return {
        isAdmin: false,
        userId: user.id,
        error: {
          success: false,
          error_code: 'FORBIDDEN',
          message: 'Admin only',
        },
      };
    }

    return {
      isAdmin: true,
      userId: user.id,
    };
  } catch (err) {
    logger.error('Admin auth check failed:', { data: err });
    return {
      isAdmin: false,
      userId: null,
      error: {
        success: false,
        error_code: 'UNAUTHORIZED',
        message: 'Authentication check failed',
      },
    };
  }
}

/**
 * Route Handler用のガード関数
 * 管理者でない場合は適切なエラーレスポンスを返す
 *
 * @param request - オプション。IPアローリストチェック用
 */
export async function requireAdmin(request?: NextRequest | Request): Promise<AdminAuthResult> {
  // IPアローリストチェック（有効な場合のみ）
  if (request) {
    const ipCheck = checkIPAllowlist(request);
    if (!ipCheck.allowed) {
      logger.warn('[requireAdmin] IP not in allowlist', {
        clientIP: ipCheck.clientIP,
        reason: ipCheck.reason
      });
      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            error_code: 'FORBIDDEN' as const,
            message: 'Access denied',
          },
          { status: 403 }
        ),
      };
    }
  }

  const result = await checkAdminAuth();

  if (!result.isAdmin || !result.userId) {
    const status = result.error?.error_code === 'UNAUTHORIZED' ? 401 : 403;
    return {
      authorized: false,
      response: NextResponse.json(
        result.error || {
          success: false,
          error_code: 'FORBIDDEN',
          message: 'Admin only',
        },
        { status }
      ),
    };
  }

  return {
    authorized: true,
    userId: result.userId,
  };
}

/**
 * Server Component用のガード関数
 * 管理者でない場合は redirect または null を返す
 */
export async function requireAdminSSR(): Promise<{
  isAdmin: boolean;
  userId: string | null;
  redirectPath?: string;
}> {
  const result = await checkAdminAuth();

  if (!result.isAdmin) {
    return {
      isAdmin: false,
      userId: null,
      redirectPath: result.error?.error_code === 'UNAUTHORIZED' ? '/login' : '/dashboard',
    };
  }

  return {
    isAdmin: true,
    userId: result.userId,
  };
}
