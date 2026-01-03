/**
 * User Subscriptions Admin API
 * サブスクリプション管理
 *
 * GET: サブスクリプション一覧/履歴取得
 * POST: 新規サブスクリプション作成（管理者による手動付与）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSiteAdmin, SiteAdminRequiredError } from '@/lib/billing';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

// バリデーションスキーマ
const createSubscriptionSchema = z.object({
  user_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  status: z.enum(['active', 'trialing']).default('active'),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  org_id: z.string().uuid().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    await requireSiteAdmin(supabase);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    const planId = searchParams.get('plan_id');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('user_subscriptions')
      .select(
        `
        *,
        plan:plans(id, name, slug, status),
        user:profiles(id, email, name)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (planId) {
      query = query.eq('plan_id', planId);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('[admin/billing/subscriptions] GET error:', { data: error });
      return NextResponse.json(
        { error: 'サブスクリプション一覧の取得に失敗しました', code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      total: count,
      limit,
      offset,
    });
  } catch (err) {
    if (err instanceof SiteAdminRequiredError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }
    logger.error('[admin/billing/subscriptions] GET unexpected error:', { data: err });
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    await requireSiteAdmin(supabase);

    const body = await request.json();
    const validated = createSubscriptionSchema.parse(body);

    // ユーザー存在確認
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', validated.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: '指定されたユーザーが見つかりません', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // プラン存在確認
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, status')
      .eq('id', validated.plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: '指定されたプランが見つかりません', code: 'PLAN_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (plan.status === 'deprecated') {
      return NextResponse.json(
        { error: '非推奨のプランは割り当てできません', code: 'PLAN_DEPRECATED' },
        { status: 400 }
      );
    }

    // アクティブなサブスクリプションの重複チェック（EXCLUDE制約に対応）
    const { data: existingActive } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', validated.user_id)
      .eq('status', 'active')
      .maybeSingle();

    if (existingActive && validated.status === 'active') {
      return NextResponse.json(
        {
          error: 'このユーザーには既にアクティブなサブスクリプションがあります',
          code: 'ACTIVE_SUBSCRIPTION_EXISTS',
          existing_id: existingActive.id,
        },
        { status: 400 }
      );
    }

    const startsAt = validated.starts_at || new Date().toISOString();

    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: validated.user_id,
        plan_id: validated.plan_id,
        status: validated.status,
        starts_at: startsAt,
        ends_at: validated.ends_at || null,
        org_id: validated.org_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
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
      logger.error('[admin/billing/subscriptions] POST error:', { data: error });
      return NextResponse.json(
        { error: 'サブスクリプションの作成に失敗しました', code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
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
    logger.error('[admin/billing/subscriptions] POST unexpected error:', { data: err });
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
