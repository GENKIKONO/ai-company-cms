'use client';

import { Resend } from 'resend';
import { logger } from '@/lib/utils/logger';

// Resend configuration
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@aiohub.ai';

// Email templates
export const EMAIL_TEMPLATES = {
  WELCOME: {
    subject: 'AIO Hub AI企業CMSへようこそ！',
    getHtml: (userName: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>AIO Hub AI企業CMSへようこそ</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: var(--color-email-text);">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: var(--color-email-primary); margin: 0;">AIO Hub AI企業CMS</h1>
              <p style="color: var(--text-muted); margin: 10px 0 0 0;">企業情報管理プラットフォーム</p>
            </div>
            
            <div style="background: var(--color-email-background); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
              <h2 style="color: var(--color-email-dark); margin: 0 0 20px 0;">ようこそ、${userName}さん！</h2>
              <p style="margin: 0 0 20px 0;">AIO Hub AI企業CMSにご登録いただき、ありがとうございます。</p>
              <p style="margin: 0 0 20px 0;">このプラットフォームでは、以下のことができます：</p>
              
              <ul style="padding-left: 20px; margin: 0 0 20px 0;">
                <li style="margin-bottom: 8px;">企業情報の登録・管理</li>
                <li style="margin-bottom: 8px;">サービス・製品情報の掲載</li>
                <li style="margin-bottom: 8px;">導入事例の公開</li>
                <li style="margin-bottom: 8px;">FAQの管理</li>
                <li style="margin-bottom: 8px;">企業間の検索・発見</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="display: inline-block; background: var(--color-email-primary); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                ダッシュボードを開く
              </a>
            </div>
            
            <div style="border-top: 1px solid var(--color-email-border); padding-top: 20px; text-align: center;">
              <p style="color: var(--text-muted); font-size: 14px; margin: 0;">
                ご質問がございましたら、お気軽にお問い合わせください。<br>
                <a href="mailto:support@aiohub.ai" style="color: var(--color-email-primary);">support@aiohub.ai</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    getText: (userName: string) => `
AIO Hub AI企業CMSへようこそ！

${userName}さん、

AIO Hub AI企業CMSにご登録いただき、ありがとうございます。

このプラットフォームでは、以下のことができます：
- 企業情報の登録・管理
- サービス・製品情報の掲載
-導入事例の公開
- FAQの管理
- 企業間の検索・発見

ダッシュボード: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

ご質問がございましたら、support@aiohub.ai までお問い合わせください。

AIO Hub チーム
    `
  },

  PAYMENT_FAILED: {
    subject: 'サブスクリプション決済に失敗しました',
    getHtml: (userName: string, organizationName: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>決済失敗のお知らせ</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: var(--color-email-text);">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: var(--color-email-error); margin: 0;">決済失敗のお知らせ</h1>
            </div>
            
            <div style="background: var(--color-email-error-bg); border: 1px solid var(--color-email-error-border); padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <h2 style="color: var(--color-email-error); margin: 0 0 15px 0;">⚠️ 決済処理に失敗しました</h2>
              <p style="margin: 0 0 15px 0;">
                ${userName}さん、「${organizationName}」のサブスクリプション決済処理に失敗しました。
              </p>
              <p style="margin: 0;">
                クレジットカードの期限切れや残高不足が原因の可能性があります。
              </p>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h3 style="color: var(--color-email-dark); margin: 0 0 15px 0;">必要な対応</h3>
              <ol style="padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 10px;">サブスクリプション管理画面で決済情報を確認</li>
                <li style="margin-bottom: 10px;">クレジットカード情報の更新（必要に応じて）</li>
                <li style="margin-bottom: 10px;">決済の再試行</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" 
                 style="display: inline-block; background: var(--color-email-error); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                サブスクリプション管理
              </a>
            </div>
            
            <div style="background: var(--color-gray-50); padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <p style="margin: 0; color: var(--text-muted); font-size: 14px;">
                <strong>注意:</strong> 決済が完了するまで、一部の機能が制限される場合があります。
                速やかな対応をお願いいたします。
              </p>
            </div>
            
            <div style="border-top: 1px solid var(--color-email-border); padding-top: 20px; text-align: center;">
              <p style="color: var(--text-muted); font-size: 14px; margin: 0;">
                ご不明な点がございましたら、お気軽にお問い合わせください。<br>
                <a href="mailto:support@aiohub.ai" style="color: var(--color-email-primary);">support@aiohub.ai</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    getText: (userName: string, organizationName: string) => `
決済失敗のお知らせ

${userName}さん、

「${organizationName}」のサブスクリプション決済処理に失敗しました。

クレジットカードの期限切れや残高不足が原因の可能性があります。

必要な対応：
1. サブスクリプション管理画面で決済情報を確認
2. クレジットカード情報の更新（必要に応じて）
3. 決済の再試行

サブスクリプション管理: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing

注意: 決済が完了するまで、一部の機能が制限される場合があります。

お問い合わせ: support@aiohub.ai

AIO Hub チーム
    `
  }
} as const;

// Welcome email for new users
export async function sendWelcomeEmail(email: string, userName: string) {
  try {
    const template = EMAIL_TEMPLATES.WELCOME;
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: template.subject,
      html: template.getHtml(userName),
      text: template.getText(userName),
    });

    if (error) {
      logger.error('Error sending welcome email', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error };
    }

    logger.debug('Welcome email sent successfully', data);
    return { success: true, data };
  } catch (error) {
    logger.error('Error sending welcome email', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error };
  }
}

// Payment failure notification
export async function sendPaymentFailedEmail(
  email: string, 
  userName: string, 
  organizationName: string
) {
  try {
    const template = EMAIL_TEMPLATES.PAYMENT_FAILED;
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: template.subject,
      html: template.getHtml(userName, organizationName),
      text: template.getText(userName, organizationName),
    });

    if (error) {
      logger.error('Error sending payment failed email', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error };
    }

    logger.debug('Payment failed email sent successfully', data);
    return { success: true, data };
  } catch (error) {
    logger.error('Error sending payment failed email', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error };
  }
}

// Generic email sender for future use
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });

    if (error) {
      logger.error('Error sending email', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error };
    }

    logger.debug('Email sent successfully', data);
    return { success: true, data };
  } catch (error) {
    logger.error('Error sending email', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error };
  }
}

// Email preferences and unsubscribe (for future implementation)
export const EMAIL_TYPES = {
  WELCOME: 'welcome',
  PAYMENT_FAILED: 'payment_failed',
  MARKETING: 'marketing',
  SYSTEM: 'system',
} as const;

export type EmailType = typeof EMAIL_TYPES[keyof typeof EMAIL_TYPES];