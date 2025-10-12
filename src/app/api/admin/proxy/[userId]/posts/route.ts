/**
 * 管理者代理投稿作成・編集API - Node.js Runtime + Service Role
 * POST /api/admin/proxy/[userId]/posts - 指定ユーザーの代理で投稿作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { getServerUser, isAdmin } from '@/lib/auth/server';
import { normalizePostPayload, validateSlug } from '@/lib/utils/data-normalization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Supabase Admin Client (Service Role)
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// 投稿作成スキーマ
const postCreateSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  slug: z.string().min(1, 'スラッグは必須です'),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  is_published: z.boolean().optional().default(false),
  featured_image: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  admin_notes: z.string().optional() // 管理者による作成理由
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.userId;

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
      validatedData = postCreateSchema.parse(rawBody);
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

    // slugバリデーション
    const slugValidation = validateSlug(validatedData.slug);
    if (!slugValidation.isValid) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: slugValidation.error
        },
        { status: 400 }
      );
    }

    // Service Role Client
    const admin = createAdminClient();

    // 1. ターゲットユーザーの組織を取得
    const { data: targetOrg, error: orgError } = await admin
      .from('organizations')
      .select('id, name, plan')
      .eq('created_by', userId)
      .single();

    if (orgError || !targetOrg) {
      return NextResponse.json(
        {
          error: 'USER_ORG_NOT_FOUND',
          message: '指定されたユーザーの組織が見つかりません'
        },
        { status: 404 }
      );
    }

    // 2. 同じ組織内でのslugの重複チェック
    const { data: slugCheck } = await admin
      .from('posts')
      .select('id')
      .eq('organization_id', targetOrg.id)
      .eq('slug', validatedData.slug)
      .single();

    if (slugCheck) {
      return NextResponse.json(
        {
          error: 'CONFLICT_ERROR',
          message: 'このスラッグは既に使用されています'
        },
        { status: 409 }
      );
    }

    // 3. データの正規化
    const normalizedData = normalizePostPayload({
      title: validatedData.title,
      slug: validatedData.slug,
      content: validatedData.content || '',
      excerpt: validatedData.excerpt,
      is_published: validatedData.is_published,
      featured_image: validatedData.featured_image,
      tags: validatedData.tags,
      metadata: validatedData.metadata
    });

    // 4. 投稿データの作成
    const postData = {
      ...normalizedData,
      organization_id: targetOrg.id,
      admin_notes: validatedData.admin_notes ? 
        `Created by admin: ${validatedData.admin_notes}` : 
        'Created by admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: post, error: createError } = await admin
      .from('posts')
      .insert([postData])
      .select()
      .single();

    if (createError) {
      console.error('Post creation error:', createError);
      
      // 制約違反の場合
      if (createError.code === '23505') {
        if (createError.message.includes('unique_posts_slug_per_org')) {
          return NextResponse.json(
            {
              error: 'CONFLICT_ERROR',
              message: 'このスラッグは既に使用されています'
            },
            { status: 409 }
          );
        }
      }
      
      return NextResponse.json(
        {
          error: 'CREATE_FAILED',
          message: createError.message
        },
        { status: 500 }
      );
    }

    // 5. 操作ログを記録
    await logAdminAction(admin, {
      adminUserId: user.id,
      adminEmail: user.email,
      targetUserId: userId,
      action: 'create',
      contentType: 'post',
      contentId: post.id,
      reason: validatedData.admin_notes,
      organizationId: targetOrg.id,
      organizationName: targetOrg.name,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: '投稿が正常に作成されました',
      data: post
    });

  } catch (error) {
    console.error('Admin proxy post creation error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました。'
      },
      { status: 500 }
    );
  }
}

// 管理者操作ログの記録
async function logAdminAction(admin: any, logData: any): Promise<void> {
  try {
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