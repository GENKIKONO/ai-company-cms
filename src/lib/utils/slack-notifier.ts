import { logger } from '@/lib/utils/logger';

/**
 * Slack通知ユーティリティ
 * システムアラート、エラー、重要なイベントの通知
 */

export interface SlackAttachment {
  color: 'good' | 'warning' | 'danger' | string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  footer?: string;
  ts?: number;
}

export interface SlackMessage {
  text?: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
  attachments?: SlackAttachment[];
  blocks?: any[];
}

export class SlackNotifier {
  private webhookUrl: string | null;
  private defaultChannel: string;
  private enabled: boolean;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || null;
    this.defaultChannel = process.env.SLACK_DEFAULT_CHANNEL || '#alerts';
    this.enabled = Boolean(this.webhookUrl && process.env.NEXT_PUBLIC_APP_ENV === 'production');
  }

  /**
   * 基本的なメッセージ送信
   */
  async sendMessage(message: SlackMessage): Promise<boolean> {
    if (!this.enabled || !this.webhookUrl) {
      logger.debug('Debug', '[Slack] Notification disabled or webhook URL not configured');
      return false;
    }

    try {
      const payload = {
        channel: message.channel || this.defaultChannel,
        username: message.username || 'AIO Hub Alert',
        icon_emoji: message.icon_emoji || ':warning:',
        ...message
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
      }

      logger.debug('Debug', '[Slack] Notification sent successfully');
      return true;
    } catch (error) {
      logger.error('[Slack] Failed to send notification', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * システムエラー通知
   */
  async notifyError(error: {
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    environment?: string;
    userId?: string;
    organizationId?: string;
    url?: string;
    stackTrace?: string;
    timestamp?: string;
  }): Promise<boolean> {
    const color = this.getSeverityColor(error.severity);
    const emoji = this.getSeverityEmoji(error.severity);

    const attachment: SlackAttachment = {
      color,
      title: `🚨 ${error.title}`,
      text: error.message,
      fields: [
        {
          title: 'Severity',
          value: error.severity.toUpperCase(),
          short: true,
        },
        {
          title: 'Environment',
          value: error.environment || process.env.NEXT_PUBLIC_APP_ENV || 'unknown',
          short: true,
        },
      ],
      footer: 'AIO Hub Error Monitoring',
      ts: Math.floor(new Date(error.timestamp || Date.now()).getTime() / 1000),
    };

    if (error.userId) {
      attachment.fields!.push({
        title: 'User ID',
        value: error.userId,
        short: true,
      });
    }

    if (error.organizationId) {
      attachment.fields!.push({
        title: 'Organization ID',
        value: error.organizationId,
        short: true,
      });
    }

    if (error.url) {
      attachment.fields!.push({
        title: 'URL',
        value: error.url,
        short: false,
      });
    }

    if (error.stackTrace && error.severity === 'critical') {
      attachment.fields!.push({
        title: 'Stack Trace',
        value: `\`\`\`${error.stackTrace.substring(0, 1000)}\`\`\``,
        short: false,
      });
    }

    return this.sendMessage({
      text: `${emoji} System Error Alert`,
      icon_emoji: emoji,
      attachments: [attachment],
    });
  }

  /**
   * Webhook健全性アラート
   */
  async notifyWebhookAlert(alert: {
    type: string;
    severity: 'warning' | 'critical';
    message: string;
    metadata: Record<string, any>;
  }): Promise<boolean> {
    const color = alert.severity === 'critical' ? 'danger' : 'warning';
    const emoji = alert.severity === 'critical' ? ':rotating_light:' : ':warning:';

    const attachment: SlackAttachment = {
      color,
      title: `Webhook Health Alert: ${alert.type}`,
      text: alert.message,
      fields: Object.entries(alert.metadata).map(([key, value]) => ({
        title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: String(value),
        short: true,
      })),
      footer: 'AIO Hub Webhook Monitoring',
      ts: Math.floor(Date.now() / 1000),
    };

    return this.sendMessage({
      text: `${emoji} Webhook Alert`,
      icon_emoji: emoji,
      attachments: [attachment],
    });
  }

  /**
   * セキュリティアラート
   */
  async notifySecurityAlert(alert: {
    type: 'suspicious_login' | 'rate_limit_exceeded' | 'unauthorized_access' | 'data_breach';
    description: string;
    ipAddress?: string;
    userAgent?: string;
    userId?: string;
    organizationId?: string;
    timestamp?: string;
  }): Promise<boolean> {
    const attachment: SlackAttachment = {
      color: 'danger',
      title: `🔒 Security Alert: ${alert.type.replace(/_/g, ' ').toUpperCase()}`,
      text: alert.description,
      fields: [],
      footer: 'AIO Hub Security Monitoring',
      ts: Math.floor(new Date(alert.timestamp || Date.now()).getTime() / 1000),
    };

    if (alert.ipAddress) {
      attachment.fields!.push({
        title: 'IP Address',
        value: alert.ipAddress,
        short: true,
      });
    }

    if (alert.userAgent) {
      attachment.fields!.push({
        title: 'User Agent',
        value: alert.userAgent.substring(0, 100),
        short: false,
      });
    }

    if (alert.userId) {
      attachment.fields!.push({
        title: 'User ID',
        value: alert.userId,
        short: true,
      });
    }

    if (alert.organizationId) {
      attachment.fields!.push({
        title: 'Organization ID',
        value: alert.organizationId,
        short: true,
      });
    }

    return this.sendMessage({
      text: ':lock: Security Alert',
      icon_emoji: ':lock:',
      channel: '#security-alerts',
      attachments: [attachment],
    });
  }

  /**
   * ビジネスイベント通知
   */
  async notifyBusinessEvent(event: {
    type: 'new_signup' | 'plan_upgrade' | 'plan_downgrade' | 'cancellation' | 'payment_success' | 'payment_failed';
    title: string;
    description: string;
    userId?: string;
    organizationId?: string;
    amount?: number;
    currency?: string;
    planName?: string;
  }): Promise<boolean> {
    const color = this.getBusinessEventColor(event.type);
    const emoji = this.getBusinessEventEmoji(event.type);

    const attachment: SlackAttachment = {
      color,
      title: event.title,
      text: event.description,
      fields: [],
      footer: 'AIO Hub Business Events',
      ts: Math.floor(Date.now() / 1000),
    };

    if (event.userId) {
      attachment.fields!.push({
        title: 'User ID',
        value: event.userId,
        short: true,
      });
    }

    if (event.organizationId) {
      attachment.fields!.push({
        title: 'Organization ID',
        value: event.organizationId,
        short: true,
      });
    }

    if (event.amount && event.currency) {
      attachment.fields!.push({
        title: 'Amount',
        value: `${event.amount} ${event.currency.toUpperCase()}`,
        short: true,
      });
    }

    if (event.planName) {
      attachment.fields!.push({
        title: 'Plan',
        value: event.planName,
        short: true,
      });
    }

    return this.sendMessage({
      text: `${emoji} Business Event`,
      icon_emoji: emoji,
      channel: '#business-events',
      attachments: [attachment],
    });
  }

  /**
   * パフォーマンスアラート
   */
  async notifyPerformanceAlert(alert: {
    metric?: string;
    value?: number;
    threshold?: number;
    unit?: string;
    severity?: 'warning' | 'critical';
    context?: Record<string, any>;
    // 新しいWeb Vitalsアラート形式 (I2)
    page?: string;
    issues?: Array<{ type: string; severity: string; message: string; value?: number }>;
    score?: number;
    rating?: 'good' | 'needs-improvement' | 'poor';
    timestamp?: string;
  }): Promise<boolean> {
    // 従来のメトリクスアラート形式
    if (alert.metric && alert.value !== undefined) {
      return this.sendLegacyPerformanceAlert(alert as any);
    }

    // 新しいWeb Vitalsアラート形式 (I2)
    if (alert.page && alert.issues && alert.score !== undefined) {
      return this.sendWebVitalsAlert(alert as any);
    }

    return false;
  }

  /**
   * 従来のパフォーマンスアラート送信
   */
  private async sendLegacyPerformanceAlert(alert: {
    metric: string;
    value: number;
    threshold: number;
    unit: string;
    severity: 'warning' | 'critical';
    context?: Record<string, any>;
  }): Promise<boolean> {
    const color = alert.severity === 'critical' ? 'danger' : 'warning';
    const emoji = alert.severity === 'critical' ? ':fire:' : ':chart_with_upwards_trend:';

    const attachment: SlackAttachment = {
      color,
      title: `Performance Alert: ${alert.metric}`,
      text: `${alert.metric} is ${alert.value}${alert.unit}, exceeding threshold of ${alert.threshold}${alert.unit}`,
      fields: [
        {
          title: 'Current Value',
          value: `${alert.value}${alert.unit}`,
          short: true,
        },
        {
          title: 'Threshold',
          value: `${alert.threshold}${alert.unit}`,
          short: true,
        },
        {
          title: 'Severity',
          value: alert.severity.toUpperCase(),
          short: true,
        },
      ],
      footer: 'AIO Hub Performance Monitoring',
      ts: Math.floor(Date.now() / 1000),
    };

    if (alert.context) {
      Object.entries(alert.context).forEach(([key, value]) => {
        attachment.fields!.push({
          title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: String(value),
          short: true,
        });
      });
    }

    return this.sendMessage({
      text: `${emoji} Performance Alert`,
      icon_emoji: emoji,
      attachments: [attachment],
    });
  }

  /**
   * Web Vitalsアラート送信 (I2)
   */
  private async sendWebVitalsAlert(alert: {
    page: string;
    issues: Array<{ type: string; severity: string; message: string; value?: number }>;
    score: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    timestamp: string;
  }): Promise<boolean> {
    const color = this.getWebVitalsColor(alert.rating);
    const emoji = this.getWebVitalsEmoji(alert.rating);

    const criticalIssues = alert.issues.filter(issue => issue.severity === 'critical');
    const highIssues = alert.issues.filter(issue => issue.severity === 'high');

    const attachment: SlackAttachment = {
      color,
      title: `:warning: Critical Web Vitals Issues Detected`,
      text: `Page: ${alert.page}`,
      fields: [
        {
          title: 'Performance Score',
          value: `${alert.score.toFixed(1)}/100 (${alert.rating})`,
          short: true,
        },
        {
          title: 'Critical Issues',
          value: criticalIssues.length.toString(),
          short: true,
        },
        {
          title: 'High Issues',
          value: highIssues.length.toString(),
          short: true,
        },
      ],
      footer: 'AIO Hub Web Vitals Monitoring',
      ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
    };

    // 主要な問題を詳細に表示
    const topIssues = [...criticalIssues, ...highIssues].slice(0, 3);
    if (topIssues.length > 0) {
      attachment.fields!.push({
        title: 'Top Issues',
        value: topIssues.map(issue => 
          `• ${issue.message}${issue.value ? ` (${issue.value.toFixed(1)})` : ''}`
        ).join('\n'),
        short: false,
      });
    }

    return this.sendMessage({
      text: `${emoji} Web Vitals Alert`,
      icon_emoji: emoji,
      channel: '#performance-alerts',
      attachments: [attachment],
    });
  }

  private getWebVitalsColor(rating: string): string {
    switch (rating) {
      case 'good': return 'good';
      case 'needs-improvement': return 'warning';
      case 'poor': return 'danger';
      default: return 'warning';
    }
  }

  private getWebVitalsEmoji(rating: string): string {
    switch (rating) {
      case 'good': return ':white_check_mark:';
      case 'needs-improvement': return ':warning:';
      case 'poor': return ':fire:';
      default: return ':chart_with_upwards_trend:';
    }
  }

  /**
   * システム稼働状態通知
   */
  async notifySystemStatus(status: {
    type: 'startup' | 'shutdown' | 'health_check' | 'deployment';
    status: 'success' | 'warning' | 'error';
    message: string;
    version?: string;
    uptime?: number;
    environment?: string;
  }): Promise<boolean> {
    const color = this.getStatusColor(status.status);
    const emoji = this.getStatusEmoji(status.type, status.status);

    const attachment: SlackAttachment = {
      color,
      title: `System ${status.type.replace(/_/g, ' ').toUpperCase()}`,
      text: status.message,
      fields: [
        {
          title: 'Status',
          value: status.status.toUpperCase(),
          short: true,
        },
        {
          title: 'Environment',
          value: status.environment || process.env.NEXT_PUBLIC_APP_ENV || 'unknown',
          short: true,
        },
      ],
      footer: 'AIO Hub System Monitoring',
      ts: Math.floor(Date.now() / 1000),
    };

    if (status.version) {
      attachment.fields!.push({
        title: 'Version',
        value: status.version,
        short: true,
      });
    }

    if (status.uptime) {
      attachment.fields!.push({
        title: 'Uptime',
        value: `${Math.floor(status.uptime / 1000)}s`,
        short: true,
      });
    }

    return this.sendMessage({
      text: `${emoji} System Status`,
      icon_emoji: emoji,
      attachments: [attachment],
    });
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'warning';
      case 'low': return 'good';
      default: return 'warning';
    }
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return ':rotating_light:';
      case 'high': return ':warning:';
      case 'medium': return ':exclamation:';
      case 'low': return ':information_source:';
      default: return ':warning:';
    }
  }

  private getBusinessEventColor(type: string): string {
    switch (type) {
      case 'new_signup':
      case 'plan_upgrade':
      case 'payment_success':
        return 'good';
      case 'plan_downgrade':
      case 'payment_failed':
        return 'warning';
      case 'cancellation':
        return 'danger';
      default:
        return '#36a64f';
    }
  }

  private getBusinessEventEmoji(type: string): string {
    switch (type) {
      case 'new_signup': return ':tada:';
      case 'plan_upgrade': return ':arrow_up:';
      case 'plan_downgrade': return ':arrow_down:';
      case 'cancellation': return ':x:';
      case 'payment_success': return ':moneybag:';
      case 'payment_failed': return ':credit_card:';
      default: return ':information_source:';
    }
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'success': return 'good';
      case 'warning': return 'warning';
      case 'error': return 'danger';
      default: return 'warning';
    }
  }

  private getStatusEmoji(type: string, status: string): string {
    if (status === 'error') return ':x:';
    if (status === 'warning') return ':warning:';
    
    switch (type) {
      case 'startup': return ':rocket:';
      case 'shutdown': return ':stop_sign:';
      case 'health_check': return ':heartbeat:';
      case 'deployment': return ':ship:';
      default: return ':white_check_mark:';
    }
  }

  /**
   * 設定状態をチェック
   */
  static validateConfiguration(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!process.env.SLACK_WEBHOOK_URL) {
      issues.push('SLACK_WEBHOOK_URL environment variable is not set');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// シングルトンインスタンス
export const slackNotifier = new SlackNotifier();