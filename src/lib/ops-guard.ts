/**
 * 管理者運用専用アクセスガード
 * 
 * 責務:
 * - Supabase SSR認証確認
 * - ADMIN_EMAIL との照合
 * - ops_admin クッキー確認
 * - 未認証時のリダイレクト/エラーレスポンス
 */
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase-server';
import { env } from '@/lib/env';
import { logger } from '@/lib/utils/logger';

export interface OpsGuardResult {
  isAuthorized: boolean;
  user?: any;
  reason?: string;
}

/**
 * 管理者チェック（小文字・trim対応）
 */
function isAdmin(userEmail?: string): boolean {
  if (!env.ADMIN_EMAIL || !userEmail) return false;
  return userEmail.toLowerCase().trim() === env.ADMIN_EMAIL;
}

/**
 * 管理者運用認証チェック
 * 1. Supabase SSR で認証ユーザー取得
 * 2. ADMIN_EMAIL との照合（小文字・trim）
 * 3. ops_admin クッキーの有効性確認
 */
export async function checkOpsAdmin(): Promise<OpsGuardResult> {
  try {
    // Supabase SSR認証確認
    const supabase = await supabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      logger.error('[checkOpsAdmin] Missing Supabase session:', error?.message || 'no user');
      return {
        isAuthorized: false,
        reason: 'MISSING_SESSION'
      };
    }
    
    // ADMIN_EMAIL照合（小文字・trim）
    if (!isAdmin(user.email)) {
      logger.error('[checkOpsAdmin] Not admin user:', user.email);
      return {
        isAuthorized: false,
        user,
        reason: 'NOT_ADMIN'
      };
    }
    
    // ops_admin クッキー確認
    const cookieStore = await cookies();
    const opsAdminCookie = cookieStore.get('ops_admin');
    
    if (!opsAdminCookie || opsAdminCookie.value !== '1') {
      logger.error('[checkOpsAdmin] Missing ops_admin cookie for admin:', user.email);
      return {
        isAuthorized: false,
        user,
        reason: 'MISSING_OPS_COOKIE'
      };
    }
    
    return {
      isAuthorized: true,
      user
    };
    
  } catch (error) {
    logger.error('[checkOpsAdmin] Unexpected error', error instanceof Error ? error : new Error(String(error)));
    return {
      isAuthorized: false,
      reason: 'INTERNAL_ERROR'
    };
  }
}

/**
 * Server Component / Page用ガード
 * 認証失敗時は /ops/login にリダイレクト
 */
export async function requireOpsAdminPage(): Promise<void> {
  const result = await checkOpsAdmin();
  
  if (!result.isAuthorized) {
    logger.error('[requireOpsAdminPage] Access denied:', result.reason);
    redirect('/ops/login');
  }
}

/**
 * API Route用ガード
 * 認証失敗時は 403 JSON レスポンスを返す
 */
export async function requireOpsAdminAPI(request?: NextRequest): Promise<NextResponse | null> {
  const result = await checkOpsAdmin();
  
  if (!result.isAuthorized) {
    return NextResponse.json(
      {
        code: 'FORBIDDEN',
        reason: 'Admin access required',
        details: result.reason
      },
      { status: 403 }
    );
  }
  
  return null; // 認証OK
}

/**
 * 管理者状態の詳細情報取得（診断用）
 */
export async function getOpsAdminStatus() {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    const cookieStore = await cookies();
    const opsAdminCookie = cookieStore.get('ops_admin');
    
    return {
      supabaseAuth: {
        authenticated: !!user && !error,
        email: user?.email || null,
        userId: user?.id || null,
        error: error?.message || null
      },
      adminCheck: {
        isAdminEmail: isAdmin(user?.email),
        configuredAdminEmail: env.ADMIN_EMAIL ? '***configured***' : null
      },
      opsAdmin: {
        hasCookie: !!opsAdminCookie,
        cookieValue: opsAdminCookie?.value || null,
        isValid: opsAdminCookie?.value === '1'
      },
      overall: {
        isAuthorized: !!user && !error && isAdmin(user.email) && opsAdminCookie?.value === '1'
      }
    };
  } catch (error) {
    logger.error('[getOpsAdminStatus] Unexpected error', error instanceof Error ? error : new Error(String(error)));
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      overall: { isAuthorized: false }
    };
  }
}