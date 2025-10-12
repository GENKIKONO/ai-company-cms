/**
 * 管理者ユーザー個別操作API - Node.js Runtime + Service Role
 * PATCH /api/admin/users/[id] - ユーザー情報更新
 * DELETE /api/admin/users/[id] - ユーザー削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { getServerUser, isAdmin } from '@/lib/auth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Supabase Admin Client (Service Role)
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ユーザー更新のバリデーションスキーマ
const updateUserSchema = z.object({
  role: z.enum(['admin', 'user']).optional(),
});

// PATCH: ユーザー情報更新
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // Authentication & Authorization
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
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

    // 自分自身の権限変更を防ぐ
    if (userId === user.id && validatedData.role && validatedData.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: '自分自身の管理者権限を削除することはできません'
        },
        { status: 403 }
      );
    }

    // Service Role Client
    const admin = createAdminClient();

    // Update user metadata via Admin API
    const { data: updatedUser, error: updateError } = await admin.auth.admin.updateUserById(
      userId,
      {
        app_metadata: {
          ...((await admin.auth.admin.getUserById(userId)).data.user?.app_metadata || {}),
          role: validatedData.role || 'user'
        }
      }
    );

    if (updateError) {
      console.error('Admin update error:', updateError);
      return NextResponse.json(
        {
          error: 'ADMIN_API_ERROR',
          message: 'ユーザー情報の更新に失敗しました。',
          detail: updateError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'ユーザー情報を更新しました。',
      user: {
        id: updatedUser.user.id,
        email: updatedUser.user.email,
        role: updatedUser.user.app_metadata?.role || 'user'
      },
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // Authentication & Authorization
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // 自分自身の削除を防ぐ
    if (userId === user.id) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: '自分自身を削除することはできません'
        },
        { status: 403 }
      );
    }

    // Service Role Client
    const admin = createAdminClient();

    // Delete user via Admin API
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Admin delete error:', deleteError);
      return NextResponse.json(
        {
          error: 'ADMIN_API_ERROR',
          message: 'ユーザーの削除に失敗しました。',
          detail: deleteError.message
        },
        { status: 500 }
      );
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