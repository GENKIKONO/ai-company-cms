/**
 * 管理者ユーザー個別操作API
 * PATCH /api/admin/users/[id] - ユーザー情報更新
 * DELETE /api/admin/users/[id] - ユーザー削除
 * 
 * 機能:
 * - ユーザー権限の変更
 * - ユーザーアカウントの削除
 * - 管理者権限チェック
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 管理者権限チェック関数
async function checkAdminPermission(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'UNAUTHORIZED', message: 'ログインが必要です', status: 401 };
  }

  // 管理者権限チェック
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || !userData || userData.role !== 'admin') {
    return { error: 'FORBIDDEN', message: '管理者権限が必要です', status: 403 };
  }

  return { user, userData };
}

// ユーザー更新のバリデーションスキーマ
const updateUserSchema = z.object({
  role: z.enum(['admin', 'user']).optional(),
});

// PATCH: ユーザー情報更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Supabaseクライアント初期化
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );

    // 管理者権限チェック
    const authResult = await checkAdminPermission(supabase);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, message: authResult.message },
        { status: authResult.status }
      );
    }

    const userId = params.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // リクエスト本文の取得とバリデーション
    const rawBody = await request.json();
    
    let validatedData;
    try {
      validatedData = updateUserSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: error.errors[0].message,
            details: error.errors
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // ユーザーの存在確認
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: '指定されたユーザーが見つかりません'
        },
        { status: 404 }
      );
    }

    // 自分自身の権限変更を防ぐ
    if (userId === authResult.user.id && validatedData.role && validatedData.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: '自分自身の管理者権限を削除することはできません'
        },
        { status: 403 }
      );
    }

    // 更新データを準備
    const updatePayload = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    // データベース更新
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: 'ユーザー情報の更新に失敗しました。'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'ユーザー情報を更新しました。',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Admin user PATCH API error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました。'
      },
      { status: 500 }
    );
  }
}

// DELETE: ユーザー削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Supabaseクライアント初期化
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );

    // 管理者権限チェック
    const authResult = await checkAdminPermission(supabase);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, message: authResult.message },
        { status: authResult.status }
      );
    }

    const userId = params.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // 自分自身の削除を防ぐ
    if (userId === authResult.user.id) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: '自分自身を削除することはできません'
        },
        { status: 403 }
      );
    }

    // ユーザーの存在確認
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: '指定されたユーザーが見つかりません'
        },
        { status: 404 }
      );
    }

    // データベースからユーザーを削除
    const { error: dbDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (dbDeleteError) {
      console.error('Database delete error:', dbDeleteError);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: 'ユーザーデータの削除に失敗しました。'
        },
        { status: 500 }
      );
    }

    // Supabase Authからユーザーを削除
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('Auth delete error:', authDeleteError);
      // Auth削除に失敗してもDBは削除済みなので警告のみ
      console.warn('User deleted from database but auth deletion failed:', authDeleteError);
    }

    return NextResponse.json({
      message: 'ユーザーを削除しました。',
      deleted_user_id: userId,
    });

  } catch (error) {
    console.error('Admin user DELETE API error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました。'
      },
      { status: 500 }
    );
  }
}