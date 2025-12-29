// 監視・ログ・通知システム
import { SentryUtils } from '@/lib/utils/sentry-utils';
import { slackNotifier } from '@/lib/utils/slack-notifier';
import { logger as mainLogger } from '@/lib/utils/logger';

// エラー通知機能
export async function notifyError(error: Error, context?: Record<string, any>) {
  try {
    // Sentry統合
    SentryUtils.captureException(error, {
      ...context,
      notificationAttempted: true,
    });

    // 強化されたSlack通知
    await slackNotifier.notifyError({
      title: 'System Error',
      message: error.message,
      severity: determineSeverity(error, context),
      environment: process.env.NEXT_PUBLIC_APP_ENV,
      userId: context?.userId,
      organizationId: context?.organizationId,
      url: context?.url,
      stackTrace: error.stack,
      timestamp: new Date().toISOString(),
    });
  } catch (notifyError) {
    mainLogger.error('Failed to send error notification', notifyError instanceof Error ? notifyError : new Error(String(notifyError)));
    SentryUtils.captureException(
      notifyError instanceof Error ? notifyError : new Error('Failed to send error notification'), 
      { originalError: error.message }
    );
  }
}

// エラーの重要度を判定
function determineSeverity(error: Error, context?: Record<string, any>): 'low' | 'medium' | 'high' | 'critical' {
  const errorMessage = error.message.toLowerCase();
  
  // クリティカル
  if (errorMessage.includes('database') && errorMessage.includes('connection')) return 'critical';
  if (errorMessage.includes('payment') && errorMessage.includes('failed')) return 'critical';
  if (errorMessage.includes('auth') && errorMessage.includes('token')) return 'critical';
  
  // 高
  if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) return 'high';
  if (errorMessage.includes('timeout')) return 'high';
  if (context?.api && context?.statusCode >= 500) return 'high';
  
  // 中
  if (errorMessage.includes('validation')) return 'medium';
  if (context?.api && context?.statusCode >= 400) return 'medium';
  
  // デフォルト
  return 'low';
}

// ビジネスイベントタイプのマッピング
function mapEventToBusinessType(event: string): 'new_signup' | 'plan_upgrade' | 'plan_downgrade' | 'cancellation' | 'payment_success' | 'payment_failed' {
  const eventMap: Record<string, any> = {
    organization_published: 'new_signup',
    subscription_created: 'plan_upgrade',
    subscription_cancelled: 'cancellation',
    approval_requested: 'new_signup',
    approval_granted: 'new_signup',
    payment_succeeded: 'payment_success',
    payment_failed: 'payment_failed',
  };
  
  return eventMap[event] || 'new_signup';
}

// パフォーマンス監視
export function trackPerformance(metricName: string, value: number, context?: Record<string, any>) {
  try {
    // Sentry パフォーマンス追跡
    SentryUtils.trackPerformance({
      name: metricName,
      value,
      unit: metricName.includes('time') || metricName.includes('LCP') ? 'milliseconds' : 'count',
      tags: context as Record<string, string>,
    });

    // LCP監視とパフォーマンスアラート
    if (metricName === 'LCP' && value > 2500) {
      slackNotifier.notifyPerformanceAlert({
        metric: 'Largest Contentful Paint (LCP)',
        value,
        threshold: 2500,
        unit: 'ms',
        severity: value > 4000 ? 'critical' : 'warning',
        context,
      });
    }

    // CLS監視
    if (metricName === 'CLS' && value > 0.1) {
      slackNotifier.notifyPerformanceAlert({
        metric: 'Cumulative Layout Shift (CLS)',
        value,
        threshold: 0.1,
        unit: '',
        severity: value > 0.25 ? 'critical' : 'warning',
        context,
      });
    }

    // FID監視
    if (metricName === 'FID' && value > 100) {
      slackNotifier.notifyPerformanceAlert({
        metric: 'First Input Delay (FID)',
        value,
        threshold: 100,
        unit: 'ms',
        severity: value > 300 ? 'critical' : 'warning',
        context,
      });
    }

    // Performance logging
    mainLogger.debug(`Performance [${metricName}]`, { value, ...context });

    // Plausible custom events (クライアントサイドのみ)
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible(metricName, { 
        props: { 
          value: value.toString(),
          ...context 
        } 
      });
    }
  } catch (error) {
    mainLogger.error('Failed to track performance', error instanceof Error ? error : new Error('Failed to track performance'));
    SentryUtils.captureException(error instanceof Error ? error : new Error('Failed to track performance'));
  }
}

// 業務イベント監視
export async function trackBusinessEvent(
  event: string, 
  userId?: string, 
  orgId?: string, 
  data?: Record<string, any>
) {
  try {
    // Sentry ビジネスイベント追跡
    SentryUtils.addBreadcrumb(
      `Business event: ${event}`,
      'business',
      { userId, orgId, ...data }
    );
    
    // 重要なイベントはSentryメッセージとして記録
    const importantEvents = [
      'organization_published',
      'subscription_created',
      'subscription_cancelled',
      'approval_requested',
      'approval_granted'
    ];
    
    if (importantEvents.includes(event)) {
      SentryUtils.captureMessage(
        `Business event: ${event}`,
        'info',
        { userId, organizationId: orgId, eventData: data }
      );
    }
    // 重要なビジネスイベントをSlackに通知
    if (importantEvents.includes(event)) {
      await slackNotifier.notifyBusinessEvent({
        type: mapEventToBusinessType(event),
        title: `Business Event: ${event}`,
        description: `Event: ${event} triggered${userId ? ` by user ${userId}` : ''}${orgId ? ` for organization ${orgId}` : ''}`,
        userId,
        organizationId: orgId,
        ...data
      });
    }

    // Plausible custom events
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible(event, { 
        props: { 
          userId: userId || 'anonymous',
          orgId: orgId || 'none',
          ...data 
        } 
      });
    }

    // ログ記録
    mainLogger.info(`Business Event [${event}]`, { userId, orgId, data });
  } catch (error) {
    mainLogger.error('Failed to track business event', error instanceof Error ? error : new Error('Failed to track business event'));
    SentryUtils.captureException(error instanceof Error ? error : new Error('Failed to track business event'));
  }
}

// API エラーハンドリング（Next.js API routes用）
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return SentryUtils.wrapAPIHandler(handler as any, {
    operationName: handler.name || 'anonymous-handler',
    extractContext: (...args) => ({
      handler: handler.name,
      argsTypes: args.map(arg => typeof arg === 'object' ? 'object' : typeof arg),
    }),
  }) as (...args: T) => Promise<R>;
}

// Stripeエラーを安全に分類（秘密情報を出さない）
function categorizeStripeError(err: unknown): 'timeout' | 'invalid_key' | 'permission' | 'network' | 'unknown' {
  if (!(err instanceof Error)) return 'unknown';
  const msg = err.message.toLowerCase();

  if (msg.includes('stripe_timeout') || msg.includes('timeout')) return 'timeout';
  if (msg.includes('invalid api key') || msg.includes('api_key_invalid')) return 'invalid_key';
  if (msg.includes('permission') || msg.includes('forbidden') || msg.includes('unauthorized')) return 'permission';
  if (msg.includes('network') || msg.includes('econnrefused') || msg.includes('enotfound') || msg.includes('fetch failed')) return 'network';

  return 'unknown';
}

// ヘルスチェック
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp: string;
}> {
  const checks: Record<string, boolean> = {};
  
  try {
    // Supabase接続チェック（コアサービス）
    try {
      // クライアントサイドのSupabaseクライアントを使用
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error } = await supabase.from('organizations').select('id').limit(1);
      checks.supabase = !error;
    } catch {
      checks.supabase = false;
    }

    // Stripe接続チェック（オプショナルサービス、タイムアウト付き）
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const stripe = (await import('stripe')).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);

        // タイムアウト付きでAPI呼び出し（Edge環境考慮で10秒に延長）
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('STRIPE_TIMEOUT')), 10000)
        );

        await Promise.race([
          stripeClient.products.list({ limit: 1 }),
          timeoutPromise
        ]);
        checks.stripe = true;
        console.log('[healthCheck] Stripe OK');
      } else {
        // 設定されていない場合はスキップ（健康とみなす）
        checks.stripe = true;
        console.log('[healthCheck] Stripe skipped (no key configured)');
      }
    } catch (err) {
      // Stripe失敗は degraded であり unhealthy ではない
      checks.stripe = false;
      // エラーを分類してログ出力（秘密情報は出さない）
      const category = categorizeStripeError(err);
      console.error(`[healthCheck] Stripe FAILED category=${category}`);
    }

    // Resend接続チェック（オプショナルサービス、タイムアウト付き）
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        // タイムアウト付きでAPI呼び出し
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Resend timeout')), 5000)
        );
        
        await Promise.race([
          resend.domains.list(),
          timeoutPromise
        ]);
        checks.resend = true;
      } else {
        // 設定されていない場合はスキップ（健康とみなす）
        checks.resend = true;
      }
    } catch {
      // Resend失敗は degraded であり unhealthy ではない
      checks.resend = false;
    }

    // ステータス判定ロジック：コアサービス（Supabase）が生きていれば最低でも degraded
    const coreServices = { supabase: checks.supabase };
    const optionalServices = { stripe: checks.stripe, resend: checks.resend };
    
    const coreHealthy = Object.values(coreServices).every(Boolean);
    const allHealthy = Object.values(checks).every(Boolean);
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (!coreHealthy) {
      status = 'unhealthy';
    } else if (allHealthy) {
      status = 'healthy';
    } else {
      status = 'degraded';
    }
    
    return {
      status,
      checks,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const healthError = error instanceof Error ? error : new Error('Health check failed');
    await notifyError(healthError);
    SentryUtils.captureException(healthError, { healthChecks: checks });
    return {
      status: 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    };
  }
}

// エラーカテゴリ定義
export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  SYSTEM = 'SYSTEM',
  UI = 'UI',
  UNKNOWN = 'UNKNOWN'
}

// パフォーマンス監視
export const performanceMonitor = {
  getRecentMetrics: (hours: number) => {
    const mockMetrics = [
      {
        timestamp: new Date(),
        errors: { count: Math.floor(Math.random() * 10) },
        system: { memoryUsage: Math.random() * 100 + 20 },
        responseTime: Math.random() * 1000 + 100,
      }
    ];
    return mockMetrics;
  },
  
  track: (metric: string, value: number) => {
    mainLogger.debug('Performance metric', { metric, value });
  },
  
  recordWebVitals: (metric: { name: string; value: number; rating: string }) => {
    mainLogger.debug('Web Vitals', metric);
    // 実際の実装では、これらのメトリクスをデータベースやモニタリングサービスに送信
  }
};

// エラー監視
export const errorMonitor = {
  getErrorStats: () => {
    return {
      'AUTHENTICATION': Math.floor(Math.random() * 5),
      'DATABASE': Math.floor(Math.random() * 3),
      'NETWORK': Math.floor(Math.random() * 2),
      'VALIDATION': Math.floor(Math.random() * 4),
    };
  },
  
  captureError: (error: Error, context?: Record<string, any>) => {
    mainLogger.error('Error captured', error, context);
    SentryUtils.captureException(error, context);
  },
  
  resetStats: () => {
    mainLogger.debug('Error stats reset');
  }
};

// Use the main logger from utils/logger.ts
export const logger = mainLogger;

// 型定義（グローバル）
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}