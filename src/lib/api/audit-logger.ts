/**
 * API使用状況ログ整備
 * 要件定義準拠: API使用パターン分析用統一ログ収集
 */

import { NextRequest, NextResponse } from 'next/server';
import type { AuthContext } from './auth-middleware';

// ログレベル定義
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// API使用ログの基本構造
export interface ApiUsageLog {
  timestamp: string;
  requestId: string;
  method: string;
  endpoint: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  userRole?: string;
  organizationId?: string;
  responseStatus: number;
  responseTime: number;
  requestSize?: number;
  responseSize?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// ビジネスメトリクス用のログ
export interface BusinessMetricsLog {
  timestamp: string;
  eventType: 'organization_created' | 'organization_published' | 'service_created' | 'faq_created' | 'post_created' | 'billing_subscription' | 'auth_login' | 'auth_signup';
  userId?: string;
  userRole?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}

// パフォーマンスメトリクス
export interface PerformanceMetrics {
  timestamp: string;
  endpoint: string;
  method: string;
  responseTime: number;
  dbQueryTime?: number;
  externalApiTime?: number;
  cacheHit?: boolean;
  memoryUsage?: number;
  metadata?: Record<string, any>;
}

/**
 * リクエストIDの生成
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * クライアントIPアドレスの取得
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * APIリクエストサイズの推定
 */
export function estimateRequestSize(request: NextRequest): number {
  try {
    const url = request.url;
    const headersArray: [string, string][] = [];
    request.headers.forEach((value, key) => {
      headersArray.push([key, value]);
    });
    const headers = JSON.stringify(headersArray);
    return url.length + headers.length;
  } catch {
    return 0;
  }
}

/**
 * APIレスポンスサイズの推定
 */
export function estimateResponseSize(response: NextResponse): number {
  try {
    const headersArray: [string, string][] = [];
    response.headers.forEach((value, key) => {
      headersArray.push([key, value]);
    });
    const headers = JSON.stringify(headersArray);
    return headers.length;
  } catch {
    return 0;
  }
}

/**
 * 構造化ログ出力
 */
export function logStructured(level: LogLevel, message: string, data?: Record<string, any>) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'aiohub-cms',
    environment: process.env.NODE_ENV || 'development',
    ...data
  };
  
  // 本番環境では外部ログサービス（例：Datadog, CloudWatch）に送信
  // 開発環境ではコンソール出力
  if (process.env.NODE_ENV === 'production') {
    // TODO: 外部ログサービス連携
    console.log(JSON.stringify(logEntry));
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`, data || '');
  }
}

/**
 * API使用ログの記録
 */
export function logApiUsage(log: ApiUsageLog) {
  logStructured(LogLevel.INFO, 'API_USAGE', {
    type: 'api_usage',
    ...log
  });
}

/**
 * ビジネスメトリクスの記録
 */
export function logBusinessMetrics(log: BusinessMetricsLog) {
  logStructured(LogLevel.INFO, 'BUSINESS_METRICS', {
    type: 'business_metrics',
    ...log
  });
}

/**
 * パフォーマンスメトリクスの記録
 */
export function logPerformanceMetrics(metrics: PerformanceMetrics) {
  logStructured(LogLevel.INFO, 'PERFORMANCE_METRICS', {
    type: 'performance_metrics',
    ...metrics
  });
}

/**
 * エラーログの記録
 */
export function logError(error: Error, context?: Record<string, any>) {
  logStructured(LogLevel.ERROR, 'ERROR', {
    type: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...context
  });
}

/**
 * セキュリティイベントの記録
 */
export function logSecurityEvent(event: string, details: Record<string, any>) {
  logStructured(LogLevel.WARN, 'SECURITY_EVENT', {
    type: 'security',
    event,
    ...details
  });
}

/**
 * API使用状況収集ミドルウェア
 */
export function createApiUsageMiddleware() {
  return async function apiUsageMiddleware(
    request: NextRequest,
    authContext?: AuthContext | null,
    startTime: number = Date.now()
  ) {
    const requestId = generateRequestId();
    const endpoint = new URL(request.url).pathname;
    const method = request.method;
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip = getClientIp(request);
    const requestSize = estimateRequestSize(request);
    
    // リクエスト開始ログ
    logStructured(LogLevel.DEBUG, 'API_REQUEST_START', {
      requestId,
      method,
      endpoint,
      ip,
      userAgent,
      userId: authContext?.user?.id,
      userRole: authContext?.userAccess?.role
    });
    
    return {
      requestId,
      logResponse: (response: NextResponse, error?: Error) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const responseSize = estimateResponseSize(response);
        
        const usageLog: ApiUsageLog = {
          timestamp: new Date().toISOString(),
          requestId,
          method,
          endpoint,
          userAgent,
          ip,
          userId: authContext?.user?.id,
          userRole: authContext?.userAccess?.role,
          organizationId: authContext?.userAccess?.currentOrgId,
          responseStatus: response.status,
          responseTime,
          requestSize,
          responseSize,
          errorMessage: error?.message
        };
        
        logApiUsage(usageLog);
        
        // パフォーマンスメトリクス
        const performanceMetrics: PerformanceMetrics = {
          timestamp: new Date().toISOString(),
          endpoint,
          method,
          responseTime
        };
        
        logPerformanceMetrics(performanceMetrics);
        
        // レスポンスタイムアラート
        if (responseTime > 2000) {
          logStructured(LogLevel.WARN, 'SLOW_API_RESPONSE', {
            endpoint,
            method,
            responseTime,
            threshold: 2000
          });
        }
        
        // エラーレスポンスの記録
        if (error || response.status >= 400) {
          logStructured(LogLevel.ERROR, 'API_ERROR_RESPONSE', {
            requestId,
            endpoint,
            method,
            status: response.status,
            error: error?.message,
            userId: authContext?.user?.id
          });
        }
      }
    };
  };
}

/**
 * ビジネスイベント記録ヘルパー
 */
export class BusinessEventLogger {
  static organizationCreated(userId: string, organizationId: string, metadata?: Record<string, any>) {
    logBusinessMetrics({
      timestamp: new Date().toISOString(),
      eventType: 'organization_created',
      userId,
      organizationId,
      metadata
    });
  }
  
  static organizationPublished(userId: string, organizationId: string, metadata?: Record<string, any>) {
    logBusinessMetrics({
      timestamp: new Date().toISOString(),
      eventType: 'organization_published',
      userId,
      organizationId,
      metadata
    });
  }
  
  static serviceCreated(userId: string, organizationId: string, serviceId: string, metadata?: Record<string, any>) {
    logBusinessMetrics({
      timestamp: new Date().toISOString(),
      eventType: 'service_created',
      userId,
      organizationId,
      metadata: { serviceId, ...metadata }
    });
  }
  
  static billingSubscription(userId: string, organizationId: string, subscriptionId: string, metadata?: Record<string, any>) {
    logBusinessMetrics({
      timestamp: new Date().toISOString(),
      eventType: 'billing_subscription',
      userId,
      organizationId,
      metadata: { subscriptionId, ...metadata }
    });
  }
  
  static userLogin(userId: string, userRole: string, metadata?: Record<string, any>) {
    logBusinessMetrics({
      timestamp: new Date().toISOString(),
      eventType: 'auth_login',
      userId,
      userRole,
      metadata
    });
  }
  
  static userSignup(userId: string, userRole: string, metadata?: Record<string, any>) {
    logBusinessMetrics({
      timestamp: new Date().toISOString(),
      eventType: 'auth_signup',
      userId,
      userRole,
      metadata
    });
  }
}

/**
 * ログ分析用のクエリヘルパー
 */
export class LogAnalytics {
  /**
   * API使用統計の取得（開発用模擬データ）
   */
  static async getApiUsageStats(startDate: Date, endDate: Date) {
    // 実際の実装では外部ログサービスのAPIを呼び出し
    return {
      totalRequests: 12450,
      uniqueUsers: 89,
      averageResponseTime: 234,
      errorRate: 0.8,
      topEndpoints: [
        { endpoint: '/api/my/organization', count: 3421, avgResponseTime: 189 },
        { endpoint: '/api/organizations', count: 2834, avgResponseTime: 267 },
        { endpoint: '/api/my/services', count: 1923, avgResponseTime: 145 },
        { endpoint: '/api/public/organizations', count: 1456, avgResponseTime: 98 },
        { endpoint: '/api/billing/checkout', count: 234, avgResponseTime: 456 }
      ],
      hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        requests: Math.floor(Math.random() * 500) + 100
      }))
    };
  }
  
  /**
   * ビジネスメトリクスの取得
   */
  static async getBusinessMetrics(startDate: Date, endDate: Date) {
    return {
      organizationsCreated: 23,
      organizationsPublished: 18,
      servicesCreated: 56,
      newSignups: 31,
      subscriptions: 12,
      dailyActiveUsers: 127,
      weeklyActiveUsers: 289
    };
  }
}

/**
 * ログ監視アラート設定
 */
export class LogMonitoring {
  /**
   * パフォーマンス監視
   */
  static checkPerformanceThresholds(metrics: PerformanceMetrics) {
    const thresholds = {
      responseTime: 1000, // 1秒
      dbQueryTime: 500,   // 500ms
      memoryUsage: 512    // 512MB
    };
    
    const alerts = [];
    
    if (metrics.responseTime > thresholds.responseTime) {
      alerts.push({
        type: 'performance',
        level: 'warning',
        message: `API response time exceeded threshold: ${metrics.responseTime}ms > ${thresholds.responseTime}ms`,
        endpoint: metrics.endpoint
      });
    }
    
    if (metrics.dbQueryTime && metrics.dbQueryTime > thresholds.dbQueryTime) {
      alerts.push({
        type: 'database',
        level: 'warning',
        message: `Database query time exceeded threshold: ${metrics.dbQueryTime}ms > ${thresholds.dbQueryTime}ms`,
        endpoint: metrics.endpoint
      });
    }
    
    // アラートがある場合は通知
    alerts.forEach(alert => {
      logStructured(LogLevel.WARN, 'PERFORMANCE_ALERT', alert);
    });
    
    return alerts;
  }
  
  /**
   * エラー率監視
   */
  static async checkErrorRates() {
    // 実装例: 過去5分間のエラー率をチェック
    const errorThreshold = 0.05; // 5%
    
    // 実際の実装では外部ログサービスから取得
    const mockErrorRate = 0.03;
    
    if (mockErrorRate > errorThreshold) {
      logStructured(LogLevel.CRITICAL, 'HIGH_ERROR_RATE', {
        currentRate: mockErrorRate,
        threshold: errorThreshold,
        alertTime: new Date().toISOString()
      });
    }
  }
}