/**
 * 管理者認証ユーティリティ
 * 運用管理機能への管理者アクセス制御
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';

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

    // 管理者権限をチェック
    const isAdmin = await checkAdminPermission(user.id, user.email);
    if (!isAdmin) {
      return {
        success: false,
        error: 'Admin access required'
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
    console.error('Admin auth error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * 管理者権限チェック
 */
async function checkAdminPermission(userId: string, email?: string): Promise<boolean> {
  // 環境変数で設定された管理者メールアドレスとマッチするかチェック
  if (email && env.ADMIN_EMAIL && email === env.ADMIN_EMAIL) {
    return true;
  }

  // 追加の管理者権限チェックロジックをここに実装
  // 例: データベースでユーザーの role を確認
  
  return false;
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
export function logSecurityEvent(event: {
  type: 'admin_access' | 'auth_failure' | 'rate_limit' | 'permission_denied';
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
}): void {
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
    // TODO: Send to external logging service (Sentry, CloudWatch, etc.)
    console.log('SECURITY EVENT:', logEntry);
  } else {
    console.log('🔒 Security Event:', logEntry);
  }
}