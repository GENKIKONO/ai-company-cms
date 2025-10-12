/**
 * 管理者プラン変更API - Node.js Runtime + Service Role
 * PUT /api/admin/users/[id]/plan - 指定ユーザーのプランを管理者権限で変更
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

// プラン変更スキーマ
const planChangeSchema = z.object({
  plan: z.enum(['free', 'standard', 'enterprise', 'basic', 'pro']),
  admin_notes: z.string().optional(),
  override_reason: z.string().min(1, '変更理由は必須です'),
  trial_expires_at: z.string().optional() // 体験版期限
});

export async function PUT(
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
      validatedData = planChangeSchema.parse(rawBody);
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

    const { plan, admin_notes, override_reason, trial_expires_at } = validatedData;

    // Service Role Client
    const admin = createAdminClient();

    // 1. ユーザーの組織を取得
    const { data: organization, error: orgError } = await admin
      .from('organizations')
      .select('id, name, plan, created_by')
      .eq('created_by', userId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        {
          error: 'USER_ORG_NOT_FOUND',
          message: '指定されたユーザーの組織が見つかりません'
        },
        { status: 404 }
      );
    }

    const previousPlan = organization.plan || 'free';

    // 2. プラン変更を実行
    const updateData = {
      plan: plan,
      admin_plan_override: true,
      admin_plan_notes: admin_notes ? 
        `${override_reason} - ${admin_notes}` : 
        override_reason,
      admin_plan_changed_by: user.id,
      admin_plan_changed_at: new Date().toISOString(),
      trial_expires_at: trial_expires_at || null,
      updated_at: new Date().toISOString()
    };

    const { data: updatedOrg, error: updateError } = await admin
      .from('organizations')
      .update(updateData)
      .eq('id', organization.id)
      .select()
      .single();

    if (updateError) {
      console.error('Plan update error:', updateError);
      return NextResponse.json(
        {
          error: 'UPDATE_FAILED',
          message: updateError.message
        },
        { status: 500 }
      );
    }

    // 3. 操作ログを記録
    await logPlanChangeAction(admin, {
      adminUserId: user.id,
      adminEmail: user.email,
      targetUserId: userId,
      organizationId: organization.id,
      organizationName: organization.name,
      previousPlan,
      newPlan: plan,
      overrideReason: override_reason,
      adminNotes: admin_notes,
      trialExpiresAt: trial_expires_at,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'プランが正常に変更されました',
      data: {
        organizationId: organization.id,
        organizationName: organization.name,
        previousPlan,
        newPlan: plan,
        adminOverride: true,
        trialExpiresAt: trial_expires_at
      }
    });

  } catch (error) {
    console.error('Admin plan change error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました。'
      },
      { status: 500 }
    );
  }
}

// プラン変更ログの記録
async function logPlanChangeAction(admin: any, logData: any): Promise<void> {
  try {
    const planChangeLog = {
      admin_user_id: logData.adminUserId,
      admin_email: logData.adminEmail,
      target_user_id: logData.targetUserId,
      organization_id: logData.organizationId,
      organization_name: logData.organizationName,
      action: 'plan_change',
      previous_plan: logData.previousPlan,
      new_plan: logData.newPlan,
      override_reason: logData.overrideReason,
      admin_notes: logData.adminNotes,
      trial_expires_at: logData.trialExpiresAt,
      timestamp: logData.timestamp
    };

    // admin_logs テーブルがあれば記録
    const { error } = await admin
      .from('admin_logs')
      .insert([planChangeLog]);

    if (error) {
      // テーブルが存在しない場合はコンソールログで代替
      console.log('Plan Change Admin Log:', JSON.stringify(planChangeLog, null, 2));
    }
  } catch (error) {
    // ログ記録失敗は無視してコンソールに出力
    console.log('Plan Change Admin Log (fallback):', JSON.stringify(logData, null, 2));
  }
}