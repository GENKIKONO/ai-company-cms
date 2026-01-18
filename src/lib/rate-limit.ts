// APIレート制限システム
// 分散環境対応: Vercel KV または インメモリ

import { kv } from '@vercel/kv';
import { logger } from '@/lib/utils/logger';

interface RateLimitOptions {
  windowMs: number; // 時間窓（ミリ秒）
  maxRequests: number; // 最大リクエスト数
  keyGenerator?: (request: Request) => string; // カスタムキー生成
  skipFunction?: (request: Request) => boolean; // スキップ条件
}

interface RateLimitInfo {
  totalHits: number;
  totalHitsResetTime: Date;
  remaining: number;
}

// ============================================
// ストアインターフェース
// ============================================

interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }>;
  get(key: string): Promise<{ count: number; resetTime: number } | null>;
}

// ============================================
// インメモリストア（開発/フォールバック用）
// ============================================

class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    this.cleanup(now);

    const existing = this.store.get(key);
    const resetTime = existing?.resetTime && existing.resetTime > now
      ? existing.resetTime
      : now + windowMs;

    let count = 0;
    if (existing && existing.resetTime > now) {
      count = existing.count;
    }

    count++;
    this.store.set(key, { count, resetTime });

    return { count, resetTime };
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const now = Date.now();
    const data = this.store.get(key);
    if (!data || data.resetTime <= now) {
      return null;
    }
    return data;
  }

  private cleanup(now: number): void {
    for (const [mapKey, data] of Array.from(this.store.entries())) {
      if (data.resetTime < now) {
        this.store.delete(mapKey);
      }
    }
  }
}

// ============================================
// Vercel KVストア（本番用）
// ============================================

class VercelKVRateLimitStore implements RateLimitStore {
  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const kvKey = `rate_limit:${key}`;
    const ttlSeconds = Math.ceil(windowMs / 1000);

    try {
      // Lua-like atomic increment with expiry using multi/exec
      const count = await kv.incr(kvKey);

      // 新しいキーの場合のみTTL設定
      if (count === 1) {
        await kv.expire(kvKey, ttlSeconds);
      }

      // TTL取得してresetTime計算
      const ttl = await kv.ttl(kvKey);
      const resetTime = ttl > 0 ? now + (ttl * 1000) : now + windowMs;

      return { count, resetTime };
    } catch (error) {
      logger.error('[RateLimit] Vercel KV error, falling back to allow:', { data: error });
      // KVエラー時はリクエストを許可（可用性優先）
      return { count: 1, resetTime: now + windowMs };
    }
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const now = Date.now();
    const kvKey = `rate_limit:${key}`;

    try {
      const count = await kv.get<number>(kvKey);
      if (count === null) {
        return null;
      }

      const ttl = await kv.ttl(kvKey);
      const resetTime = ttl > 0 ? now + (ttl * 1000) : now;

      return { count, resetTime };
    } catch (error) {
      logger.error('[RateLimit] Vercel KV get error:', { data: error });
      return null;
    }
  }
}

// ============================================
// ストア選択（環境変数ベース）
// ============================================

function createStore(): RateLimitStore {
  // Vercel KV環境変数が設定されている場合はKVを使用
  const hasVercelKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

  if (hasVercelKV) {
    logger.info('[RateLimit] Using Vercel KV store');
    return new VercelKVRateLimitStore();
  }

  // フォールバック: インメモリ
  if (process.env.NODE_ENV === 'production') {
    logger.warn('[RateLimit] KV not configured in production, using in-memory store');
  }
  return new MemoryRateLimitStore();
}

// シングルトンストアインスタンス
let storeInstance: RateLimitStore | null = null;

function getStore(): RateLimitStore {
  if (!storeInstance) {
    storeInstance = createStore();
  }
  return storeInstance;
}

// ============================================
// レート制限チェック
// ============================================

export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<{ allowed: boolean; info: RateLimitInfo }> {
  const store = getStore();
  const key = identifier;

  const { count, resetTime } = await store.increment(key, options.windowMs);
  const allowed = count <= options.maxRequests;

  return {
    allowed,
    info: {
      totalHits: count,
      totalHitsResetTime: new Date(resetTime),
      remaining: Math.max(0, options.maxRequests - count)
    }
  };
}

// 同期API（後方互換性）- 非推奨
export function checkRateLimitSync(
  identifier: string,
  options: RateLimitOptions
): { allowed: boolean; info: RateLimitInfo } {
  // 同期APIはインメモリのみサポート（非推奨）
  void identifier; // 将来のため保持
  const now = Date.now();
  const count = 1;
  const resetTime = now + options.windowMs;

  // 警告ログ
  if (process.env.NODE_ENV === 'development') {
    logger.warn('[RateLimit] Using deprecated sync API. Please migrate to async checkRateLimit()');
  }

  const allowed = count <= options.maxRequests;

  return {
    allowed,
    info: {
      totalHits: count,
      totalHitsResetTime: new Date(resetTime),
      remaining: Math.max(0, options.maxRequests - count)
    }
  };
}

// ============================================
// レート制限ミドルウェア
// ============================================

export function createRateLimiter(options: RateLimitOptions) {
  return async (request: Request): Promise<Response | null> => {
    // スキップ条件チェック
    if (options.skipFunction && options.skipFunction(request)) {
      return null;
    }

    // キー生成
    const identifier = options.keyGenerator
      ? options.keyGenerator(request)
      : getDefaultIdentifier(request);

    const { allowed, info } = await checkRateLimit(identifier, options);

    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'レート制限に達しました。しばらく待ってから再試行してください。',
          retryAfter: Math.ceil((info.totalHitsResetTime.getTime() - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': options.maxRequests.toString(),
            'X-RateLimit-Remaining': info.remaining.toString(),
            'X-RateLimit-Reset': info.totalHitsResetTime.toISOString(),
            'Retry-After': Math.ceil((info.totalHitsResetTime.getTime() - Date.now()) / 1000).toString()
          }
        }
      );
    }

    return null; // レート制限通過
  };
}

// ============================================
// ヘルパー関数
// ============================================

// デフォルトの識別子生成（IP + User-Agent）
function getDefaultIdentifier(request: Request): string {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  return `${ip}:${userAgent.slice(0, 50)}`;
}

// クライアントIP取得
export function getClientIP(request: Request): string {
  // Vercel/Cloudflare等のプロキシ対応
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}

// ============================================
// ユーザーベースのレート制限
// ============================================

export function createUserRateLimiter(options: RateLimitOptions) {
  return createRateLimiter({
    ...options,
    keyGenerator: (request) => {
      // Authorization headerからユーザーIDを取得
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        try {
          // JWTデコード（簡易版）
          const token = authHeader.slice(7);
          const payload = JSON.parse(atob(token.split('.')[1]));
          return `user:${payload.sub || payload.user_id || 'anonymous'}`;
        } catch {
          // JWTパースに失敗した場合はIPベース
          return getDefaultIdentifier(request);
        }
      }
      return getDefaultIdentifier(request);
    }
  });
}

// ============================================
// 特定API用のレート制限設定
// ============================================

export const rateLimitConfigs = {
  // 承認リンク関連
  approval: {
    windowMs: 15 * 60 * 1000, // 15分
    maxRequests: 3, // 15分間に最大3回
  },

  // テキスト抽出
  extraction: {
    windowMs: 60 * 1000, // 1分
    maxRequests: 10, // 1分間に最大10回
  },

  // Stripe Webhook
  webhook: {
    windowMs: 5 * 60 * 1000, // 5分
    maxRequests: 100, // 5分間に最大100回
  },

  // 一般API
  general: {
    windowMs: 60 * 1000, // 1分
    maxRequests: 60, // 1分間に最大60回
  },

  // 公開API（高頻度）
  public: {
    windowMs: 60 * 1000, // 1分
    maxRequests: 300, // 1分間に最大300回
  }
};

// ============================================
// プリセットエクスポート
// ============================================

export const approvalRateLimit = createUserRateLimiter(rateLimitConfigs.approval);
export const extractionRateLimit = createUserRateLimiter(rateLimitConfigs.extraction);
export const webhookRateLimit = createRateLimiter({
  ...rateLimitConfigs.webhook,
  keyGenerator: (request) => getClientIP(request) // IPベース
});
export const generalRateLimit = createUserRateLimiter(rateLimitConfigs.general);
export const publicRateLimit = createRateLimiter({
  ...rateLimitConfigs.public,
  keyGenerator: (request) => getClientIP(request) // IPベース
});

// ============================================
// ストア状態確認（診断用）
// ============================================

export function getRateLimitStoreType(): 'vercel-kv' | 'memory' {
  const hasVercelKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
  return hasVercelKV ? 'vercel-kv' : 'memory';
}
