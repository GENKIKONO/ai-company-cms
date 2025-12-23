/**
 * Contact Form API
 * POST /api/contact
 *
 * お問い合わせフォームからのメール送信
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendHtmlEmail } from '@/lib/email/resend-client';
import { SITE_CONFIG } from '@/lib/site-config';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

// Validation schema
const contactFormSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100),
  email: z.string().email('有効なメールアドレスを入力してください'),
  company: z.string().optional(),
  category: z.enum(['general', 'sales', 'support', 'partnership', 'other']),
  message: z.string().min(10, 'メッセージは10文字以上で入力してください').max(5000),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

const CATEGORY_LABELS: Record<string, string> = {
  general: '一般的なお問い合わせ',
  sales: '導入・料金について',
  support: 'サポート',
  partnership: '提携・協業について',
  other: 'その他',
};

function buildContactEmailHtml(data: ContactFormData): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>お問い合わせ - ${SITE_CONFIG.siteName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${SITE_CONFIG.siteName} - お問い合わせ</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px;">新しいお問い合わせが届きました</h2>

    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; width: 120px; color: #6b7280;">お名前</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.name)}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280;">メール</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${escapeHtml(data.email)}" style="color: #059669;">${escapeHtml(data.email)}</a></td>
      </tr>
      ${data.company ? `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280;">会社名</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.company)}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280;">カテゴリ</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${CATEGORY_LABELS[data.category] || data.category}</td>
      </tr>
    </table>

    <div style="margin-top: 24px;">
      <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px;">お問い合わせ内容</h3>
      <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap;">${escapeHtml(data.message)}</div>
    </div>
  </div>

  <div style="background: #1f2937; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: #9ca3af; margin: 0; font-size: 14px;">
      ${SITE_CONFIG.companyName} | ${SITE_CONFIG.siteName}
    </p>
  </div>
</body>
</html>`;
}

function buildAutoReplyHtml(data: ContactFormData): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>お問い合わせありがとうございます - ${SITE_CONFIG.siteName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${SITE_CONFIG.siteName}</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">お問い合わせありがとうございます</p>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin: 0 0 20px 0;">${escapeHtml(data.name)} 様</p>

    <p style="margin: 0 0 20px 0;">
      この度は${SITE_CONFIG.siteName}にお問い合わせいただき、誠にありがとうございます。<br>
      以下の内容でお問い合わせを受け付けました。
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="margin: 0 0 8px 0;"><strong>カテゴリ:</strong> ${CATEGORY_LABELS[data.category] || data.category}</p>
      <p style="margin: 0 0 8px 0;"><strong>お問い合わせ内容:</strong></p>
      <p style="margin: 0; white-space: pre-wrap; color: #6b7280;">${escapeHtml(data.message)}</p>
    </div>

    <p style="margin: 20px 0;">
      担当者が内容を確認の上、通常2営業日以内にご連絡いたします。<br>
      お急ぎの場合は、件名に「至急」と記載の上、再度ご連絡ください。
    </p>

    <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border: 1px solid #fcd34d; margin: 20px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        ※このメールは自動送信されています。このメールへの返信はお受けできません。
      </p>
    </div>
  </div>

  <div style="background: #1f2937; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: #9ca3af; margin: 0; font-size: 14px;">
      ${SITE_CONFIG.companyName}<br>
      ${SITE_CONFIG.supportDescription}
    </p>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const body = await request.json();

    // Validate input
    const parseResult = contactFormSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: parseResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    logger.info('[Contact API] Processing contact form submission', {
      requestId,
      category: data.category,
      hasCompany: !!data.company
    });

    // 1. Send notification to support team
    const notifyResult = await sendHtmlEmail({
      to: SITE_CONFIG.supportEmail,
      subject: `【${SITE_CONFIG.siteName}】お問い合わせ: ${CATEGORY_LABELS[data.category]} - ${data.name}様`,
      html: buildContactEmailHtml(data),
      requestId: `contact-notify-${requestId}`
    });

    if (!notifyResult.success) {
      logger.error('[Contact API] Failed to send notification email', {
        requestId,
        error: notifyResult.error
      });
      // Continue to send auto-reply even if notification fails
    }

    // 2. Send auto-reply to user
    const replyResult = await sendHtmlEmail({
      to: data.email,
      subject: `【${SITE_CONFIG.siteName}】お問い合わせを受け付けました`,
      html: buildAutoReplyHtml(data),
      requestId: `contact-reply-${requestId}`
    });

    if (!replyResult.success) {
      logger.warn('[Contact API] Failed to send auto-reply email', {
        requestId,
        error: replyResult.error
      });
    }

    // Consider success if at least the notification was sent
    const success = notifyResult.success;

    logger.info('[Contact API] Contact form processed', {
      requestId,
      notificationSent: notifyResult.success,
      autoReplySent: replyResult.success
    });

    return NextResponse.json({
      success,
      message: success
        ? 'お問い合わせを受け付けました'
        : 'メール送信に問題が発生しましたが、お問い合わせは記録されました',
      requestId
    });

  } catch (error) {
    logger.error('[Contact API] Unexpected error', {
      requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました。しばらく経ってから再度お試しください。'
      },
      { status: 500 }
    );
  }
}
