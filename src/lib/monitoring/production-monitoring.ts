/**
 * Production Monitoring System
 * 本番環境の包括的監視とアラートシステム
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

interface MonitoringConfig {
  supabaseUrl: string;
  supabaseKey: string;
  slackWebhookUrl?: string;
  sentryDsn?: string;
  uptimeRobotKey?: string;
}

interface HealthMetrics {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  uptime: number;
  errors: ErrorMetric[];
  performance: PerformanceMetric;
  database: DatabaseMetric;
  external: ExternalServiceMetric[];
}

interface ErrorMetric {
  type: string;
  count: number;
  rate: number;
  lastOccurrence: string;
}

interface PerformanceMetric {
  avgResponseTime: number;
  p95ResponseTime: number;
  requestsPerMinute: number;
  cacheHitRate: number;
}

interface DatabaseMetric {
  connectionCount: number;
  queryTime: number;
  slowQueries: number;
  deadlocks: number;
}

interface ExternalServiceMetric {
  service: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastCheck: string;
}

export class ProductionMonitor {
  private config: MonitoringConfig;
  private supabase: any;
  private alertThresholds = {
    responseTime: 1000, // ms
    errorRate: 0.01, // 1%
    uptimeMin: 0.999, // 99.9%
    databaseConnections: 100,
    diskUsage: 0.85, // 85%
  };

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * システム全体の健全性チェック
   */
  async checkSystemHealth(): Promise<HealthMetrics> {
    const startTime = Date.now();
    
    try {
      const [
        apiHealth,
        databaseHealth,
        externalServicesHealth,
        performanceMetrics,
        errorMetrics
      ] = await Promise.all([
        this.checkApiHealth(),
        this.checkDatabaseHealth(),
        this.checkExternalServices(),
        this.getPerformanceMetrics(),
        this.getErrorMetrics()
      ]);

      const responseTime = Date.now() - startTime;
      const uptime = await this.calculateUptime();

      const metrics: HealthMetrics = {
        timestamp: new Date().toISOString(),
        status: this.determineOverallStatus([apiHealth, databaseHealth, ...externalServicesHealth]),
        responseTime,
        uptime,
        errors: errorMetrics,
        performance: performanceMetrics,
        database: databaseHealth,
        external: externalServicesHealth,
      };

      // アラート条件をチェック
      await this.checkAlertConditions(metrics);

      // メトリクスを保存
      await this.saveMetrics(metrics);

      return metrics;

    } catch (error) {
      logger.error('❌ Health check failed', { data: error instanceof Error ? error : new Error(String(error)) });
      throw error;
    }
  }

  /**
   * API健全性チェック
   */
  private async checkApiHealth(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/health`);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return { status: 'healthy', responseTime };
      } else {
        return { status: 'degraded', responseTime };
      }
    } catch (error) {
      return { status: 'down', responseTime: Date.now() - startTime };
    }
  }

  /**
   * データベース健全性チェック
   */
  private async checkDatabaseHealth(): Promise<DatabaseMetric> {
    try {
      const startTime = Date.now();
      
      // 基本的な接続テスト
      const { data, error } = await this.supabase
        .from('organizations')
        .select('count')
        .limit(1);

      const queryTime = Date.now() - startTime;

      if (error) {
        throw error;
      }

      // データベース統計を取得
      const stats = await this.getDatabaseStats();

      return {
        connectionCount: stats.connections || 0,
        queryTime,
        slowQueries: stats.slowQueries || 0,
        deadlocks: stats.deadlocks || 0,
      };

    } catch (error) {
      logger.error('Database health check failed', { data: error instanceof Error ? error : new Error(String(error)) });
      throw error;
    }
  }

  /**
   * 外部サービス健全性チェック
   */
  private async checkExternalServices(): Promise<ExternalServiceMetric[]> {
    const services = [
      { name: 'Stripe', url: 'https://status.stripe.com/api/v2/status.json' },
      { name: 'Vercel', url: 'https://www.vercel-status.com/api/v2/status.json' },
      { name: 'Supabase', url: 'https://status.supabase.com/api/v2/status.json' },
    ];

    const results = await Promise.allSettled(
      services.map(async (service) => {
        const startTime = Date.now();
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(service.url, { signal: controller.signal });
          clearTimeout(timeoutId);
          const responseTime = Date.now() - startTime;
          const data = await response.json();
          
          return {
            service: service.name,
            status: (data.status?.indicator === 'none' ? 'up' : 'degraded') as 'up' | 'degraded',
            responseTime,
            lastCheck: new Date().toISOString(),
          };
        } catch (error) {
          return {
            service: service.name,
            status: 'down' as const,
            responseTime: Date.now() - startTime,
            lastCheck: new Date().toISOString(),
          };
        }
      })
    );

    return results.map((result, index) => 
      result.status === 'fulfilled' 
        ? result.value 
        : {
            service: services[index].name,
            status: 'down' as const,
            responseTime: 0,
            lastCheck: new Date().toISOString(),
          }
    );
  }

  /**
   * パフォーマンスメトリクス取得
   */
  private async getPerformanceMetrics(): Promise<PerformanceMetric> {
    try {
      // 過去1時間のメトリクスを取得
      const { data: metrics } = await this.supabase
        .from('monitoring_metrics')
        .select('id, timestamp, status, response_time, uptime, performance_metrics, database_metrics, external_services, error_count, cache_hit, created_at')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (!metrics || metrics.length === 0) {
        return {
          avgResponseTime: 0,
          p95ResponseTime: 0,
          requestsPerMinute: 0,
          cacheHitRate: 0,
        };
      }

      const responseTimes = metrics.map(m => m.response_time).filter(Boolean);
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const p95ResponseTime = this.calculatePercentile(responseTimes, 95);
      const requestsPerMinute = metrics.length;
      const cacheHitRate = metrics.filter(m => m.cache_hit).length / metrics.length;

      return {
        avgResponseTime,
        p95ResponseTime,
        requestsPerMinute,
        cacheHitRate,
      };

    } catch (error) {
      logger.error('Failed to get performance metrics', { data: error instanceof Error ? error : new Error(String(error)) });
      return {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        requestsPerMinute: 0,
        cacheHitRate: 0,
      };
    }
  }

  /**
   * エラーメトリクス取得
   */
  private async getErrorMetrics(): Promise<ErrorMetric[]> {
    try {
      const { data: errors } = await this.supabase
        .from('error_logs')
        .select('id, error_type, error_message, stack_trace, user_id, request_path, created_at')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (!errors || errors.length === 0) {
        return [];
      }

      const errorTypes = [...new Set(errors.map(e => e.error_type))].filter(Boolean) as string[];
      
      return errorTypes.map(type => {
        const typeErrors = errors.filter(e => e.error_type === type);
        return {
          type: type as string,
          count: typeErrors.length,
          rate: typeErrors.length / 60, // per minute
          lastOccurrence: typeErrors[typeErrors.length - 1]?.created_at || '',
        };
      });

    } catch (error) {
      logger.error('Failed to get error metrics', { data: error instanceof Error ? error : new Error(String(error)) });
      return [];
    }
  }

  /**
   * アラート条件チェック
   */
  private async checkAlertConditions(metrics: HealthMetrics): Promise<void> {
    const alerts = [];

    // レスポンス時間アラート
    if (metrics.performance.avgResponseTime > this.alertThresholds.responseTime) {
      alerts.push({
        level: 'warning',
        message: `High response time: ${metrics.performance.avgResponseTime}ms`,
        metric: 'response_time',
        value: metrics.performance.avgResponseTime,
        threshold: this.alertThresholds.responseTime,
      });
    }

    // エラー率アラート
    const totalErrors = metrics.errors.reduce((sum, error) => sum + error.count, 0);
    const errorRate = totalErrors / (metrics.performance.requestsPerMinute || 1);
    if (errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        level: 'critical',
        message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
        metric: 'error_rate',
        value: errorRate,
        threshold: this.alertThresholds.errorRate,
      });
    }

    // アップタイムアラート
    if (metrics.uptime < this.alertThresholds.uptimeMin) {
      alerts.push({
        level: 'critical',
        message: `Low uptime: ${(metrics.uptime * 100).toFixed(3)}%`,
        metric: 'uptime',
        value: metrics.uptime,
        threshold: this.alertThresholds.uptimeMin,
      });
    }

    // アラートを送信
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  /**
   * アラート送信
   */
  private async sendAlert(alert: any): Promise<void> {
    try {
      // Slack通知
      if (this.config.slackWebhookUrl) {
        await this.sendSlackNotification(alert);
      }

      // Sentry通知
      if (this.config.sentryDsn) {
        await this.sendSentryAlert(alert);
      }

      // データベースに記録
      await this.supabase
        .from('alerts')
        .insert({
          level: alert.level,
          message: alert.message,
          metric: alert.metric,
          value: alert.value,
          threshold: alert.threshold,
          created_at: new Date().toISOString(),
        });

    } catch (error) {
      logger.error('Failed to send alert', { data: error instanceof Error ? error : new Error(String(error)) });
    }
  }

  /**
   * Slack通知送信
   */
  private async sendSlackNotification(alert: any): Promise<void> {
    if (!this.config.slackWebhookUrl) return;

    const emoji = alert.level === 'critical' ? '🚨' : '⚠️';
    const message = {
      text: `${emoji} ${alert.level.toUpperCase()}: ${alert.message}`,
      attachments: [
        {
          color: alert.level === 'critical' ? 'danger' : 'warning',
          fields: [
            {
              title: 'Metric',
              value: alert.metric,
              short: true,
            },
            {
              title: 'Value',
              value: alert.value,
              short: true,
            },
            {
              title: 'Threshold',
              value: alert.threshold,
              short: true,
            },
            {
              title: 'Time',
              value: new Date().toISOString(),
              short: true,
            },
          ],
        },
      ],
    };

    await fetch(this.config.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  }

  /**
   * メトリクス保存
   */
  private async saveMetrics(metrics: HealthMetrics): Promise<void> {
    try {
      await this.supabase
        .from('monitoring_metrics')
        .insert({
          timestamp: metrics.timestamp,
          status: metrics.status,
          response_time: metrics.responseTime,
          uptime: metrics.uptime,
          performance_metrics: metrics.performance,
          database_metrics: metrics.database,
          external_services: metrics.external,
          error_count: metrics.errors.reduce((sum, e) => sum + e.count, 0),
        });
    } catch (error) {
      logger.error('Failed to save metrics', { data: error instanceof Error ? error : new Error(String(error)) });
    }
  }

  /**
   * ユーティリティメソッド
   */
  private determineOverallStatus(statuses: any[]): 'healthy' | 'degraded' | 'down' {
    if (statuses.some(s => s.status === 'down')) return 'down';
    if (statuses.some(s => s.status === 'degraded')) return 'degraded';
    return 'healthy';
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private async calculateUptime(): Promise<number> {
    try {
      const { data } = await this.supabase
        .from('monitoring_metrics')
        .select('status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (!data || data.length === 0) return 1;

      const healthyCount = data.filter(m => m.status === 'healthy').length;
      return healthyCount / data.length;
    } catch {
      return 1;
    }
  }

  private async getDatabaseStats(): Promise<any> {
    try {
      // PostgreSQL統計クエリ（Supabase用）
      const { data } = await this.supabase
        .rpc('get_database_stats');
      
      return data || {};
    } catch {
      return {};
    }
  }

  private async sendSentryAlert(alert: any): Promise<void> {
    // Sentry SDK implementation
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(alert.message, alert.level);
    }
  }
}

// 監視インスタンス作成
export const productionMonitor = new ProductionMonitor({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  sentryDsn: process.env.SENTRY_DSN,
  uptimeRobotKey: process.env.UPTIME_ROBOT_API_KEY,
});

// 自動監視開始
if (process.env.NODE_ENV === 'production') {
  setInterval(async () => {
    try {
      await productionMonitor.checkSystemHealth();
    } catch (error) {
      logger.error('Monitoring check failed', { data: error instanceof Error ? error : new Error(String(error)) });
    }
  }, 60000); // 1分間隔
}