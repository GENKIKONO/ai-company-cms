/**
 * 統合モニタリング機能
 * Sentry、Slack、Plausible、Webhook監視の統合管理
 */

import { SentryUtils } from './sentry-utils';
import { slackNotifier } from './slack-notifier';
import { WebhookAlert, checkWebhookAlerts, getWebhookHealthMetrics } from './webhook-monitoring';

export interface MonitoringConfig {
  sentry: {
    enabled: boolean;
    dsn?: string;
    environment?: string;
  };
  slack: {
    enabled: boolean;
    webhookUrl?: string;
    channels: {
      alerts: string;
      security: string;
      business: string;
      performance: string;
    };
  };
  plausible: {
    enabled: boolean;
    domain?: string;
    customEvents: boolean;
  };
  webhook: {
    enabled: boolean;
    healthCheckInterval: number; // minutes
    alertThresholds: {
      failureRate: number; // percentage
      oldEventsHours: number;
      noEventsHours: number;
    };
  };
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    sentry: 'operational' | 'degraded' | 'down';
    slack: 'operational' | 'degraded' | 'down';
    plausible: 'operational' | 'degraded' | 'down';
    webhook: 'operational' | 'degraded' | 'down';
    database: 'operational' | 'degraded' | 'down';
    stripe: 'operational' | 'degraded' | 'down';
  };
  metrics: {
    webhookHealthScore: number; // 0-100
    errorRate: number; // errors per hour
    responseTimeP95: number; // milliseconds
    uptimePercentage: number; // 0-100
  };
  alerts: WebhookAlert[];
  lastChecked: string;
}

export class MonitoringIntegration {
  private config: MonitoringConfig;
  
  constructor(config?: Partial<MonitoringConfig>) {
    this.config = this.getDefaultConfig();
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  private getDefaultConfig(): MonitoringConfig {
    return {
      sentry: {
        enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
      },
      slack: {
        enabled: Boolean(process.env.SLACK_WEBHOOK_URL),
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channels: {
          alerts: '#alerts',
          security: '#security-alerts',
          business: '#business-events',
          performance: '#performance-alerts',
        },
      },
      plausible: {
        enabled: Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN),
        domain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
        customEvents: true,
      },
      webhook: {
        enabled: true,
        healthCheckInterval: 15, // 15分毎
        alertThresholds: {
          failureRate: 20, // 20%以上の失敗率でアラート
          oldEventsHours: 2, // 2時間以上古い未処理イベントでアラート
          noEventsHours: 48, // 48時間以上イベントがないとアラート
        },
      },
    };
  }

  /**
   * 統合ヘルスチェック
   */
  async getSystemHealth(): Promise<SystemHealthStatus> {
    const startTime = Date.now();
    
    try {
      // 各サービスの状態をチェック
      const [sentryStatus, slackStatus, plausibleStatus, webhookStatus, dbStatus, stripeStatus] = await Promise.allSettled([
        this.checkSentryHealth(),
        this.checkSlackHealth(),
        this.checkPlausibleHealth(),
        this.checkWebhookHealth(),
        this.checkDatabaseHealth(),
        this.checkStripeHealth(),
      ]);

      const services = {
        sentry: this.getServiceStatus(sentryStatus),
        slack: this.getServiceStatus(slackStatus),
        plausible: this.getServiceStatus(plausibleStatus),
        webhook: this.getServiceStatus(webhookStatus),
        database: this.getServiceStatus(dbStatus),
        stripe: this.getServiceStatus(stripeStatus),
      };

      // Webhook健全性メトリクス
      const webhookMetrics = await getWebhookHealthMetrics(24);
      const webhookAlerts = await checkWebhookAlerts();

      const metrics = {
        webhookHealthScore: Math.max(0, Math.min(100, webhookMetrics.successRate)),
        errorRate: this.calculateErrorRate(),
        responseTimeP95: Date.now() - startTime, // 簡易的な計算
        uptimePercentage: this.calculateUptimePercentage(services),
      };

      // 全体的な健全性を判定
      const overall = this.determineOverallHealth(services, metrics, webhookAlerts);

      return {
        overall,
        services,
        metrics,
        alerts: webhookAlerts,
        lastChecked: new Date().toISOString(),
      };

    } catch (error) {
      console.error('System health check failed:', error);
      
      return {
        overall: 'unhealthy',
        services: {
          sentry: 'down',
          slack: 'down',
          plausible: 'down',
          webhook: 'down',
          database: 'down',
          stripe: 'down',
        },
        metrics: {
          webhookHealthScore: 0,
          errorRate: 100,
          responseTimeP95: 0,
          uptimePercentage: 0,
        },
        alerts: [],
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Sentryの健全性をチェック
   */
  private async checkSentryHealth(): Promise<boolean> {
    if (!this.config.sentry.enabled) return true;
    
    try {
      // Sentryが正しく初期化されているかチェック
      SentryUtils.addBreadcrumb('Health check', 'monitoring');
      return true;
    } catch (error) {
      console.error('Sentry health check failed:', error);
      return false;
    }
  }

  /**
   * Slackの健全性をチェック
   */
  private async checkSlackHealth(): Promise<boolean> {
    if (!this.config.slack.enabled) return true;
    
    try {
      // テスト送信は行わず、設定の存在のみチェック
      return Boolean(this.config.slack.webhookUrl);
    } catch (error) {
      console.error('Slack health check failed:', error);
      return false;
    }
  }

  /**
   * Plausibleの健全性をチェック
   */
  private async checkPlausibleHealth(): Promise<boolean> {
    if (!this.config.plausible.enabled) return true;
    
    try {
      // クライアントサイドでのみチェック可能
      if (typeof window !== 'undefined') {
        return Boolean(window.plausible);
      }
      // サーバーサイドでは設定の存在のみチェック
      return Boolean(this.config.plausible.domain);
    } catch (error) {
      console.error('Plausible health check failed:', error);
      return false;
    }
  }

  /**
   * Webhookシステムの健全性をチェック
   */
  private async checkWebhookHealth(): Promise<boolean> {
    if (!this.config.webhook.enabled) return true;
    
    try {
      const metrics = await getWebhookHealthMetrics(1); // 過去1時間
      return metrics.successRate >= this.config.webhook.alertThresholds.failureRate;
    } catch (error) {
      console.error('Webhook health check failed:', error);
      return false;
    }
  }

  /**
   * データベースの健全性をチェック
   */
  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      // クライアントサイドでは簡易チェック
      if (typeof window !== 'undefined') {
        return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
      }
      
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { error } = await supabase.from('organizations').select('id').limit(1);
      return !error;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Stripeの健全性をチェック
   */
  private async checkStripeHealth(): Promise<boolean> {
    try {
      if (!process.env.STRIPE_SECRET_KEY) return true; // 設定されていない場合はスキップ
      
      // クライアントサイドでは設定の存在のみチェック
      if (typeof window !== 'undefined') {
        return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      }
      
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
      
      return true;
    } catch (error) {
      console.error('Stripe health check failed:', error);
      return false;
    }
  }

  private getServiceStatus(promiseResult: PromiseSettledResult<boolean>): 'operational' | 'degraded' | 'down' {
    if (promiseResult.status === 'fulfilled') {
      return promiseResult.value ? 'operational' : 'degraded';
    }
    return 'down';
  }

  private calculateErrorRate(): number {
    // 簡易的な計算。実際の実装では、過去1時間のエラー数を取得
    return Math.floor(Math.random() * 10); // 0-10 errors per hour
  }

  private calculateUptimePercentage(services: SystemHealthStatus['services']): number {
    const serviceStatuses = Object.values(services);
    const operationalCount = serviceStatuses.filter(status => status === 'operational').length;
    return Math.round((operationalCount / serviceStatuses.length) * 100);
  }

  private determineOverallHealth(
    services: SystemHealthStatus['services'], 
    metrics: SystemHealthStatus['metrics'],
    alerts: WebhookAlert[]
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // データベースがダウンしている場合は即座にunhealthy
    if (services.database === 'down') return 'unhealthy';
    
    // クリティカルアラートがある場合はunhealthy
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
    if (criticalAlerts.length > 0) return 'unhealthy';
    
    // Webhook健全性スコアが低い場合はdegraded以下
    if (metrics.webhookHealthScore < 50) return 'unhealthy';
    if (metrics.webhookHealthScore < 80) return 'degraded';
    
    // アップタイムが低い場合
    if (metrics.uptimePercentage < 70) return 'unhealthy';
    if (metrics.uptimePercentage < 90) return 'degraded';
    
    // 警告アラートがある場合はdegraded
    if (alerts.length > 0) return 'degraded';
    
    return 'healthy';
  }

  /**
   * アラートの自動処理
   */
  async processAlerts(): Promise<void> {
    try {
      const webhookAlerts = await checkWebhookAlerts();
      
      for (const alert of webhookAlerts) {
        await slackNotifier.notifyWebhookAlert(alert);
        
        // Sentryにも記録
        SentryUtils.captureMessage(
          `Webhook Alert: ${alert.type}`,
          alert.severity === 'critical' ? 'error' : 'warning',
          {
            webhook: {
              type: alert.type,
              severity: alert.severity,
              metadata: alert.metadata,
            },
          }
        );
      }
    } catch (error) {
      console.error('Failed to process alerts:', error);
      SentryUtils.captureException(error instanceof Error ? error : new Error('Failed to process alerts'));
    }
  }

  /**
   * システム起動通知
   */
  async notifySystemStartup(): Promise<void> {
    await slackNotifier.notifySystemStatus({
      type: 'startup',
      status: 'success',
      message: 'AIO Hub system started successfully',
      version: process.env.NEXT_PUBLIC_APP_VERSION,
      environment: process.env.NEXT_PUBLIC_APP_ENV,
    });
  }

  /**
   * 設定の検証
   */
  static validateConfiguration(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Sentryの検証
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      issues.push('NEXT_PUBLIC_SENTRY_DSN environment variable is not set');
    }

    // Slackの検証
    if (!process.env.SLACK_WEBHOOK_URL) {
      issues.push('SLACK_WEBHOOK_URL environment variable is not set');
    }

    // Plausibleの検証
    if (!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) {
      issues.push('NEXT_PUBLIC_PLAUSIBLE_DOMAIN environment variable is not set');
    }

    // 基本設定の検証
    if (!process.env.NEXT_PUBLIC_APP_ENV) {
      issues.push('NEXT_PUBLIC_APP_ENV environment variable is not set');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// デフォルトインスタンス
export const monitoringIntegration = new MonitoringIntegration();