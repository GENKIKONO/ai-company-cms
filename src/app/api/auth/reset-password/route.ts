import { NextRequest, NextResponse } from 'next/server';
import { generateAuthLink } from '@/lib/auth/generate-link';
import { sendHtmlEmail } from '@/lib/email/resend-client';
import { APP_URL } from '@/lib/utils/env';

export async function POST(request: NextRequest) {
  // Production safety guard
  if (process.env.NODE_ENV === 'production' && APP_URL.includes('localhost')) {
    return NextResponse.json(
      { error: 'Configuration error - localhost detected in production', code: 'config_error' },
      { status: 500 }
    );
  }

  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'メールアドレスが必要です', code: 'validation_error' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'メールアドレスの形式が正しくありません', code: 'validation_error' },
        { status: 400 }
      );
    }

    // Generate password reset link using unified auth link generation
    const linkResult = await generateAuthLink({
      email,
      type: 'recovery',
      requestId: crypto.randomUUID()
    });

    if (!linkResult.success || !linkResult.url) {
      console.error('Password reset link generation failed:', linkResult.error);
      return NextResponse.json(
        { success: true }, // Don't reveal if email exists for security
        { status: 200 }
      );
    }

    // Note: We now rely on Supabase built-in email delivery
    // The link generation will trigger Supabase's own email system
    console.info('Password reset link generated', {
      email: email.replace(/(..).*(@.*)/, '$1***$2'),
      redirectTo: `${APP_URL}/auth/reset-password-confirm`,
      requestId: linkResult.requestId
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'システムエラーが発生しました', code: 'internal_error' },
      { status: 500 }
    );
  }
}