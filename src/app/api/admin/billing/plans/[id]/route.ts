/**
 * Plan Admin API - Individual
 * 個別プラン 取得/更新/削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { requireSiteAdmin, SiteAdminRequiredError } from '@/lib/billing';
import { writeAdminAuditLog, buildActionName, computeDiff } from '@/lib/admin/audit';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

// 更新用バリデーションスキーマ
const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['active', 'deprecated', 'draft']).optional(),
  sort_order: z.number().int().min(0).optional(),
  monthly_price: z.number().nullable().optional(),
  yearly_price: z.number().nullable().optional(),
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
      .from('plans')
      .select('id, name, slug, description, status, sort_order, monthly_price, yearly_price, stripe_price_id_monthly, stripe_price_id_yearly, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'プランが見つかりません', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      logger.error('[admin/billing/plans/[id]] GET error:', { data: error });
      return NextResponse.json(
        { error: 'プランの取得に失敗しました', code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof SiteAdminRequiredError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }
    logger.error('[admin/billing/plans/[id]] GET unexpected error:', { data: err });
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

    // 現在のユーザーと更新前のデータを取得（監査ログ用）
    const [user, { data: beforeData }] = await Promise.all([
      getUserWithClient(supabase),
      supabase.from('plans').select('id, name, slug, description, status, sort_order, monthly_price, yearly_price, stripe_price_id_monthly, stripe_price_id_yearly, created_at, updated_at').eq('id', id).single(),
    ]);

    const body = await request.json();
    const validated = updatePlanSchema.parse(body);

    // スラッグ変更時の重複チェック
    if (validated.slug) {
      const { data: existing } = await supabase
        .from('plans')
        .select('id')
        .eq('slug', validated.slug)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: 'このスラッグは既に使用されています', code: 'DUPLICATE_SLUG' },
          { status: 400 }
        );
      }
    }

    const updateData = {
      ...validated,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'プランが見つかりません', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      logger.error('[admin/billing/plans/[id]] PUT error:', { data: error });
      return NextResponse.json(
        { error: 'プランの更新に失敗しました', code: error.code },
        { status: 500 }
      );
    }

    // 監査ログを記録
    if (user && data) {
      const diff = computeDiff(beforeData, data);
      await writeAdminAuditLog(supabase, {
        actor_user_id: user.id,
        action: buildActionName('plan', 'update'),
        entity_type: 'plans',
        entity_id: id,
        before: diff.before,
        after: diff.after,
      });
    }

    return NextResponse.json({ data });
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
    logger.error('[admin/billing/plans/[id]] PUT unexpected error:', { data: err });
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    await requireSiteAdmin(supabase);

    // 現在のユーザーと削除前のデータを取得（監査ログ用）
    const [user, { data: beforeData }] = await Promise.all([
      getUserWithClient(supabase),
      supabase.from('plans').select('id, name, slug, description, status, sort_order, monthly_price, yearly_price, stripe_price_id_monthly, stripe_price_id_yearly, created_at, updated_at').eq('id', id).single(),
    ]);

    // 削除ではなく非推奨化を推奨（データ整合性のため）
    // 実際の削除が必要な場合はforce=trueパラメータで対応
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (!force) {
      // デフォルトは非推奨化
      const { data, error } = await supabase
        .from('plans')
        .update({
          status: 'deprecated',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'プランが見つかりません', code: 'NOT_FOUND' },
            { status: 404 }
          );
        }
        logger.error('[admin/billing/plans/[id]] DELETE (deprecate) error:', { data: error });
        return NextResponse.json(
          { error: 'プランの非推奨化に失敗しました', code: error.code },
          { status: 500 }
        );
      }

      // 監査ログを記録（非推奨化）
      if (user && data) {
        await writeAdminAuditLog(supabase, {
          actor_user_id: user.id,
          action: buildActionName('plan', 'disable'),
          entity_type: 'plans',
          entity_id: id,
          before: beforeData,
          after: data,
        });
      }

      return NextResponse.json({
        data,
        message: 'プランを非推奨化しました。完全に削除するには force=true を指定してください。',
      });
    }

    // 強制削除
    // アクティブなサブスクリプションがないかチェック
    const { data: activeSubscriptions } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('plan_id', id)
      .eq('status', 'active')
      .limit(1);

    if (activeSubscriptions && activeSubscriptions.length > 0) {
      return NextResponse.json(
        {
          error: 'アクティブなサブスクリプションがあるため削除できません',
          code: 'HAS_ACTIVE_SUBSCRIPTIONS',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('plans').delete().eq('id', id);

    if (error) {
      logger.error('[admin/billing/plans/[id]] DELETE error:', { data: error });
      return NextResponse.json(
        { error: 'プランの削除に失敗しました', code: error.code },
        { status: 500 }
      );
    }

    // 監査ログを記録（削除）
    if (user) {
      await writeAdminAuditLog(supabase, {
        actor_user_id: user.id,
        action: buildActionName('plan', 'delete'),
        entity_type: 'plans',
        entity_id: id,
        before: beforeData,
        after: null,
      });
    }

    return NextResponse.json({ message: 'プランを削除しました' });
  } catch (err) {
    if (err instanceof SiteAdminRequiredError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }
    logger.error('[admin/billing/plans/[id]] DELETE unexpected error:', { data: err });
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
