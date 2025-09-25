/**
 * Resend認証補助通知クライアント（商用レベル統合版）
 * 
 * 注意: 本認証リンクはSupabaseが送信。Resendは見た目向上の補助通知のみ
 */
import 'server-only';
import { Resend } from 'resend';

// Initialize Resend client with fallback for build time
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-build');

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  requestId?: string;
}

interface SendEmailResult {
  success: boolean;
  requestId: string;
  messageId?: string;
  error?: string;
}

export async function sendHtmlEmail({ 
  to, 
  subject, 
  html, 
  requestId = crypto.randomUUID() 
}: SendEmailParams): Promise<SendEmailResult> {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'AIO Hub <noreply@aiohub.jp>';
  
  // Check if API key is available (for runtime)
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'dummy-key-for-build') {
    console.warn({
      event: 'auth_email_warning',
      provider: 'resend',
      message: 'RESEND_API_KEY not configured, skipping Resend email',
      requestId,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      requestId,
      error: 'Resend API key not configured'
    };
  }
  
  try {
    console.info({
      event: 'auth_email_sending',
      provider: 'resend',
      to,
      subject,
      requestId,
      timestamp: new Date().toISOString()
    });

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error({
        event: 'auth_email_error',
        provider: 'resend',
        to,
        subject,
        requestId,
        error: error.message || error,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        requestId,
        error: error.message || 'Failed to send email'
      };
    }

    console.info({
      event: 'auth_email_sent',
      provider: 'resend',
      to,
      subject,
      requestId,
      messageId: data?.id,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      requestId,
      messageId: data?.id
    };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    console.error({
      event: 'auth_email_error',
      provider: 'resend',
      to,
      subject,
      requestId,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      requestId,
      error: errorMessage
    };
  }
}

/**
 * 認証専用ヘルパー関数（補助通知）
 */
export class AuthNotificationHelper {
  /**
   * ウェルカム補助通知（認証リンクなし）
   */
  static async sendWelcomeNotification(email: string, userName: string = ''): Promise<SendEmailResult> {
    const displayName = userName || email.split('@')[0];
    
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIO Hubへようこそ</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .logo { color: white; font-size: 32px; font-weight: bold; margin-bottom: 8px; }
        .subtitle { color: #e2e8f0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 20px; color: #1a202c; margin-bottom: 20px; font-weight: 600; }
        .message { font-size: 16px; color: #4a5568; line-height: 1.8; margin-bottom: 30px; }
        .highlight { background: #f0fff4; border: 1px solid #9ae6b4; padding: 20px; border-radius: 8px; margin: 30px 0; }
        .highlight-title { color: #2f855a; font-weight: 600; margin-bottom: 10px; }
        .highlight-text { color: #276749; }
        .cta { background: #667eea; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; transition: background 0.2s; }
        .cta:hover { background: #5a67d8; }
        .footer { background: #f7fafc; padding: 30px; text-align: center; font-size: 14px; color: #718096; border-top: 1px solid #e2e8f0; }
        .divider { border-top: 1px solid #e2e8f0; margin: 30px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀 AIO Hub</div>
            <div class="subtitle">ビジネス成長のプラットフォーム</div>
        </div>
        
        <div class="content">
            <div class="greeting">こんにちは、${displayName} さん</div>
            
            <div class="message">
                AIO Hubへのご登録ありがとうございます！<br>
                このメールは登録完了をお知らせする補助通知です。
            </div>
            
            <div class="highlight">
                <div class="highlight-title">📧 次のステップ</div>
                <div class="highlight-text">
                    別途送信される認証メール内のリンクをクリックして、メールアドレスの確認を完了してください。<br>
                    メールが見つからない場合は、迷惑メールフォルダもご確認ください。
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="https://aiohub.jp/dashboard" class="cta">ダッシュボードへ移動</a>
            </div>
            
            <div class="divider"></div>
            
            <div style="font-size: 14px; color: #718096;">
                ご質問やサポートが必要でしたら、お気軽にお問い合わせください。<br>
                今後ともAIO Hubをよろしくお願いいたします。
            </div>
        </div>
        
        <div class="footer">
            <div><strong>AIO Hub チーム</strong></div>
            <div style="margin-top: 10px;">
                <a href="https://aiohub.jp" style="color: #667eea; text-decoration: none;">https://aiohub.jp</a>
            </div>
        </div>
    </div>
</body>
</html>`;

    return await sendHtmlEmail({
      to: email,
      subject: '🚀 【AIO Hub】ご登録ありがとうございます',
      html,
      requestId: `welcome-${crypto.randomUUID()}`
    });
  }

  /**
   * パスワードリセット補助通知（リセットリンクなし）
   */
  static async sendPasswordResetNotification(email: string): Promise<SendEmailResult> {
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>パスワードリセット - AIO Hub</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px; text-align: center; }
        .logo { color: white; font-size: 32px; font-weight: bold; margin-bottom: 8px; }
        .subtitle { color: #fbb6ce; font-size: 16px; }
        .content { padding: 40px 30px; }
        .alert { background: #fed7d7; border: 1px solid #feb2b2; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
        .alert-title { font-weight: 600; color: #c53030; margin-bottom: 10px; font-size: 16px; }
        .alert-text { color: #9b2c2c; }
        .message { font-size: 16px; color: #4a5568; line-height: 1.8; margin-bottom: 20px; }
        .step-box { background: #f0fff4; border: 1px solid #9ae6b4; padding: 20px; border-radius: 8px; margin: 30px 0; }
        .step-title { color: #2f855a; font-weight: 600; margin-bottom: 10px; }
        .step-text { color: #276749; }
        .warning { background: #fffbeb; border: 1px solid #f6e05e; border-radius: 8px; padding: 20px; margin: 30px 0; }
        .warning-title { color: #d69e2e; font-weight: 600; margin-bottom: 10px; }
        .warning-text { color: #b7791f; }
        .footer { background: #f7fafc; padding: 30px; text-align: center; font-size: 14px; color: #718096; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔒 AIO Hub</div>
            <div class="subtitle">セキュリティ通知</div>
        </div>
        
        <div class="content">
            <div class="alert">
                <div class="alert-title">⚠️ パスワードリセットが要求されました</div>
                <div class="alert-text">このメールは補助通知です。別途、パスワードリセット用のメールが送信されます。</div>
            </div>
            
            <div class="message">
                あなたのアカウント（<strong>${email}</strong>）でパスワードリセットが要求されました。
            </div>
            
            <div class="step-box">
                <div class="step-title">📧 次のステップ</div>
                <div class="step-text">
                    別途送信される「【AIO Hub】パスワードリセットのご案内」メール内のリンクをクリックして、新しいパスワードを設定してください。<br><br>
                    メールが見つからない場合は、迷惑メールフォルダもご確認ください。
                </div>
            </div>
            
            <div class="warning">
                <div class="warning-title">🚨 お心当たりがない場合</div>
                <div class="warning-text">
                    このリセット要求に心当たりがない場合は、このメールを無視してください。<br>
                    第三者による不正なアクセスが疑われる場合は、すぐにサポートまでご連絡ください。
                </div>
            </div>
            
            <div class="message" style="font-size: 14px; color: #718096;">
                このリセット要求は24時間以内に自動的に無効になります。<br>
                セキュリティを保つため、定期的にパスワードを変更することをお勧めします。
            </div>
        </div>
        
        <div class="footer">
            <div><strong>AIO Hub セキュリティチーム</strong></div>
            <div style="margin-top: 10px;">
                <a href="https://aiohub.jp" style="color: #667eea; text-decoration: none;">https://aiohub.jp</a>
            </div>
        </div>
    </div>
</body>
</html>`;

    return await sendHtmlEmail({
      to: email,
      subject: '🔒 【AIO Hub】パスワードリセット要求を受け付けました',
      html,
      requestId: `password-reset-${crypto.randomUUID()}`
    });
  }
}

// 便利な関数をエクスポート
export const { sendWelcomeNotification, sendPasswordResetNotification } = AuthNotificationHelper;