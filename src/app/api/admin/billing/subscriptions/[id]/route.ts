/**
 * Subscription Admin API - Individual
 * 個別サブスクリプション管理
 *
 * GET: 詳細取得
 * PUT: 状態変更（キャンセル、一時停止、復帰等）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSiteAdmin, SiteAdminRequiredError } from '@/lib/billing';
import { z } from 'zod';

// 更新用バリデーションスキーマ
const updateSubscriptionSchema = z.object({
  action: z.enum(['cancel', 'pause', 'resume', 'change_plan', 'extend']),
  new_plan_id: z.string().uuid().optional(), // change_plan用
  ends_at: z.string().datetime().optional(), // extend用
  reason: z.string().optional(), // 監査用メモ
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    await requireSiteAdmin(supabase);

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:plans(id, name, slug, status, monthly_price, yearly_price),
        user:profiles(id, email, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'サブスクリプションが見つかりません', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[admin/billing/subscriptions/[id]] GET error:', error);
      return NextResponse.json(
        { error: 'サブスクリプションの取得に失敗しました', code: error.code },
        { status: 500 }
      );
    }

    // 履歴（同じユーザーの過去のサブスクリプション）も取得
    const { data: history } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        plan:plans(id, name, slug),
        status,
        starts_at,
        ends_at,
        canceled_at,
        created_at
      `)
      .eq('user_id', data.user_id)
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      data,
      history: history || [],
    });
  } catch (err) {
    if (err instanceof SiteAdminRequiredError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }
    console.error('[admin/billing/subscriptions/[id]] GET unexpected error:', err);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    await requireSiteAdmin(supabase);

    const body = await request.json();
    const validated = updateSubscriptionSchema.parse(body);

    // 現在のサブスクリプションを取得
    const { data: current, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json(
        { error: 'サブスクリプションが見つかりません', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    let updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    switch (validated.action) {
      case 'cancel':
        if (current.status === 'canceled') {
          return NextResponse.json(
            { error: '既にキャンセルされています', code: 'ALREADY_CANCELED' },
            { status: 400 }
          );
        }
        updateData.status = 'canceled';
        updateData.canceled_at = new Date().toISOString();
        break;

      case 'pause':
        if (current.status !== 'active') {
          return NextResponse.json(
            { error: 'アクティブなサブスクリプションのみ一時停止できます', code: 'INVALID_STATUS' },
            { status: 400 }
          );
        }
        updateData.status = 'paused';
        break;

      case 'resume':
        if (current.status !== 'paused') {
          return NextResponse.json(
            { error: '一時停止中のサブスクリプションのみ再開できます', code: 'INVALID_STATUS' },
            { status: 400 }
          );
        }
        updateData.status = 'active';
        break;

      case 'change_plan':
        if (!validated.new_plan_id) {
          return NextResponse.json(
            { error: '新しいプランIDが必要です', code: 'MISSING_PLAN_ID' },
            { status: 400 }
          );
        }

        // 新プラン存在確認
        const { data: newPlan, error: planError } = await supabase
          .from('plans')
          .select('id, status')
          .eq('id', validated.new_plan_id)
          .single();

        if (planError || !newPlan) {
          return NextResponse.json(
            { error: '指定されたプランが見つかりません', code: 'PLAN_NOT_FOUND' },
            { status: 404 }
          );
        }

        if (newPlan.status === 'deprecated') {
          return NextResponse.json(
            { error: '非推奨のプランには変更できません', code: 'PLAN_DEPRECATED' },
            { status: 400 }
          );
        }

        updateData.plan_id = validated.new_plan_id;
        break;

      case 'extend':
        if (!validated.ends_at) {
          return NextResponse.json(
            { error: '延長終了日が必要です', code: 'MISSING_ENDS_AT' },
            { status: 400 }
          );
        }
        updateData.ends_at = validated.ends_at;
        break;
    }

    const { data, error } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        plan:plans(id, name, slug)
      `)
      .single();

    if (error) {
      // EXCLUDE制約違反の場合
      if (error.code === '23P01') {
        return NextResponse.json(
          {
            error: 'サブスクリプションの期間が重複しています',
            code: 'SUBSCRIPTION_OVERLAP',
          },
          { status: 400 }
        );
      }
      console.error('[admin/billing/subscriptions/[id]] PUT error:', error);
      return NextResponse.json(
        { error: 'サブスクリプションの更新に失敗しました', code: error.code },
        { status: 500 }
      );
    }

    // TODO: 監査ログにアクション記録（将来拡張）
    // await logSubscriptionAction(id, validated.action, validated.reason);

    return NextResponse.json({
      data,
      action: validated.action,
      message: getActionMessage(validated.action),
    });
  } catch (err) {
    if (err instanceof SiteAdminRequiredError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが無効です', details: err.errors },
        { status: 400 }
      );
    }
    console.error('[admin/billing/subscriptions/[id]] PUT unexpected error:', err);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

function getActionMessage(action: string): string {
  switch (action) {
    case 'cancel':
      return 'サブスクリプションをキャンセルしました';
    case 'pause':
      return 'サブスクリプションを一時停止しました';
    case 'resume':
      return 'サブスクリプションを再開しました';
    case 'change_plan':
      return 'プランを変更しました';
    case 'extend':
      return 'サブスクリプションを延長しました';
    default:
      return '更新しました';
  }
}
