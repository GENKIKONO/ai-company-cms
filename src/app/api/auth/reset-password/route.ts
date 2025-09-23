import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
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
        { status: 200 }
      );
    }

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