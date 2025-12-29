/**
 * 管理者認証ユーティリティ
 * 運用管理機能への管理者アクセス制御
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import { logger } from '@/lib/utils/logger';
import { assertAccountUsable, canAccessAdminFeatures, type AccountStatus } from '@/lib/auth/account-status-guard';

export interface AuthContext {
  user: {
    id: string;
    email?: string;
    role: string;
  };
}

export interface AuthResult {
  success: boolean;
  error?: string;
  context?: AuthContext;
}

/**
 * 管理者認証を要求
 */
export async function requireAdminAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Cookie ヘッダーからSupabaseクライアントを作成
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = new Map();
    
    // Cookieパース
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies.set(name, value);
      }
    });

    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return Array.from(cookies.entries()).map(([name, value]) => ({ name, value }));
          },
          setAll() {
            // API routeでは cookie設定は不要
          },
        },
      }
    );

    // ユーザー認証状態をチェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // プロファイル情報取得（account_status含む）
    const { isAdmin, accountStatus } = await checkAdminPermissionWithStatus(user.id, user.email);
    if (!isAdmin) {
      return {
        success: false,
        error: 'Admin access required'
      };
    }

    // アカウント状態チェック（active/warned以外は管理機能アクセス不可）
    try {
      assertAccountUsable(accountStatus);
    } catch (error: any) {
      // 制裁状態の場合は適切なエラーコードを返す
      const errorMessage = error.code === 'ACCOUNT_DELETED' ? 'Authentication required' : 'Admin access restricted';
      const statusCode = error.status || 403;
      
      return {
        success: false,
        error: `${errorMessage}: ${error.message || 'Account status restriction'}`
      };
    }

    return {
      success: true,
      context: {
        user: {
          id: user.id,
          email: user.email,
          role: 'admin'
        }
      }
    };
  } catch (error) {
    logger.error('Admin auth error', { data: error instanceof Error ? error : new Error(String(error)) });
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * 管理者権限チェック（従来版）
 */
async function checkAdminPermission(userId: string, email?: string): Promise<boolean> {
  // 環境変数で設定された管理者メールアドレスとマッチするかチェック
  if (email && env.ADMIN_EMAIL && email === env.ADMIN_EMAIL) {
    return true;
  }

  // ADMIN_EMAILS環境変数（カンマ区切り）でのチェック
  if (email && process.env.ADMIN_EMAILS) {
    const adminEmails = process.env.ADMIN_EMAILS.split(',').map(e => e.trim());
    if (adminEmails.includes(email)) {
      return true;
    }
  }

  // 追加の管理者権限チェックロジックをここに実装
  // 例: データベースでユーザーの role を確認
  
  return false;
}

/**
 * 管理者権限・アカウント状態チェック（account_status含む）
 * @param userId - ユーザーID
 * @param email - メールアドレス
 * @returns 管理者権限とアカウントステータス
 */
async function checkAdminPermissionWithStatus(userId: string, email?: string): Promise<{
  isAdmin: boolean;
  accountStatus: AccountStatus;
}> {
  try {
    // Supabaseクライアント作成（Service Role使用）
    const supabase = createServerClient(
      env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    );

    // プロファイル情報取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, account_status')
      .eq('id', userId)
      .single();

    const accountStatus = (profile?.account_status || 'active') as AccountStatus;
    
    // 既存の管理者チェックロジックを実行
    let isAdmin = await checkAdminPermission(userId, email);
    
    // データベースのroleもチェック
    if (!isAdmin && profile?.role === 'admin') {
      isAdmin = true;
    }

    // site_admins テーブルでの管理者権限チェック（追加）
    // 主キーは user_id（DB確認済み）
    if (!isAdmin) {
      const { data: siteAdmin } = await supabase
        .from('site_admins')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (siteAdmin) {
        isAdmin = true;
      }
    }

    return {
      isAdmin,
      accountStatus
    };
  } catch (error) {
    logger.error('Admin permission check error', { data: error });
    return {
      isAdmin: false,
      accountStatus: 'active' as AccountStatus
    };
  }
}

/**
 * 運用パスワード認証（追加のセキュリティレイヤー）
 */
export async function requireOpsPassword(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const providedPassword = authHeader.replace('Bearer ', '');
  return providedPassword === env.ADMIN_OPS_PASSWORD;
}

/**
 * API リクエストのレート制限チェック
 */
export class AdminRateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();
  private static readonly WINDOW_MS = 60 * 1000; // 1分
  private static readonly MAX_REQUESTS = 100; // 1分間に最大100リクエスト

  static checkLimit(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier);

    if (!userRequests || now > userRequests.resetTime) {
      // 新しいウィンドウまたは期限切れ
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.WINDOW_MS
      });
      return true;
    }

    if (userRequests.count >= this.MAX_REQUESTS) {
      return false; // レート制限に達している
    }

    userRequests.count++;
    return true;
  }

  static getRemainingRequests(identifier: string): number {
    const userRequests = this.requests.get(identifier);
    if (!userRequests || Date.now() > userRequests.resetTime) {
      return this.MAX_REQUESTS;
    }
    return Math.max(0, this.MAX_REQUESTS - userRequests.count);
  }

  static cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.requests.forEach((value, key) => {
      if (now > value.resetTime) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.requests.delete(key));
  }
}

/**
 * 管理者認証チェック関数を作成
 * ミドルウェア用のファクトリー関数
 */
export function createAdminAuthCheck() {
  return async (request: NextRequest): Promise<AuthResult> => {
    // IP アドレス取得
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // レート制限チェック
    if (!AdminRateLimiter.checkLimit(ip)) {
      logSecurityEvent({
        type: 'rate_limit',
        ip,
        userAgent: request.headers.get('user-agent') || undefined,
        details: { endpoint: request.url }
      });
      
      return {
        success: false,
        error: 'Rate limit exceeded'
      };
    }

    // 管理者認証実行
    const authResult = await requireAdminAuth(request);
    
    if (!authResult.success) {
      logSecurityEvent({
        type: 'auth_failure',
        ip,
        userAgent: request.headers.get('user-agent') || undefined,
        details: { 
          endpoint: request.url,
          error: authResult.error 
        }
      });
    } else {
      logSecurityEvent({
        type: 'admin_access',
        userId: authResult.context?.user.id,
        email: authResult.context?.user.email,
        ip,
        userAgent: request.headers.get('user-agent') || undefined,
        details: { endpoint: request.url }
      });
    }

    return authResult;
  };
}

/**
 * セキュリティログ記録
 */
export async function logSecurityEvent(event: {
  type: 'admin_access' | 'auth_failure' | 'rate_limit' | 'permission_denied';
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
}): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: event.type,
    userId: event.userId,
    email: event.email,
    ip: event.ip,
    userAgent: event.userAgent,
    details: event.details
  };

  // 本番環境では外部ログサービスに送信
  if (process.env.NODE_ENV === 'production') {
    // 重要なセキュリティイベントはSentryに送信
    try {
      const { captureMessage } = await import('@/lib/utils/sentry-utils');
      captureMessage(`Security Event: ${event.type}`, 'warning', {
        userId: event.userId,
        email: event.email,
        ip: event.ip,
        userAgent: event.userAgent,
        details: event.details,
        security: {
          eventType: event.type,
          timestamp: logEntry.timestamp,
        },
      });
    } catch (sentryError) {
      console.warn('Failed to send security event to Sentry:', sentryError);
    }
    logger.debug('SECURITY EVENT', logEntry);
  } else {
    logger.debug('🔒 Security Event', logEntry);
  }
}