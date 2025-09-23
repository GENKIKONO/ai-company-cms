import { NextRequest, NextResponse } from 'next/server';
<<<<<<< HEAD
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
=======
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

>>>>>>> release/p0-freeze
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

<<<<<<< HEAD
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password-confirm`;

    // Send password reset email using Supabase
    const admin = supabaseAdmin();
    const { error } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error('Reset password error:', error);
      
      // Handle specific Supabase errors
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: '送信制限に達しました。しばらく時間をおいてからお試しください。', 
            code: 'rate_limited',
            retryAfter: 60
          },
          { status: 429 }
        );
      }
      
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { success: true },
=======
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
>>>>>>> release/p0-freeze
        { status: 200 }
      );
    }

<<<<<<< HEAD
=======
    // Note: We now rely on Supabase built-in email delivery
    // The link generation will trigger Supabase's own email system
    console.info('Password reset link generated', {
      email: email.replace(/(..).*(@.*)/, '$1***$2'),
      redirectTo: `${APP_URL}/auth/reset-password-confirm`,
      requestId: linkResult.requestId
    });

>>>>>>> release/p0-freeze
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