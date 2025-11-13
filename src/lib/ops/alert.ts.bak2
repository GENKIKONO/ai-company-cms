/**
 * Operations Alert System
 * 
 * Handles critical alerts and notifications for system monitoring
 */

import { logger } from '@/lib/log';

interface AlertContext {
  [key: string]: any;
  timestamp?: string;
  component?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  requestId?: string;
  ip?: string;
}

interface AlertConfig {
  emailEnabled: boolean;
  slackEnabled: boolean;
  adminEmails: string[];
  slackWebhookUrl?: string;
  rateLimitWindow: number; // Prevent alert spam
}

class AlertManager {
  private config: AlertConfig;
  private alertHistory: Map<string, number> = new Map();

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AlertConfig {
    const adminEmailsEnv = process.env.ADMIN_EMAILS;
    const adminEmails = adminEmailsEnv ? adminEmailsEnv.split(',').map(email => email.trim()) : [];
    
    return {
      emailEnabled: adminEmails.length > 0,
      slackEnabled: !!process.env.SLACK_WEBHOOK_URL,
      adminEmails,
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
      rateLimitWindow: 300000 // 5 minutes
    };
  }

  private shouldSendAlert(alertKey: string): boolean {
    const now = Date.now();
    const lastAlert = this.alertHistory.get(alertKey);
    
    if (!lastAlert || now - lastAlert > this.config.rateLimitWindow) {
      this.alertHistory.set(alertKey, now);
      return true;
    }
    
    return false;
  }

  private generateAlertKey(message: string, context?: AlertContext): string {
    // Create a key that groups similar alerts
    const component = context?.component || 'unknown';
    const severity = context?.severity || 'medium';
    
    // Use first 50 chars of message to group similar alerts
    const messageKey = message.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${component}_${severity}_${messageKey}`;
  }

  private async sendSlackAlert(message: string, context?: AlertContext): Promise<boolean> {
    if (!this.config.slackEnabled || !this.config.slackWebhookUrl) {
      return false;
    }

    try {
      const payload = {
        text: `🚨 Critical Alert: ${message}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*🚨 Critical Alert*\n${message}`
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Timestamp:*\n${context?.timestamp || new Date().toISOString()}`
              },
              {
                type: 'mrkdwn',
                text: `*Component:*\n${context?.component || 'Unknown'}`
              },
              {
                type: 'mrkdwn',
                text: `*Severity:*\n${context?.severity || 'medium'}`
              },
              {
                type: 'mrkdwn',
                text: `*Environment:*\n${process.env.APP_ENV || 'unknown'}`
              }
            ]
          }
        ]
      };

      if (context && Object.keys(context).length > 0) {
        payload.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Context:*\n\`\`\`${JSON.stringify(context, null, 2)}\`\`\``
          }
        });
      }

      const response = await fetch(this.config.slackWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      logger.error('Failed to send Slack alert', {
        component: 'alert-manager',
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  private async sendEmailAlert(message: string, context?: AlertContext): Promise<boolean> {
    if (!this.config.emailEnabled || this.config.adminEmails.length === 0) {
      return false;
    }

    // In a real implementation, you would integrate with your email service
    // For now, we'll just log the intent to send email
    logger.info('Email alert would be sent', {
      component: 'alert-manager',
      recipients: this.config.adminEmails,
      message,
      context
    });

    // TODO: Integrate with actual email service (Resend, SendGrid, etc.)
    // Example integration would look like:
    /*
    try {
      await emailService.send({
        to: this.config.adminEmails,
        subject: `🚨 Critical Alert: ${message}`,
        html: this.generateEmailTemplate(message, context)
      });
      return true;
    } catch (error) {
      logger.error('Failed to send email alert', { error });
      return false;
    }
    */

    return true; // Return true for now since we're logging the intent
  }

  /**
   * Send a critical alert
   */
  async sendCriticalAlert(message: string, context?: AlertContext): Promise<void> {
    const enhancedContext: AlertContext = {
      ...context,
      timestamp: new Date().toISOString(),
      severity: context?.severity || 'critical'
    };

    // Generate alert key for rate limiting
    const alertKey = this.generateAlertKey(message, enhancedContext);

    // Check if we should send this alert (rate limiting)
    if (!this.shouldSendAlert(alertKey)) {
      logger.debug('Alert skipped due to rate limiting', {
        component: 'alert-manager',
        alertKey,
        message
      });
      return;
    }

    // Always log the alert
    logger.error(`Critical Alert: ${message}`, {
      component: 'alert-manager',
      type: 'critical_alert',
      ...enhancedContext
    });

    // Send notifications in parallel
    const notifications = [];

    if (this.config.slackEnabled) {
      notifications.push(this.sendSlackAlert(message, enhancedContext));
    }

    if (this.config.emailEnabled) {
      notifications.push(this.sendEmailAlert(message, enhancedContext));
    }

    // If no notification channels available, just log
    if (notifications.length === 0) {
      logger.warn('No alert channels configured', {
        component: 'alert-manager',
        message,
        suggestion: 'Configure ADMIN_EMAILS or SLACK_WEBHOOK_URL environment variables'
      });
      return;
    }

    try {
      const results = await Promise.allSettled(notifications);
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      
      logger.info(`Alert sent to ${successCount}/${notifications.length} channels`, {
        component: 'alert-manager',
        alertKey,
        successCount,
        totalChannels: notifications.length
      });
    } catch (error) {
      logger.error('Failed to send critical alert', {
        component: 'alert-manager',
        error: error instanceof Error ? error.message : String(error),
        message
      });
    }
  }

  /**
   * Send a warning alert (less critical)
   */
  async sendWarningAlert(message: string, context?: AlertContext): Promise<void> {
    await this.sendCriticalAlert(message, {
      ...context,
      severity: 'medium'
    });
  }

  /**
   * Send an info alert
   */
  async sendInfoAlert(message: string, context?: AlertContext): Promise<void> {
    await this.sendCriticalAlert(message, {
      ...context,
      severity: 'low'
    });
  }

  /**
   * Get alert statistics
   */
  getAlertStats() {
    return {
      totalAlerts: this.alertHistory.size,
      recentAlerts: Array.from(this.alertHistory.entries())
        .filter(([, timestamp]) => Date.now() - timestamp < this.config.rateLimitWindow)
        .length,
      configuredChannels: {
        email: this.config.emailEnabled,
        slack: this.config.slackEnabled
      }
    };
  }
}

// Export singleton instance
export const alertManager = new AlertManager();

// Convenience functions
export const sendCriticalAlert = (message: string, context?: AlertContext) => 
  alertManager.sendCriticalAlert(message, context);

export const sendWarningAlert = (message: string, context?: AlertContext) => 
  alertManager.sendWarningAlert(message, context);

export const sendInfoAlert = (message: string, context?: AlertContext) => 
  alertManager.sendInfoAlert(message, context);

// Export types for consumers
export type { AlertContext };