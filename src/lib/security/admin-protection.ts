import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { requireAdminPermission, getServerUser } from '@/lib/auth/server';
import { rateLimit } from './rate-limit';
import { logger } from '@/lib/utils/logger';

// 管理者API保護設定
interface AdminProtectionConfig {
  requireSignature?: boolean;
  maxRequestsPerHour?: number;
  maxRequestsPerDay?: number;
  allowedIPs?: string[];
  logSensitiveData?: boolean;
  requireDoubleAuth?: boolean;
}

// デフォルト設定
const DEFAULT_CONFIG: AdminProtectionConfig = {
  requireSignature: true,
  maxRequestsPerHour: 100,
  maxRequestsPerDay: 1000,
  allowedIPs: [],
  logSensitiveData: false,
  requireDoubleAuth: false
};

// 管理者API保護ラッパー
export function withAdminProtection(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  config: Partial<AdminProtectionConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return async function protectedHandler(
    req: NextRequest, 
    context?: any
  ): Promise<NextResponse> {
    try {
      // 1. IP制限チェック
      if (finalConfig.allowedIPs && finalConfig.allowedIPs.length > 0) {
        const clientIP = getClientIP(req);
        if (!isIPAllowed(clientIP, finalConfig.allowedIPs)) {
          logger.warn(`Admin API access denied for IP: ${clientIP}`, {
            path: req.nextUrl.pathname,
            method: req.method,
            ip: clientIP
          });
          
          return NextResponse.json(
            { error: 'Access denied: IP not allowed' },
            { status: 403 }
          );
        }
      }

      // 2. 署名検証
      if (finalConfig.requireSignature) {
        const isValidSignature = await verifyAdminSignature(req);
        if (!isValidSignature) {
          logger.error('Admin API signature validation failed', {
            path: req.nextUrl.pathname,
            method: req.method
          });
          
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
          );
        }
      }

      // 3. 管理者権限チェック
      await requireAdminPermission();
      const adminUser = await getServerUser();
      
      if (!adminUser) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // 4. 強化されたレート制限
      const rateLimitResult = await checkEnhancedRateLimit(
        adminUser.id,
        finalConfig.maxRequestsPerHour || 100,
        finalConfig.maxRequestsPerDay || 1000
      );

      if (!rateLimitResult.allowed) {
        logger.warn(`Admin API rate limit exceeded for user: ${adminUser.id}`, {
          hourlyRequests: rateLimitResult.hourlyCount,
          dailyRequests: rateLimitResult.dailyCount,
          limits: {
            hourly: finalConfig.maxRequestsPerHour,
            daily: finalConfig.maxRequestsPerDay
          }
        });

        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            resetTime: rateLimitResult.resetTime,
            remainingRequests: rateLimitResult.remaining
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(finalConfig.maxRequestsPerHour),
              'X-RateLimit-Remaining': String(rateLimitResult.remaining),
              'X-RateLimit-Reset': String(rateLimitResult.resetTime)
            }
          }
        );
      }

      // 5. 二要素認証チェック（設定されている場合）
      if (finalConfig.requireDoubleAuth) {
        const doubleAuthValid = await verifyDoubleAuth(req, adminUser.id);
        if (!doubleAuthValid) {
          return NextResponse.json(
            { error: 'Double authentication required' },
            { status: 403 }
          );
        }
      }

      // 6. 監査ログ（リクエスト開始）
      await logAdminApiAccess(req, adminUser, 'REQUEST_START');

      // 7. 元のハンドラーを実行
      const response = await handler(req, context);

      // 8. 監査ログ（リクエスト完了）
      await logAdminApiAccess(req, adminUser, 'REQUEST_END', {
        responseStatus: response.status
      });

      // 9. レスポンスヘッダーに追加のセキュリティ情報
      response.headers.set('X-Admin-Protection', 'enabled');
      response.headers.set('X-Request-ID', generateRequestID());

      return response;

    } catch (error) {
      logger.error('Admin API protection error', {
        error: error instanceof Error ? error.message : String(error),
        path: req.nextUrl.pathname,
        method: req.method
      });

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// クライアントIP取得
function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

// IP許可チェック
function isIPAllowed(clientIP: string, allowedIPs: string[]): boolean {
  if (clientIP === 'unknown') return false;
  
  return allowedIPs.some(allowedIP => {
    try {
      // CIDR表記対応
      if (allowedIP.includes('/')) {
        // 簡易CIDR チェック（本格的な実装では外部ライブラリを使用）
        const [network, prefixLength] = allowedIP.split('/');
        return clientIP.startsWith(network.split('.').slice(0, Math.floor(parseInt(prefixLength) / 8)).join('.'));
      }
      
      // 完全一致
      return clientIP === allowedIP;
    } catch {
      return false;
    }
  });
}

// 管理者API署名検証
async function verifyAdminSignature(req: NextRequest): Promise<boolean> {
  try {
    const headersList = await headers();
    const signature = headersList.get('x-admin-signature');
    const timestamp = headersList.get('x-admin-timestamp');
    const nonce = headersList.get('x-admin-nonce');
    
    if (!signature || !timestamp || !nonce) {
      return false;
    }

    // タイムスタンプ検証（5分以内）
    const now = Date.now();
    const requestTime = parseInt(timestamp);
    if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
      return false;
    }

    // リクエストボディ取得
    const body = await req.text();
    
    // 署名生成
    const secretKey = process.env.ADMIN_API_SECRET_KEY;
    if (!secretKey) {
      logger.error('ADMIN_API_SECRET_KEY not configured');
      return false;
    }

    const payload = `${req.method}|${req.nextUrl.pathname}|${timestamp}|${nonce}|${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(payload, 'utf8')
      .digest('hex');

    // 署名比較
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    logger.error('Admin signature verification error', error);
    return false;
  }
}

// 強化されたレート制限チェック
async function checkEnhancedRateLimit(
  userId: string,
  maxRequestsPerHour: number,
  maxRequestsPerDay: number
): Promise<{
  allowed: boolean;
  hourlyCount: number;
  dailyCount: number;
  remaining: number;
  resetTime: number;
}> {
  const now = new Date();
  const hourKey = `admin_rate_${userId}_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_${now.getHours()}`;
  const dayKey = `admin_rate_${userId}_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;

  // メモリベース実装（本格運用ではRedisを使用）
  const hourlyResult = await rateLimit(hourKey, maxRequestsPerHour, 3600000);
  const dailyResult = await rateLimit(dayKey, maxRequestsPerDay, 86400000);

  const hourlyAllowed = hourlyResult.success;
  const dailyAllowed = dailyResult.success;

  return {
    allowed: hourlyAllowed && dailyAllowed,
    hourlyCount: maxRequestsPerHour - hourlyResult.remaining,
    dailyCount: maxRequestsPerDay - dailyResult.remaining,
    remaining: Math.min(hourlyResult.remaining, dailyResult.remaining),
    resetTime: Math.max(hourlyResult.retryAfter, dailyResult.retryAfter)
  };
}

// 二要素認証検証（TOTPトークン）
async function verifyDoubleAuth(req: NextRequest, userId: string): Promise<boolean> {
  try {
    const headersList = await headers();
    const totpToken = headersList.get('x-admin-totp');
    
    if (!totpToken) {
      return false;
    }

    // TOTP検証ロジック（実装例）
    // 本格実装では speakeasy や similar ライブラリを使用
    const userSecret = process.env[`TOTP_SECRET_${userId}`];
    if (!userSecret) {
      return false;
    }

    // 簡易TOTP検証（本格実装が必要）
    const timeStep = Math.floor(Date.now() / 30000);
    const expectedToken = generateSimpleTOTP(userSecret, timeStep);
    
    return totpToken === expectedToken;
  } catch {
    return false;
  }
}

// 簡易TOTP生成（実際はライブラリを使用）
function generateSimpleTOTP(secret: string, timeStep: number): string {
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(Buffer.from(timeStep.toString()));
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0xf;
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, '0');
}

// 管理者APIアクセス監査ログ
async function logAdminApiAccess(
  req: NextRequest,
  user: any,
  event: string,
  metadata?: any
): Promise<void> {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId: user.id,
      userEmail: user.email,
      method: req.method,
      path: req.nextUrl.pathname,
      query: Object.fromEntries(req.nextUrl.searchParams),
      ip: getClientIP(req),
      userAgent: req.headers.get('user-agent'),
      ...metadata
    };

    logger.info('Admin API Access', logEntry);

    // 監査ログテーブルへの記録（設定されている場合）
    if (process.env.ENABLE_ADMIN_AUDIT_DB === 'true') {
      // データベース監査ログ記録
      // 実装は環境に応じて調整
    }
  } catch (error) {
    logger.error('Failed to log admin API access', error);
  }
}

// リクエストID生成
function generateRequestID(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 管理者API用のHTTPSチェック
export function requireHTTPS(req: NextRequest): boolean {
  const proto = req.headers.get('x-forwarded-proto') || 
                req.nextUrl.protocol;
  
  return proto === 'https:';
}

// 管理者API統計情報
export interface AdminAPIStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  topEndpoints: Array<{ path: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
}

// API統計取得（管理者用）
export async function getAdminAPIStats(
  timeframe: '1h' | '24h' | '7d' | '30d' = '24h'
): Promise<AdminAPIStats> {
  // 実装は監査ログから統計を生成
  // 本格実装では専用の集計テーブルやRedisを使用
  return {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    rateLimitedRequests: 0,
    topEndpoints: [],
    topUsers: []
  };
}