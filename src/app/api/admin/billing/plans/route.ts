/**
 * Plans Admin API
 * プラン管理 CRUD
 *
 * GET: プラン一覧取得
 * POST: プラン作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { requireSiteAdmin, SiteAdminRequiredError } from '@/lib/billing';
import { writeAdminAuditLog, buildActionName } from '@/lib/admin/audit';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

// バリデーションスキーマ
const createPlanSchema = z.object({
  name: z.string().min(1, 'プラン名は必須です'),
  slug: z.string().min(1, 'スラッグは必須です').regex(/^[a-z0-9-]+$/, 'スラッグは小文字英数字とハイフンのみ'),
  description: z.string().nullable().optional(),
  status: z.enum(['active', 'deprecated', 'draft']).default('draft'),
  sort_order: z.number().int().min(0).default(0),
  monthly_price: z.number().nullable().optional(),
  yearly_price: z.number().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    await requireSiteAdmin(supabase);

    const { searchParams } = new URL(request.url);
    const includeDeprecated = searchParams.get('include_deprecated') === 'true';

    let query = supabase
      .from('plans')
      .select('id, name, slug, description, status, sort_order, monthly_price, yearly_price, stripe_price_id_monthly, stripe_price_id_yearly, created_at, updated_at')
      .order('sort_order', { ascending: true });

    if (!includeDeprecated) {
      query = query.neq('status', 'deprecated');
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[admin/billing/plans] GET error:', { data: error });
      return NextResponse.json(
        { error: 'プラン一覧の取得に失敗しました', code: error.code },
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
    logger.error('[admin/billing/plans] GET unexpected error:', { data: err });
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
    const validated = createPlanSchema.parse(body);

    // スラッグ重複チェック
    const { data: existing } = await supabase
      .from('plans')
      .select('id')
      .eq('slug', validated.slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'このスラッグは既に使用されています', code: 'DUPLICATE_SLUG' },
        { status: 400 }
      );
    }

    // 現在のユーザーを取得（監査ログ用）
    const user = await getUserWithClient(supabase);

    const { data, error } = await supabase
      .from('plans')
      .insert({
        name: validated.name,
        slug: validated.slug,
        description: validated.description || null,
        status: validated.status,
        sort_order: validated.sort_order,
        monthly_price: validated.monthly_price || null,
        yearly_price: validated.yearly_price || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('[admin/billing/plans] POST error:', { data: error });
      return NextResponse.json(
        { error: 'プランの作成に失敗しました', code: error.code },
        { status: 500 }
      );
    }

    // 監査ログを記録
    if (user && data) {
      await writeAdminAuditLog(supabase, {
        actor_user_id: user.id,
        action: buildActionName('plan', 'create'),
        entity_type: 'plans',
        entity_id: data.id,
        before: null,
        after: data,
      });
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
    logger.error('[admin/billing/plans] POST unexpected error:', { data: err });
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
