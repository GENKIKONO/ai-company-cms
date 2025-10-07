/**
 * 管理者用通報更新API
 * PATCH /api/admin/reports/[id]
 * 
 * 機能:
 * - 管理者が通報ステータスを更新
 * - 対応メモの追加
 * - 対応履歴の記録
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import {
  requireAuth,
  requireAdminAccess,
  type AuthContext
} from '@/lib/api/auth-middleware';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 更新データのバリデーションスキーマ
const updateReportSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'resolved', 'dismissed']),
  admin_notes: z.string().max(1000, '対応メモは1000文字以内で入力してください').optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    // 認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // 管理者権限チェック
    const adminCheck = requireAdminAccess(authResult as AuthContext);
    if (adminCheck) {
      return adminCheck;
    }

    const { id } = resolvedParams;
    if (!id) {
      return NextResponse.json(
        {
          error: 'INVALID_PARAMS',
          message: '通報IDが指定されていません'
        },
        { status: 400 }
      );
    }

    // リクエストボディの検証
    const rawBody = await request.json();
    let validatedData;
    
    try {
      validatedData = updateReportSchema.parse(rawBody);
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

    // Supabaseクライアント初期化
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_KEY,
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

    // 通報が存在するかチェック
    const { data: existingReport, error: fetchError } = await supabase
      .from('reports')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingReport) {
      return NextResponse.json(
        {
          error: 'REPORT_NOT_FOUND',
          message: '指定された通報が見つかりません'
        },
        { status: 404 }
      );
    }

    // 更新データ準備
    const updateData: any = {
      status: validatedData.status,
      updated_at: new Date().toISOString(),
    };

    // ステータスが変更された場合、対応者情報を記録
    if (existingReport.status !== validatedData.status) {
      updateData.reviewed_by = (authResult as AuthContext).user.id;
      updateData.reviewed_at = new Date().toISOString();
    }

    // 管理者メモが提供されている場合
    if (validatedData.admin_notes !== undefined) {
      updateData.admin_notes = validatedData.admin_notes;
    }

    // 通報を更新
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: '通報の更新に失敗しました'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: '通報を更新しました',
        report: updatedReport,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Admin report update API error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました'
      },
      { status: 500 }
    );
  }
}