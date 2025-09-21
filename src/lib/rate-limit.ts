// APIレート制限システム

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

// インメモリレート制限ストア（本格運用時はRedisを推奨）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// レート制限チェック
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): { allowed: boolean; info: RateLimitInfo } {
  const now = Date.now();
  const key = `rate_limit:${identifier}`;
  
  // 古いエントリをクリーンアップ
  for (const [mapKey, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(mapKey);
    }
  }
  
  const existing = rateLimitStore.get(key);
  const resetTime = existing?.resetTime || now + options.windowMs;
  
  let count = 0;
  if (existing && existing.resetTime > now) {
    count = existing.count;
  }
  
  const allowed = count < options.maxRequests;
  
  if (allowed) {
    rateLimitStore.set(key, {
      count: count + 1,
      resetTime: resetTime
    });
  }
  
  return {
    allowed,
    info: {
      totalHits: count + (allowed ? 1 : 0),
      totalHitsResetTime: new Date(resetTime),
      remaining: Math.max(0, options.maxRequests - count - (allowed ? 1 : 0))
    }
  };
}

// レート制限ミドルウェア
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
    
    const { allowed, info } = checkRateLimit(identifier, options);
    
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

// デフォルトの識別子生成（IP + User-Agent）
function getDefaultIdentifier(request: Request): string {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  return `${ip}:${userAgent.slice(0, 50)}`;
}

// クライアントIP取得
function getClientIP(request: Request): string {
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

// ユーザーベースのレート制限
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

// 特定API用のレート制限設定
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

// レート制限関数のエクスポート
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