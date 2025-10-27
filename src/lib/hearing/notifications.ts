/**
 * ヒアリング代行サービス通知システム
 * メール・アプリ内通知・緊急アラート管理
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

// 通知タイプ定義
export enum NotificationType {
  // 承認フロー
  APPROVAL_REQUIRED = 'approval_required',
  DRAFT_APPROVED = 'draft_approved',
  DRAFT_REJECTED = 'draft_rejected',
  CONTENT_PUBLISHED = 'content_published',
  
  // 委任管理
  DELEGATION_CREATED = 'delegation_created',
  DELEGATION_REVOKED = 'delegation_revoked',
  DELEGATION_EXPIRED = 'delegation_expired',
  
  // セキュリティ・コンプライアンス
  SECURITY_ALERT = 'security_alert',
  COMPLIANCE_REVIEW = 'compliance_review',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  
  // システム通知
  SYSTEM_MAINTENANCE = 'system_maintenance',
  FEATURE_UPDATE = 'feature_update'
}

// 通知優先度
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 通知チャネル
export enum NotificationChannel {
  EMAIL = 'email',
  IN_APP = 'in_app',
  SMS = 'sms',
  SLACK = 'slack'
}

// 通知データ構造
interface NotificationData {
  type: NotificationType;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  recipients: string[];
  title: string;
  message: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  expiresAt?: string;
}

// 通知テンプレート
const NOTIFICATION_TEMPLATES: Record<NotificationType, {
  title: (data: any) => string;
  message: (data: any) => string;
  defaultChannels: NotificationChannel[];
  priority: NotificationPriority;
}> = {
  [NotificationType.APPROVAL_REQUIRED]: {
    title: (data) => `承認依頼：${data.title}`,
    message: (data) => `ヒアリング代行により作成された「${data.title}」(${data.content_type})の承認をお願いします。内容をご確認の上、承認・却下をご判断ください。`,
    defaultChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    priority: NotificationPriority.HIGH
  },
  
  [NotificationType.DRAFT_APPROVED]: {
    title: (data) => `承認完了：${data.title}`,
    message: (data) => `作成した下書き「${data.title}」が承認されました。公開の準備が整いました。`,
    defaultChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    priority: NotificationPriority.NORMAL
  },
  
  [NotificationType.DRAFT_REJECTED]: {
    title: (data) => `修正依頼：${data.title}`,
    message: (data) => `下書き「${data.title}」について修正依頼があります。理由：${data.reason}${data.feedback ? '\n\nフィードバック：' + data.feedback : ''}`,
    defaultChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    priority: NotificationPriority.HIGH
  },
  
  [NotificationType.CONTENT_PUBLISHED]: {
    title: (data) => `公開完了：${data.title}`,
    message: (data) => `「${data.title}」が正常に公開されました。`,
    defaultChannels: [NotificationChannel.IN_APP],
    priority: NotificationPriority.NORMAL
  },
  
  [NotificationType.DELEGATION_CREATED]: {
    title: () => '委任設定完了',
    message: (data) => `${data.organization_name}の管理権限が委任されました。有効期限：${data.expires_at ? new Date(data.expires_at).toLocaleDateString() : '無期限'}`,
    defaultChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    priority: NotificationPriority.HIGH
  },
  
  [NotificationType.DELEGATION_REVOKED]: {
    title: () => '委任取り消し',
    message: (data) => `${data.organization_name}の管理権限が取り消されました。理由：${data.reason}`,
    defaultChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    priority: NotificationPriority.HIGH
  },
  
  [NotificationType.DELEGATION_EXPIRED]: {
    title: () => '委任期限切れ',
    message: (data) => `${data.organization_name}の管理権限が期限切れになりました。継続が必要な場合は再度委任設定を行ってください。`,
    defaultChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    priority: NotificationPriority.HIGH
  },
  
  [NotificationType.SECURITY_ALERT]: {
    title: () => 'セキュリティアラート',
    message: (data) => `セキュリティに関する重要な通知：${data.alert_message}`,
    defaultChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.SLACK],
    priority: NotificationPriority.URGENT
  },
  
  [NotificationType.COMPLIANCE_REVIEW]: {
    title: () => 'コンプライアンス確認要求',
    message: (data) => `コンプライアンス担当者による確認が必要です：${data.review_reason}`,
    defaultChannels: [NotificationChannel.EMAIL, NotificationChannel.SLACK],
    priority: NotificationPriority.HIGH
  },
  
  [NotificationType.SUSPICIOUS_ACTIVITY]: {
    title: () => '異常なアクティビティ検出',
    message: (data) => `異常なアクティビティが検出されました：${data.activity_description}`,
    defaultChannels: [NotificationChannel.EMAIL, NotificationChannel.SLACK],
    priority: NotificationPriority.URGENT
  },
  
  [NotificationType.SYSTEM_MAINTENANCE]: {
    title: () => 'システムメンテナンス通知',
    message: (data) => `システムメンテナンスが予定されています。日時：${data.maintenance_time}`,
    defaultChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    priority: NotificationPriority.NORMAL
  },
  
  [NotificationType.FEATURE_UPDATE]: {
    title: () => '機能更新のお知らせ',
    message: (data) => `新機能が追加されました：${data.feature_description}`,
    defaultChannels: [NotificationChannel.IN_APP],
    priority: NotificationPriority.LOW
  }
};

// メイン通知送信関数
export async function sendHearingNotification(notificationData: NotificationData): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 通知を各チャネルに送信
    const results = await Promise.allSettled(
      notificationData.channels.map(channel => 
        sendToChannel(channel, notificationData)
      )
    );

    // アプリ内通知を保存
    if (notificationData.channels.includes(NotificationChannel.IN_APP)) {
      await saveInAppNotifications(supabase, notificationData);
    }

    // 結果集計
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const totalCount = results.length;

    logger.debug('Debug', `Notification sent: ${successCount}/${totalCount} channels successful`);
    
    return successCount > 0;

  } catch (error) {
    logger.error('Notification send error', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

// テンプレート使用のヘルパー関数
export async function sendTemplateNotification(
  type: NotificationType,
  recipients: string[],
  templateData: any,
  customChannels?: NotificationChannel[]
): Promise<boolean> {
  const template = NOTIFICATION_TEMPLATES[type];
  
  if (!template) {
    console.error(`Unknown notification type: ${type}`);
    return false;
  }

  const notificationData: NotificationData = {
    type,
    priority: template.priority,
    channels: customChannels || template.defaultChannels,
    recipients,
    title: template.title(templateData),
    message: template.message(templateData),
    metadata: templateData,
    actionUrl: templateData.actionUrl,
    expiresAt: templateData.expiresAt
  };

  return await sendHearingNotification(notificationData);
}

// チャネル別送信関数
async function sendToChannel(channel: NotificationChannel, data: NotificationData): Promise<void> {
  switch (channel) {
    case NotificationChannel.EMAIL:
      await sendEmailNotification(data);
      break;
      
    case NotificationChannel.SMS:
      await sendSMSNotification(data);
      break;
      
    case NotificationChannel.SLACK:
      await sendSlackNotification(data);
      break;
      
    case NotificationChannel.IN_APP:
      // アプリ内通知は別途処理
      break;
      
    default:
      console.warn(`Unsupported notification channel: ${channel}`);
  }
}

// メール通知送信
async function sendEmailNotification(data: NotificationData): Promise<void> {
  try {
    // 実際のメール送信実装（例：SendGrid、AWS SES等）
    logger.debug('Sending email notification', {
      to: data.recipients,
      subject: data.title,
      body: data.message,
      priority: data.priority
    });

    // メール送信APIコール
    // await emailService.send({
    //   to: data.recipients,
    //   subject: data.title,
    //   html: formatEmailHTML(data),
    //   priority: data.priority
    // });

  } catch (error) {
    logger.error('Email notification error', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// SMS通知送信
async function sendSMSNotification(data: NotificationData): Promise<void> {
  try {
    // 緊急度が高い場合のみSMS送信
    if (data.priority === NotificationPriority.URGENT) {
      console.log('Sending SMS notification:', {
        to: data.recipients,
        message: data.message.substring(0, 160) // SMS制限
      });

      // SMS送信APIコール
      // await smsService.send({
      //   to: data.recipients,
      //   message: data.message.substring(0, 160)
      // });
    }
  } catch (error) {
    logger.error('SMS notification error', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// Slack通知送信
async function sendSlackNotification(data: NotificationData): Promise<void> {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (!webhookUrl) {
      logger.warn('Slack webhook URL not configured');
      return;
    }

    const payload = {
      text: data.title,
      attachments: [{
        color: getPriorityColor(data.priority),
        fields: [{
          title: 'メッセージ',
          value: data.message,
          short: false
        }],
        footer: 'LuxuCare ヒアリング代行サービス',
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    // Slack Webhook送信
    // await fetch(webhookUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });

    logger.debug('Slack notification sent', payload);

  } catch (error) {
    logger.error('Slack notification error', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// アプリ内通知保存
async function saveInAppNotifications(supabase: any, data: NotificationData): Promise<void> {
  try {
    const notifications = data.recipients.map(userId => ({
      user_id: userId,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority,
      metadata: data.metadata,
      action_url: data.actionUrl,
      expires_at: data.expiresAt,
      read: false,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('hearing_notifications')
      .insert(notifications);

    if (error) {
      logger.error('In-app notification save error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

  } catch (error) {
    logger.error('In-app notification error', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// 緊急アラート送信
export async function sendEmergencyAlert(
  alertType: string,
  message: string,
  affectedUsers: string[],
  metadata?: any
): Promise<boolean> {
  return await sendTemplateNotification(
    NotificationType.SECURITY_ALERT,
    affectedUsers,
    {
      alert_message: message,
      alert_type: alertType,
      metadata,
      actionUrl: '/management-console/security-alerts'
    },
    [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.SLACK]
  );
}

// 承認依頼通知（特化関数）
export async function sendApprovalRequest(
  clientUserId: string,
  draftId: string,
  title: string,
  contentType: string,
  hearingAgentId: string
): Promise<boolean> {
  return await sendTemplateNotification(
    NotificationType.APPROVAL_REQUIRED,
    [clientUserId],
    {
      title,
      content_type: contentType,
      draft_id: draftId,
      hearing_agent_id: hearingAgentId,
      actionUrl: `/hearing/approval/${draftId}`
    }
  );
}

// 委任期限切れ通知バッチ処理
export async function sendExpirationNotifications(): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 24時間以内に期限切れになる委任を取得
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    const { data: expiringDelegations, error } = await supabase
      .from('hearing_delegations')
      .select(`
        id,
        client_user_id,
        hearing_agent_id,
        organization_id,
        expires_at,
        organizations (name)
      `)
      .eq('status', 'active')
      .lte('expires_at', tomorrow);

    if (error) {
      logger.error('Expiration check error', error instanceof Error ? error : new Error(String(error)));
      return;
    }

    // 各委任について通知送信
    for (const delegation of expiringDelegations || []) {
      await sendTemplateNotification(
        NotificationType.DELEGATION_EXPIRED,
        [delegation.client_user_id, delegation.hearing_agent_id],
        {
          organization_name: (delegation.organizations as any)?.name || 'Unknown Organization',
          expires_at: delegation.expires_at,
          actionUrl: '/hearing/delegations'
        }
      );
    }

  } catch (error) {
    logger.error('Expiration notification batch error', error instanceof Error ? error : new Error(String(error)));
  }
}

// ユーティリティ関数
function getPriorityColor(priority: NotificationPriority): string {
  switch (priority) {
    case NotificationPriority.URGENT: return 'danger';
    case NotificationPriority.HIGH: return 'warning';
    case NotificationPriority.NORMAL: return 'good';
    case NotificationPriority.LOW: return 'var(--border-muted)';
    default: return 'good';
  }
}

function formatEmailHTML(data: NotificationData): string {
  return `
    <html>
      <body>
        <h2>${data.title}</h2>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
        ${data.actionUrl ? `<p><a href="${data.actionUrl}" style="background: var(--color-notification-action); color: white; padding: 10px 20px; text-decoration: none;">アクション実行</a></p>` : ''}
        <hr>
        <p style="color: var(--color-notification-text); font-size: 12px;">
          このメールはLuxuCareヒアリング代行サービスから自動送信されています。
        </p>
      </body>
    </html>
  `;
}