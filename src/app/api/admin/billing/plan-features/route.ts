/**
 * Plan-Features Admin API
 * プラン×機能割当管理
 *
 * GET: 割当一覧取得
 * POST: 割当作成/更新（upsert）
 * PUT: 一括更新（display_order等）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSiteAdmin, SiteAdminRequiredError } from '@/lib/billing';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

// バリデーションスキーマ
const upsertPlanFeatureSchema = z.object({
  plan_id: z.string().uuid(),
  feature_id: z.string().uuid(),
  is_enabled: z.boolean().default(false),
  is_required: z.boolean().default(false),
  display_order: z.number().int().min(0).default(0),
  default_config: z.record(z.unknown()).default({}),
});

const bulkUpdateSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      is_enabled: z.boolean().optional(),
      is_required: z.boolean().optional(),
      display_order: z.number().int().min(0).optional(),
      default_config: z.record(z.unknown()).optional(),
    })
  ),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    await requireSiteAdmin(supabase);

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('plan_id');
    const featureId = searchParams.get('feature_id');

    let query = supabase
      .from('plan_features_v2')
      .select(`
        *,
        plan:plans(id, name, slug, status),
        feature:features(id, key, name, category, status)
      `)
      .order('display_order', { ascending: true });

    if (planId) {
      query = query.eq('plan_id', planId);
    }

    if (featureId) {
      query = query.eq('feature_id', featureId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[admin/billing/plan-features] GET error:', { data: error });
      return NextResponse.json(
        { error: '割当一覧の取得に失敗しました', code: error.code },
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
    logger.error('[admin/billing/plan-features] GET unexpected error:', { data: err });
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
    const validated = upsertPlanFeatureSchema.parse(body);

    // default_configのJSON検証
    try {
      JSON.stringify(validated.default_config);
    } catch {
      return NextResponse.json(
        { error: 'default_configが不正なJSONです', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    // Upsert（plan_id + feature_idで一意）
    const { data, error } = await supabase
      .from('plan_features_v2')
      .upsert(
        {
          plan_id: validated.plan_id,
          feature_id: validated.feature_id,
          is_enabled: validated.is_enabled,
          is_required: validated.is_required,
          display_order: validated.display_order,
          default_config: validated.default_config,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'plan_id,feature_id',
        }
      )
      .select(`
        *,
        plan:plans(id, name, slug),
        feature:features(id, key, name)
      `)
      .single();

    if (error) {
      logger.error('[admin/billing/plan-features] POST error:', { data: error });
      return NextResponse.json(
        { error: '割当の保存に失敗しました', code: error.code },
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
    logger.error('[admin/billing/plan-features] POST unexpected error:', { data: err });
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    await requireSiteAdmin(supabase);

    const body = await request.json();
    const validated = bulkUpdateSchema.parse(body);

    const results = [];
    const errors = [];

    for (const update of validated.updates) {
      const { id, ...updateData } = update;

      // default_configがある場合はJSON検証
      if (updateData.default_config) {
        try {
          JSON.stringify(updateData.default_config);
        } catch {
          errors.push({ id, error: 'invalid_json' });
          continue;
        }
      }

      const { data, error } = await supabase
        .from('plan_features_v2')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        errors.push({ id, error: error.code });
      } else {
        results.push(data);
      }
    }

    return NextResponse.json({
      updated: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
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
    logger.error('[admin/billing/plan-features] PUT unexpected error:', { data: err });
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
