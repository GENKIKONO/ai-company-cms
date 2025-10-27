import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '現在のパスワードを入力してください'),
  newPassword: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  confirmPassword: z.string().min(1, 'パスワード確認を入力してください'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "新しいパスワードが一致しません",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 認証状態確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'ログインが必要です' },
        { status: 401 }
      );
    }

    // リクエストボディの検証
    const body = await request.json();
    const validationResult = changePasswordSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          message: 'パスワード変更に失敗しました',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validationResult.data;

    // 現在のパスワードでサインインして検証
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { 
          error: 'Invalid current password',
          message: '現在のパスワードが正しくありません'
        },
        { status: 400 }
      );
    }

    // パスワード更新
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      logger.error('Password update error:', updateError);
      return NextResponse.json(
        { 
          error: 'Update failed',
          message: 'パスワードの更新に失敗しました'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'パスワードが正常に変更されました'
    });

  } catch (error) {
    logger.error('Change password error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'サーバーエラーが発生しました'
      },
      { status: 500 }
    );
  }
}