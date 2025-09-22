import { NextRequest, NextResponse } from 'next/server';
import { generateAuthLink } from '@/lib/auth/generate-link';
import { sendHtmlEmail } from '@/lib/email/resend-client';

interface ResendConfirmationRequest {
  email: string;
  type?: 'signup' | 'magiclink';
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    const body: ResendConfirmationRequest = await request.json();
    const { email, type = 'signup' } = body;

    if (!email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email is required',
          requestId 
        },
        { status: 400 }
      );
    }

    console.info({
      event: 'resend_confirmation_request',
      email,
      type,
      requestId,
      timestamp: new Date().toISOString()
    });

    // Generate auth link via Supabase Admin API
    const linkResult = await generateAuthLink({
      email,
      type,
      requestId
    });

    if (!linkResult.success || !linkResult.url) {
      console.error({
        event: 'resend_confirmation_link_failed',
        email,
        type,
        requestId,
        error: linkResult.error,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        {
          success: false,
          error: linkResult.error || 'Failed to generate confirmation link',
          requestId
        },
        { status: 500 }
      );
    }

    // Send email via Resend
    const emailSubject = type === 'signup' 
      ? 'アカウント登録の確認'
      : 'ログイン確認';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${emailSubject}</h2>
        <p>以下のボタンをクリックして${type === 'signup' ? 'アカウント登録を完了' : 'ログイン'}してください：</p>
        <div style="margin: 30px 0;">
          <a href="${linkResult.url}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            ${type === 'signup' ? '登録を完了する' : 'ログインする'}
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          このリンクは24時間有効です。<br>
          もしボタンが機能しない場合は、以下のURLを直接ブラウザにコピー＆ペーストしてください：<br>
          <span style="word-break: break-all;">${linkResult.url}</span>
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          このメールに心当たりがない場合は、このメールを無視してください。
          <br>Request ID: ${requestId}
        </p>
      </div>
    `;

    const emailResult = await sendHtmlEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml,
      requestId
    });

    if (!emailResult.success) {
      console.error({
        event: 'resend_confirmation_email_failed',
        email,
        type,
        requestId,
        error: emailResult.error,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || 'Failed to send confirmation email',
          requestId
        },
        { status: 500 }
      );
    }

    console.info({
      event: 'resend_confirmation_success',
      email,
      type,
      requestId,
      messageId: emailResult.messageId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: '確認メールを再送信しました',
      requestId,
      messageId: emailResult.messageId
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error({
      event: 'resend_confirmation_error',
      requestId,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        requestId
      },
      { status: 500 }
    );
  }
}