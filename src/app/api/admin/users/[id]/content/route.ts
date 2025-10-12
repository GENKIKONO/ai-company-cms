/**
 * 管理者ユーザーコンテンツ操作API - Node.js Runtime + Service Role
 * POST /api/admin/users/[id]/content - ユーザーコンテンツの操作（公開/非公開/削除）
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

// 操作スキーマ
const contentActionSchema = z.object({
  action: z.enum(['publish', 'unpublish', 'delete', 'suspend']),
  contentType: z.enum(['organization', 'service', 'post', 'case_study', 'faq']),
  contentId: z.string(),
  reason: z.string().optional() // 管理者による操作理由
});

export async function POST(
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
      validatedData = contentActionSchema.parse(rawBody);
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

    const { action, contentType, contentId, reason } = validatedData;

    // Service Role Client
    const admin = createAdminClient();

    // 1. コンテンツの所有権確認
    const isOwned = await verifyContentOwnership(admin, userId, contentType, contentId);
    if (!isOwned) {
      return NextResponse.json(
        {
          error: 'CONTENT_NOT_FOUND',
          message: '指定されたコンテンツが見つからないか、このユーザーの所有ではありません'
        },
        { status: 404 }
      );
    }

    // 2. アクションを実行
    const result = await executeContentAction(admin, action, contentType, contentId, reason);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'ACTION_FAILED',
          message: result.message
        },
        { status: 500 }
      );
    }

    // 3. 操作ログを記録
    await logAdminAction(admin, {
      adminUserId: user.id,
      adminEmail: user.email,
      targetUserId: userId,
      action,
      contentType,
      contentId,
      reason,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'コンテンツ操作が完了しました',
      action,
      contentType,
      contentId,
      result: result.data
    });

  } catch (error) {
    console.error('Admin content action API error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました。'
      },
      { status: 500 }
    );
  }
}

// コンテンツの所有権確認
async function verifyContentOwnership(
  admin: any,
  userId: string,
  contentType: string,
  contentId: string
): Promise<boolean> {
  try {
    switch (contentType) {
      case 'organization':
        const { data: org } = await admin
          .from('organizations')
          .select('id')
          .eq('id', contentId)
          .eq('created_by', userId)
          .single();
        return !!org;

      case 'service':
      case 'post':
      case 'case_study':
      case 'faq':
        // まず組織IDを取得
        const { data: userOrg } = await admin
          .from('organizations')
          .select('id')
          .eq('created_by', userId)
          .single();

        if (!userOrg) return false;

        const tableName = contentType === 'case_study' ? 'case_studies' : `${contentType}s`;
        const { data: content } = await admin
          .from(tableName)
          .select('id')
          .eq('id', contentId)
          .eq('organization_id', userOrg.id)
          .single();
        return !!content;

      default:
        return false;
    }
  } catch (error) {
    console.error('Ownership verification error:', error);
    return false;
  }
}

// コンテンツアクションの実行
async function executeContentAction(
  admin: any,
  action: string,
  contentType: string,
  contentId: string,
  reason?: string
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const tableName = contentType === 'case_study' ? 'case_studies' : 
                     contentType === 'organization' ? 'organizations' : 
                     `${contentType}s`;

    let updateData: any = {};

    switch (action) {
      case 'publish':
        updateData = {
          is_published: true,
          status: 'published'
        };
        break;

      case 'unpublish':
        updateData = {
          is_published: false,
          status: 'draft'
        };
        break;

      case 'suspend':
        updateData = {
          is_published: false,
          status: 'suspended',
          admin_notes: reason ? `Suspended by admin: ${reason}` : 'Suspended by admin'
        };
        break;

      case 'delete':
        // ソフトデリート
        updateData = {
          is_published: false,
          status: 'archived',
          admin_notes: reason ? `Deleted by admin: ${reason}` : 'Deleted by admin'
        };
        break;

      default:
        return { success: false, message: 'Invalid action' };
    }

    // タイムスタンプ追加
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await admin
      .from(tableName)
      .update(updateData)
      .eq('id', contentId)
      .select()
      .single();

    if (error) {
      console.error('Content action error:', error);
      return { success: false, message: error.message };
    }

    return { 
      success: true, 
      message: `Content ${action} completed successfully`,
      data 
    };

  } catch (error) {
    console.error('Execute content action error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 管理者操作ログの記録
async function logAdminAction(admin: any, logData: any): Promise<void> {
  try {
    // admin_logs テーブルがあれば記録、なければコンソールに出力
    const { error } = await admin
      .from('admin_logs')
      .insert([logData]);

    if (error) {
      // テーブルが存在しない場合はコンソールログで代替
      console.log('Admin Action Log:', JSON.stringify(logData, null, 2));
    }
  } catch (error) {
    // ログ記録失敗は無視してコンソールに出力
    console.log('Admin Action Log (fallback):', JSON.stringify(logData, null, 2));
  }
}