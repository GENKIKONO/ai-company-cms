/**
 * 管理者代理FAQ作成・編集API - Node.js Runtime + Service Role
 * POST /api/admin/proxy/[userId]/faqs - 指定ユーザーの代理でFAQ作成
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

// FAQ作成スキーマ
const faqCreateSchema = z.object({
  question: z.string().min(1, '質問は必須です'),
  answer: z.string().min(1, '回答は必須です'),
  category: z.string().optional(),
  order_index: z.number().optional().default(0),
  is_published: z.boolean().optional().default(false),
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
      validatedData = faqCreateSchema.parse(rawBody);
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

    // 2. FAQデータの作成
    const faqData = {
      question: validatedData.question,
      answer: validatedData.answer,
      category: validatedData.category,
      order_index: validatedData.order_index,
      is_published: validatedData.is_published,
      metadata: validatedData.metadata,
      organization_id: targetOrg.id,
      admin_notes: validatedData.admin_notes ? 
        `Created by admin: ${validatedData.admin_notes}` : 
        'Created by admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: faq, error: createError } = await admin
      .from('faqs')
      .insert([faqData])
      .select()
      .single();

    if (createError) {
      console.error('FAQ creation error:', createError);
      return NextResponse.json(
        {
          error: 'CREATE_FAILED',
          message: createError.message
        },
        { status: 500 }
      );
    }

    // 3. 操作ログを記録
    await logAdminAction(admin, {
      adminUserId: user.id,
      adminEmail: user.email,
      targetUserId: userId,
      action: 'create',
      contentType: 'faq',
      contentId: faq.id,
      reason: validatedData.admin_notes,
      organizationId: targetOrg.id,
      organizationName: targetOrg.name,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'FAQが正常に作成されました',
      data: faq
    });

  } catch (error) {
    console.error('Admin proxy FAQ creation error:', error);
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