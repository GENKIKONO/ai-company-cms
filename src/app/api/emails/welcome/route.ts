import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowserAdmin } from '@/lib/supabase-server';
import { sendWelcomeEmail } from '@/lib/emails';

export async function POST(request: NextRequest) {
  try {
    const { email, userName } = await request.json();

    if (!email || !userName) {
      return NextResponse.json(
        { error: 'メールアドレスとユーザー名が必要です' },
        { status: 400 }
      );
    }

    // Resendでウェルカムメールを送信
    const result = await sendWelcomeEmail(email, userName);

    if (!result.success) {
      console.error('Failed to send welcome email:', result.error);
      return NextResponse.json(
        { error: 'ウェルカムメールの送信に失敗しました' },
        { status: 500 }
      );
    }

    // メール送信ログをデータベースに記録（任意）
    const supabaseBrowser = supabaseBrowserAdmin();
    try {
      await supabaseBrowser
        .from('email_logs')
        .insert({
          email,
          type: 'welcome',
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider: 'resend',
          metadata: { resend_id: result.data?.id }
        });
      console.log('Email log recorded');
    } catch (err) {
      console.warn('Failed to log email:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'ウェルカムメールを送信しました',
      emailId: result.data?.id
    });

  } catch (error) {
    console.error('Welcome email API error:', error);
    return NextResponse.json(
      { error: 'ウェルカムメールの送信に失敗しました' },
      { status: 500 }
    );
  }
}