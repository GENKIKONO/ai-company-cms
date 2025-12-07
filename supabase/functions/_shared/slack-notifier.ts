/**
 * Slack通知ユーティリティ (Edge Functions用)
 * EPIC 3-7: スキーマDiffアラート + 既存観測性機能統合
 * 
 * 機能:
 * - Webhook経由のSlack通知送信
 * - スキーマDiff、監査ログ、RLS拒否等の統合アラート
 * - リッチブロック形式での視覚的通知
 * - 環境別・重大度別の通知制御
 */

import { type EdgeLogger } from './logging.ts';
import { SupabaseClient } from 'npm:@supabase/supabase-js@2.39.7';

// ============================================
// 型定義
// ============================================

export type AlertSeverity = 'info' | 'warn' | 'error' | 'critical';
export type AlertSource = 'schema_diff' | 'audit_log' | 'rls_denied' | 'job_failure' | 'contract_violation' | 'system_health';

export interface BaseSlackAlert {
  source: AlertSource;
  severity: AlertSeverity;
  environment: string;
  title: string;
  summary: string;
  timestamp?: string;
  deep_link?: string;
  additional_context?: Record<string, unknown>;
}

export interface SchemaDiffAlert extends BaseSlackAlert {
  source: 'schema_diff';
  diff_summary: {
    total_changes: number;
    severity_counts: Record<AlertSeverity, number>;
    schemas_affected: string[];
    change_types: Record<string, number>;
  };
  latest_migration?: string;
  diff_id: string;
}

export interface JobFailureAlert extends BaseSlackAlert {
  source: 'job_failure';
  job_details: {
    job_name: string;
    job_id: string;
    failure_reason: string;
    retry_count: number;
    duration_ms?: number;
  };
}

export interface RlsDeniedAlert extends BaseSlackAlert {
  source: 'rls_denied';
  denial_summary: {
    table_name: string;
    operation: string;
    reason: string;
    user_affected: string | null;
    occurrence_count: number;
  };
}

export interface SystemHealthAlert extends BaseSlackAlert {
  source: 'system_health';
  health_metrics: {
    cpu_usage?: number;
    memory_usage?: number;
    db_connections?: number;
    response_time?: number;
    error_rate?: number;
  };
}

export type SlackAlert = SchemaDiffAlert | JobFailureAlert | RlsDeniedAlert | SystemHealthAlert;

// ============================================
// 再送制御・エラー記録関連型定義
// ============================================

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterMs: number;
  retryableStatusCodes: number[];
}

export interface NotificationError {
  alert_id: string;
  attempt_number: number;
  error_type: 'http_error' | 'rate_limit' | 'timeout' | 'network_error' | 'unknown';
  status_code?: number;
  error_message: string;
  retry_after?: number;
  occurred_at: string;
  will_retry: boolean;
}

export interface DeadLetterRecord {
  alert_id: string;
  alert_payload: SlackAlert;
  final_error: NotificationError;
  total_attempts: number;
  first_attempted_at: string;
  final_failed_at: string;
  escalation_required: boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterMs: 500,
  retryableStatusCodes: [429, 500, 502, 503, 504, 520, 521, 522, 523, 524]
};

// ============================================
// Slack通知クラス
// ============================================

export class SlackNotifier {
  private webhookUrl: string;
  private logger: EdgeLogger;
  private environment: string;
  private defaultChannel?: string;
  private retryConfig: RetryConfig;
  private supabase?: SupabaseClient;
  private errorTrackingEnabled: boolean;

  constructor(
    webhookUrl: string,
    logger: EdgeLogger,
    environment: string,
    defaultChannel?: string,
    retryConfig?: RetryConfig,
    supabase?: SupabaseClient
  ) {
    this.webhookUrl = webhookUrl;
    this.logger = logger;
    this.environment = environment;
    this.defaultChannel = defaultChannel;
    this.retryConfig = retryConfig || DEFAULT_RETRY_CONFIG;
    this.supabase = supabase;
    this.errorTrackingEnabled = !!supabase;
  }

  // ============================================
  // メイン通知送信メソッド
  // ============================================

  async sendAlert(alert: SlackAlert): Promise<boolean> {
    const alertId = this.generateAlertId(alert);
    const startTime = new Date();

    this.logger.info('Starting Slack alert delivery', {
      alert_id: alertId,
      source: alert.source,
      severity: alert.severity,
      environment: alert.environment,
      retry_config: this.retryConfig
    });

    let lastError: NotificationError | null = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries + 1; attempt++) {
      try {
        const result = await this.attemptSend(alert, alertId, attempt);
        
        if (result.success) {
          this.logger.info('Slack alert sent successfully', {
            alert_id: alertId,
            attempt_number: attempt,
            total_duration_ms: Date.now() - startTime.getTime(),
            source: alert.source,
            severity: alert.severity
          });
          return true;
        }

        // 送信失敗の処理
        lastError = result.error!;
        
        // エラー記録
        if (this.errorTrackingEnabled) {
          await this.recordNotificationError(lastError);
        }

        // 最大試行回数に達した場合
        if (attempt > this.retryConfig.maxRetries) {
          break;
        }

        // 再試行不可能なエラーの場合は即座に終了
        if (!this.isRetryableError(lastError)) {
          this.logger.warn('Non-retryable error encountered, aborting', {
            alert_id: alertId,
            error_type: lastError.error_type,
            status_code: lastError.status_code
          });
          break;
        }

        // 再試行前の待機
        const delay = this.calculateRetryDelay(attempt, lastError.retry_after);
        this.logger.info(`Retrying Slack notification in ${delay}ms`, {
          alert_id: alertId,
          attempt_number: attempt,
          next_attempt: attempt + 1,
          delay_ms: delay
        });

        await this.sleep(delay);

      } catch (error) {
        // 予期しないエラー
        lastError = {
          alert_id: alertId,
          attempt_number: attempt,
          error_type: 'unknown',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          occurred_at: new Date().toISOString(),
          will_retry: attempt <= this.retryConfig.maxRetries
        };

        if (this.errorTrackingEnabled) {
          await this.recordNotificationError(lastError);
        }
      }
    }

    // 全ての試行に失敗
    await this.handleFinalFailure(alert, alertId, lastError!, startTime);
    return false;
  }

  // ============================================
  // スキーマDiffアラート専用
  // ============================================

  async sendSchemaDiffAlert(alert: SchemaDiffAlert): Promise<boolean> {
    const enhancedAlert: SchemaDiffAlert = {
      ...alert,
      timestamp: alert.timestamp || new Date().toISOString(),
      title: `Schema Drift Detected: ${alert.environment}`,
      summary: this.buildSchemaDiffSummary(alert.diff_summary)
    };

    return this.sendAlert(enhancedAlert);
  }

  // ============================================
  // ジョブ失敗アラート専用
  // ============================================

  async sendJobFailureAlert(alert: JobFailureAlert): Promise<boolean> {
    const enhancedAlert: JobFailureAlert = {
      ...alert,
      timestamp: alert.timestamp || new Date().toISOString(),
      title: `Job Failure: ${alert.job_details.job_name}`,
      summary: `${alert.job_details.failure_reason} (Retry: ${alert.job_details.retry_count})`
    };

    return this.sendAlert(enhancedAlert);
  }

  // ============================================
  // Slackペイロード構築
  // ============================================

  private buildSlackPayload(alert: SlackAlert): any {
    const emoji = this.getSeverityEmoji(alert.severity);
    const color = this.getSeverityColor(alert.severity);

    const baseBlocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} ${alert.title}`,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Environment:*\n${alert.environment}`
          },
          {
            type: 'mrkdwn',
            text: `*Severity:*\n${alert.severity.toUpperCase()}`
          },
          {
            type: 'mrkdwn',
            text: `*Source:*\n${alert.source.replace('_', ' ')}`
          },
          {
            type: 'mrkdwn',
            text: `*Time:*\n<!date^${Math.floor(Date.parse(alert.timestamp || new Date().toISOString()) / 1000)}^{date_short_pretty} {time}|${alert.timestamp}>`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Summary:*\n${alert.summary}`
        }
      }
    ];

    // ソース固有のブロック追加
    const specificBlocks = this.buildSourceSpecificBlocks(alert);
    const allBlocks = [...baseBlocks, ...specificBlocks];

    // アクションボタン追加
    if (alert.deep_link) {
      allBlocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Details',
              emoji: true
            },
            url: alert.deep_link,
            style: alert.severity === 'error' || alert.severity === 'critical' ? 'danger' : 'primary'
          }
        ]
      });
    }

    return {
      text: `${emoji} ${alert.title}`,
      blocks: allBlocks,
      attachments: [
        {
          color: color,
          blocks: []
        }
      ]
    };
  }

  // ============================================
  // ソース固有ブロック構築
  // ============================================

  private buildSourceSpecificBlocks(alert: SlackAlert): any[] {
    switch (alert.source) {
      case 'schema_diff':
        return this.buildSchemaDiffBlocks(alert as SchemaDiffAlert);
      case 'job_failure':
        return this.buildJobFailureBlocks(alert as JobFailureAlert);
      case 'rls_denied':
        return this.buildRlsDeniedBlocks(alert as RlsDeniedAlert);
      case 'system_health':
        return this.buildSystemHealthBlocks(alert as SystemHealthAlert);
      default:
        return [];
    }
  }

  private buildSchemaDiffBlocks(alert: SchemaDiffAlert): any[] {
    const changeSummary = Object.entries(alert.diff_summary.change_types)
      .map(([type, count]) => `${type}: ${count}`)
      .join('\n');

    const blocks = [
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Total Changes:*\n${alert.diff_summary.total_changes}`
          },
          {
            type: 'mrkdwn',
            text: `*Schemas Affected:*\n${alert.diff_summary.schemas_affected.join(', ')}`
          }
        ]
      }
    ];

    if (changeSummary) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Changes by Type:*\n\`\`\`${changeSummary}\`\`\``
        }
      });
    }

    if (alert.latest_migration) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Latest Migration: ${alert.latest_migration}`
          }
        ]
      });
    }

    return blocks;
  }

  private buildJobFailureBlocks(alert: JobFailureAlert): any[] {
    const job = alert.job_details;
    
    return [
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Job ID:*\n${job.job_id}`
          },
          {
            type: 'mrkdwn',
            text: `*Retry Count:*\n${job.retry_count}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Failure Reason:*\n\`${job.failure_reason}\``
        }
      }
    ];
  }

  private buildRlsDeniedBlocks(alert: RlsDeniedAlert): any[] {
    const denial = alert.denial_summary;
    
    return [
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Table:*\n${denial.table_name}`
          },
          {
            type: 'mrkdwn',
            text: `*Operation:*\n${denial.operation}`
          },
          {
            type: 'mrkdwn',
            text: `*Reason:*\n${denial.reason}`
          },
          {
            type: 'mrkdwn',
            text: `*Occurrences:*\n${denial.occurrence_count}`
          }
        ]
      }
    ];
  }

  private buildSystemHealthBlocks(alert: SystemHealthAlert): any[] {
    const health = alert.health_metrics;
    const metrics: string[] = [];

    if (health.cpu_usage !== undefined) metrics.push(`CPU: ${health.cpu_usage}%`);
    if (health.memory_usage !== undefined) metrics.push(`Memory: ${health.memory_usage}%`);
    if (health.db_connections !== undefined) metrics.push(`DB Connections: ${health.db_connections}`);
    if (health.response_time !== undefined) metrics.push(`Response Time: ${health.response_time}ms`);
    if (health.error_rate !== undefined) metrics.push(`Error Rate: ${health.error_rate}%`);

    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Health Metrics:*\n\`\`\`${metrics.join('\n')}\`\`\``
        }
      }
    ];
  }

  // ============================================
  // ヘルパー関数
  // ============================================

  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'error':
        return '❌';
      case 'warn':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📋';
    }
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical':
        return '#FF0000'; // 赤
      case 'error':
        return '#FF6B6B'; // 明るい赤
      case 'warn':
        return '#FFB347'; // オレンジ
      case 'info':
        return '#36C5F0'; // 青
      default:
        return '#808080'; // グレー
    }
  }

  private buildSchemaDiffSummary(diffSummary: SchemaDiffAlert['diff_summary']): string {
    const parts: string[] = [];
    
    if (diffSummary.total_changes > 0) {
      parts.push(`${diffSummary.total_changes} changes detected`);
    }
    
    const severitySummary = Object.entries(diffSummary.severity_counts)
      .filter(([_, count]) => count > 0)
      .map(([severity, count]) => `${count} ${severity}`)
      .join(', ');
    
    if (severitySummary) {
      parts.push(`(${severitySummary})`);
    }

    if (diffSummary.schemas_affected.length > 0) {
      parts.push(`affecting ${diffSummary.schemas_affected.join(', ')}`);
    }

    return parts.join(' ');
  }
}

// ============================================
// 便利ファクトリー関数
// ============================================

/**
 * 環境変数からSlackNotifierインスタンスを作成
 */
export function createSlackNotifier(logger: EdgeLogger, environment: string): SlackNotifier | null {
  const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');
  const defaultChannel = Deno.env.get('SLACK_DEFAULT_CHANNEL');
  
  if (!webhookUrl) {
    logger.warn('Slack webhook URL not configured');
    return null;
  }

  return new SlackNotifier(webhookUrl, logger, environment, defaultChannel);
}

/**
 * クイック通知送信ヘルパー
 */
export async function sendQuickSlackAlert(
  source: AlertSource,
  severity: AlertSeverity,
  title: string,
  summary: string,
  environment: string,
  logger: EdgeLogger,
  deepLink?: string
): Promise<boolean> {
  const notifier = createSlackNotifier(logger, environment);
  if (!notifier) return false;

  const alert: BaseSlackAlert = {
    source,
    severity,
    environment,
    title,
    summary,
    deep_link: deepLink,
    timestamp: new Date().toISOString()
  };

  return notifier.sendAlert(alert as SlackAlert);
}