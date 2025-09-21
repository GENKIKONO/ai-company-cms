// 監視・ログ・通知システム

// エラー通知機能
export async function notifyError(error: Error, context?: Record<string, any>) {
  try {
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

    // Sentry（クライアントサイドでは自動送信）
    if (typeof window === 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // サーバーサイドでのSentry送信は別途設定が必要
      console.error('Server Error:', error, context);
    }
  } catch (notifyError) {
    console.error('Failed to send error notification:', notifyError);
  }
}

// パフォーマンス監視
export function trackPerformance(metricName: string, value: number, context?: Record<string, any>) {
  try {
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
    // 重要なビジネスイベントをSlackに通知
    const importantEvents = [
      'organization_published',
      'subscription_created',
      'subscription_cancelled',
      'approval_requested',
      'approval_granted'
    ];

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
  }
}

// API エラーハンドリング（Next.js API routes用）
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof Error) {
        await notifyError(error, { 
          handler: handler.name,
          args: args.map(arg => typeof arg === 'object' ? 'object' : typeof arg)
        });
      }
      throw error;
    }
  };
}

// ヘルスチェック
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp: string;
}> {
  const checks: Record<string, boolean> = {};
  
  try {
    // Supabase接続チェック
    try {
      const { supabaseBrowserServer } = await import('@/lib/supabase-server');
      const supabaseBrowser = supabaseBrowserServer();
      const { error } = await supabaseBrowser.from('organizations').select('id').limit(1);
      checks.supabase = !error;
    } catch {
      checks.supabase = false;
    }

    // Stripe接続チェック
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const stripe = (await import('stripe')).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);
        await stripeClient.products.list({ limit: 1 });
        checks.stripe = true;
      } else {
        checks.stripe = false;
      }
    } catch {
      checks.stripe = false;
    }

    // Resend接続チェック
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.domains.list();
        checks.resend = true;
      } else {
        checks.resend = false;
      }
    } catch {
      checks.resend = false;
    }

    const allHealthy = Object.values(checks).every(Boolean);
    
    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    await notifyError(error instanceof Error ? error : new Error('Health check failed'));
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