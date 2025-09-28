/**
 * Performance Monitoring Middleware
 * APIレスポンス時間とパフォーマンス監視
 */

import { NextRequest, NextResponse } from 'next/server';

interface PerformanceMetrics {
  path: string;
  method: string;
  responseTime: number;
  status: number;
  timestamp: number;
  userAgent?: string;
  size?: number;
}

// メモリ内メトリクス保存（本番では外部DB推奨）
let performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS = 1000; // 最大保存数

/**
 * パフォーマンス監視ミドルウェア
 */
export function withPerformanceMonitoring(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const url = new URL(request.url);
    
    try {
      // ハンドラー実行
      const response = await handler(request);
      
      // メトリクス記録
      recordMetrics({
        path: url.pathname,
        method: request.method,
        responseTime: Date.now() - startTime,
        status: response.status,
        timestamp: Date.now(),
        userAgent: request.headers.get('user-agent') || undefined,
        size: getResponseSize(response)
      });

      // パフォーマンスヘッダー追加
      response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
      response.headers.set('X-Server-Timing', `total;dur=${Date.now() - startTime}`);

      return response;
    } catch (error) {
      // エラー時もメトリクス記録
      recordMetrics({
        path: url.pathname,
        method: request.method,
        responseTime: Date.now() - startTime,
        status: 500,
        timestamp: Date.now(),
        userAgent: request.headers.get('user-agent') || undefined
      });

      throw error;
    }
  };
}

/**
 * メトリクス記録
 */
function recordMetrics(metrics: PerformanceMetrics): void {
  performanceMetrics.unshift(metrics);
  
  // サイズ制限
  if (performanceMetrics.length > MAX_METRICS) {
    performanceMetrics = performanceMetrics.slice(0, MAX_METRICS);
  }

  // 遅いリクエストの警告
  if (metrics.responseTime > 1000) {
    console.warn(`🐌 Slow request: ${metrics.method} ${metrics.path} - ${metrics.responseTime}ms`);
  }
}

/**
 * レスポンスサイズ取得
 */
function getResponseSize(response: NextResponse): number | undefined {
  const contentLength = response.headers.get('content-length');
  return contentLength ? parseInt(contentLength) : undefined;
}

/**
 * メトリクス取得
 */
export function getPerformanceMetrics(limit = 100): PerformanceMetrics[] {
  return performanceMetrics.slice(0, limit);
}

/**
 * メトリクス統計計算
 */
export function getPerformanceStats(timeframe = 3600000): { // デフォルト1時間
  avgResponseTime: number;
  p95ResponseTime: number;
  requestCount: number;
  errorRate: number;
  slowRequests: number;
} {
  const now = Date.now();
  const recentMetrics = performanceMetrics.filter(
    m => now - m.timestamp < timeframe
  );

  if (recentMetrics.length === 0) {
    return {
      avgResponseTime: 0,
      p95ResponseTime: 0,
      requestCount: 0,
      errorRate: 0,
      slowRequests: 0
    };
  }

  const responseTimes = recentMetrics.map(m => m.responseTime).sort((a, b) => a - b);
  const errorCount = recentMetrics.filter(m => m.status >= 400).length;
  const slowCount = recentMetrics.filter(m => m.responseTime > 1000).length;

  return {
    avgResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
    p95ResponseTime: Math.round(responseTimes[Math.floor(responseTimes.length * 0.95)] || 0),
    requestCount: recentMetrics.length,
    errorRate: Math.round((errorCount / recentMetrics.length) * 100 * 100) / 100,
    slowRequests: slowCount
  };
}

/**
 * レスポンス圧縮ヘルパー
 */
export function compressResponse(data: any): NextResponse {
  const jsonString = JSON.stringify(data);
  
  // 大きなレスポンスの場合は圧縮を示唆
  if (jsonString.length > 1024) {
    return NextResponse.json(data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Uncompressed-Size': jsonString.length.toString(),
        'Cache-Control': 'public, max-age=300, s-maxage=600', // 5分キャッシュ
      }
    });
  }

  return NextResponse.json(data);
}

/**
 * 条件付きレスポンス（ETagサポート）
 */
export function conditionalResponse(
  data: any, 
  request: NextRequest,
  maxAge = 300
): NextResponse {
  const jsonString = JSON.stringify(data);
  const etag = `"${Buffer.from(jsonString).toString('base64').slice(0, 16)}"`;
  
  // If-None-Match ヘッダーチェック
  const clientETag = request.headers.get('if-none-match');
  if (clientETag === etag) {
    return new NextResponse(null, { 
      status: 304,
      headers: {
        'ETag': etag,
        'Cache-Control': `public, max-age=${maxAge}`
      }
    });
  }

  return NextResponse.json(data, {
    headers: {
      'ETag': etag,
      'Cache-Control': `public, max-age=${maxAge}`,
      'X-Content-Size': jsonString.length.toString()
    }
  });
}

/**
 * APIレート制限ヘルパー
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string,
  limit = 100,
  windowMs = 60000 // 1分
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / windowMs)}`;
  
  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
  
  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    };
  }

  current.count++;
  rateLimitStore.set(key, current);
  
  // 古いエントリのクリーンアップ
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetTime < now) {
      rateLimitStore.delete(k);
    }
  }

  return {
    allowed: true,
    remaining: limit - current.count,
    resetTime: current.resetTime
  };
}

export default withPerformanceMonitoring;