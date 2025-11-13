interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfter: number;
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// メモリベース（Redis代替）
const memoryStore = new Map<string, RateLimitStore>();

export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `rateLimit:${identifier}`;
  
  // 期限切れエントリをクリーンアップ
  cleanupExpiredEntries(now);
  
  const store = memoryStore.get(key);
  
  if (!store || store.resetTime <= now) {
    // 新しいウィンドウ
    memoryStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    
    return {
      success: true,
      remaining: limit - 1,
      retryAfter: 0
    };
  }
  
  if (store.count >= limit) {
    // 制限超過
    return {
      success: false,
      remaining: 0,
      retryAfter: store.resetTime - now
    };
  }
  
  // カウント増加
  store.count++;
  memoryStore.set(key, store);
  
  return {
    success: true,
    remaining: limit - store.count,
    retryAfter: 0
  };
}

function cleanupExpiredEntries(now: number): void {
  for (const [key, store] of memoryStore.entries()) {
    if (store.resetTime <= now) {
      memoryStore.delete(key);
    }
  }
}

// Redis実装版（本格運用時）
export async function rateLimitRedis(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  // Redis実装は要ライブラリ: ioredis
  // const redis = new Redis(process.env.REDIS_URL);
  // 
  // const key = `rateLimit:${identifier}`;
  // const current = await redis.incr(key);
  // 
  // if (current === 1) {
  //   await redis.expire(key, Math.ceil(windowMs / 1000));
  // }
  // 
  // const ttl = await redis.ttl(key);
  // const retryAfter = ttl * 1000;
  // 
  // return {
  //   success: current <= limit,
  //   remaining: Math.max(0, limit - current),
  //   retryAfter: current > limit ? retryAfter : 0
  // };
  
  throw new Error('Redis implementation required for production');
}