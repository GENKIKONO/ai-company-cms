// 監視・ログ・通知システム
import { SentryUtils } from '@/lib/utils/sentry-utils';

// エラー通知機能
export async function notifyError(error: Error, context?: Record<string, any>) {
  try {
    // Sentry統合
    SentryUtils.captureException(error, {
      ...context,
      notificationAttempted: true,
    });

    // Slack通知
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Error in ${process.env.NEXT_PUBLIC_APP_ENV || 'unknown'}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Error:* ${error.message}\n*Stack:* \`\`\`${error.stack?.slice(0, 500) || 'No stack trace'}\`\`\``
              }
            },
            context && {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Context:* \`\`\`${JSON.stringify(context, null, 2).slice(0, 500)}\`\`\``
              }
            }
          ].filter(Boolean)
        })
      });
    }
  } catch (notifyError) {
    console.error('Failed to send error notification:', notifyError);
    SentryUtils.captureException(
      notifyError instanceof Error ? notifyError : new Error('Failed to send error notification'), 
      { originalError: error.message }
    );
  }
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

    // LCP監視
    if (metricName === 'LCP' && value > 2500) {
      notifyError(new Error(`Poor LCP performance: ${value}ms`), { 
        metric: metricName, 
        value,
        ...context 
      });
    }

    // コンソールログ
    console.log(`Performance [${metricName}]:`, value, context);

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
    console.error('Failed to track performance:', error);
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

    if (importantEvents.includes(event) && process.env.SLACK_WEBHOOK_URL) {
      const eventEmojis: Record<string, string> = {
        organization_published: '🎉',
        subscription_created: '💳',
        subscription_cancelled: '❌',
        approval_requested: '⏳',
        approval_granted: '✅'
      };

      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${eventEmojis[event] || '📊'} Business Event: ${event}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Event:* ${event}\n*User:* ${userId || 'Unknown'}\n*Org:* ${orgId || 'Unknown'}`
              }
            },
            data && {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Data:* \`\`\`${JSON.stringify(data, null, 2).slice(0, 300)}\`\`\``
              }
            }
          ].filter(Boolean)
        })
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
    console.log(`Business Event [${event}]:`, { userId, orgId, data });
  } catch (error) {
    console.error('Failed to track business event:', error);
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
      const { supabaseServer } = await import('@/lib/supabase-server');
      const supabaseBrowser = await supabaseServer();
      const { error } = await supabaseBrowser.from('organizations').select('id').limit(1);
      checks.supabase = !error;
    } catch {
      checks.supabase = false;
    }

    // Stripe接続チェック（オプショナルサービス、タイムアウト付き）
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const stripe = (await import('stripe')).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);
        
        // タイムアウト付きでAPI呼び出し
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Stripe timeout')), 5000)
        );
        
        await Promise.race([
          stripeClient.products.list({ limit: 1 }),
          timeoutPromise
        ]);
        checks.stripe = true;
      } else {
        // 設定されていない場合はスキップ（健康とみなす）
        checks.stripe = true;
      }
    } catch {
      // Stripe失敗は degraded であり unhealthy ではない
      checks.stripe = false;
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

// 型定義（グローバル）
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}