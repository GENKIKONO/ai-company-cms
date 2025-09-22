import { Resend } from 'resend';
import { signApprovalToken, generateApprovalUrl } from './jwt';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface ApprovalEmailData {
  organizationId: string;
  organizationName: string;
  partnerEmail: string;
  partnerName?: string;
  requesterEmail: string;
  previewUrl: string;
}

export async function sendApprovalEmail(data: ApprovalEmailData): Promise<void> {
  try {
    // Resend API が設定されていない場合はスキップ
    if (!resend) {
      console.warn('Resend API key not configured, skipping email send');
      return;
    }
    // 承認用トークンを生成
    const approveToken = await signApprovalToken({
      organizationId: data.organizationId,
      action: 'approve',
      email: data.partnerEmail,
      partnerName: data.partnerName,
    });

    // 拒否用トークンを生成
    const rejectToken = await signApprovalToken({
      organizationId: data.organizationId,
      action: 'reject',
      email: data.partnerEmail,
      partnerName: data.partnerName,
    });

    const approveUrl = generateApprovalUrl(approveToken, 'approve');
    const rejectUrl = generateApprovalUrl(rejectToken, 'reject');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>企業情報の公開承認依頼</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #1f2937; margin: 0;">企業情報の公開承認依頼</h1>
  </div>
  
  <p>いつもお世話になっております。</p>
  
  <p><strong>${data.organizationName}</strong> の企業情報ページの公開について、承認をお願いいたします。</p>
  
  <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #374151;">申請内容</h3>
    <ul style="margin: 0; padding-left: 20px;">
      <li>企業名: ${data.organizationName}</li>
      <li>申請者: ${data.requesterEmail}</li>
    </ul>
  </div>
  
  <p>内容をご確認いただき、以下のボタンから承認または拒否をお選びください。</p>
  
  <div style="margin: 30px 0; text-align: center;">
    <a href="${data.previewUrl}" 
       style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 0 10px 10px 0;">
      内容をプレビュー
    </a>
  </div>
  
  <div style="margin: 30px 0; text-align: center;">
    <a href="${approveUrl}" 
       style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 0 10px 10px 0;">
      ✓ 承認する
    </a>
    <a href="${rejectUrl}" 
       style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 0 10px 10px 0;">
      ✗ 拒否する
    </a>
  </div>
  
  <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <p style="margin: 0; font-size: 14px; color: #92400e;">
      <strong>重要:</strong> このリンクは15分間のみ有効です。期限が切れた場合は、再度申請をお願いいたします。
    </p>
  </div>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <p style="font-size: 14px; color: #6b7280;">
    このメールは自動送信されています。ご不明な点がございましたら、サポートまでお問い合わせください。
  </p>
  
  <p style="font-size: 14px; color: #6b7280;">
    AI対応企業情報CMS
  </p>
</body>
</html>`;

    const emailText = `
企業情報の公開承認依頼

いつもお世話になっております。

${data.organizationName} の企業情報ページの公開について、承認をお願いいたします。

申請内容:
- 企業名: ${data.organizationName}
- 申請者: ${data.requesterEmail}

内容をご確認いただき、以下のリンクから承認または拒否をお選びください。

プレビュー: ${data.previewUrl}

承認する: ${approveUrl}
拒否する: ${rejectUrl}

重要: このリンクは15分間のみ有効です。期限が切れた場合は、再度申請をお願いいたします。

このメールは自動送信されています。ご不明な点がございましたら、サポートまでお問い合わせください。

AI対応企業情報CMS
`;

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@example.com',
      to: data.partnerEmail,
      subject: `【承認依頼】${data.organizationName} - 企業情報ページの公開について`,
      html: emailHtml,
      text: emailText,
    });

  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('承認メールの送信に失敗しました');
  }
}