// セキュリティ用レート制限
// メインの実装は @/lib/rate-limit.ts を使用

import { checkRateLimit } from '@/lib/rate-limit';

interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfter: number;
}

/**
 * セキュリティ用レート制限
 * 内部的に @/lib/rate-limit の分散対応実装を使用
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const { allowed, info } = await checkRateLimit(identifier, {
    windowMs,
    maxRequests: limit
  });

  return {
    success: allowed,
    remaining: info.remaining,
    retryAfter: allowed ? 0 : Math.max(0, info.totalHitsResetTime.getTime() - Date.now())
  };
}