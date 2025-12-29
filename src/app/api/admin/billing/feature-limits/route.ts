/**
 * Feature Limits Admin API
 * 機能制限値管理 CRUD
 *
 * GET: 制限一覧取得
 * POST: 制限作成
 * PUT: 一括更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSiteAdmin, SiteAdminRequiredError } from '@/lib/billing';
import { z } from 'zod';

// バリデーションスキーマ
const createLimitSchema = z.object({
  plan_id: z.string().uuid(),
  feature_id: z.string().uuid(),
  limit_key: z.string().min(1, '制限キーは必須です'),
  limit_value: z.number(),
  period: z.enum(['monthly', 'yearly', 'lifetime']).nullable().optional(),
  reset_day: z.number().int().min(1).max(31).nullable().optional(),
});

const bulkUpdateSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      limit_key: z.string().min(1).optional(),
      limit_value: z.number().optional(),
      period: z.enum(['monthly', 'yearly', 'lifetime']).nullable().optional(),
      reset_day: z.number().int().min(1).max(31).nullable().optional(),
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
      .from('feature_limits_v2')
      .select(`
        *,
        plan:plans(id, name, slug),
        feature:features(id, key, name, category)
      `)
      .order('plan_id', { ascending: true })
      .order('feature_id', { ascending: true });

    if (planId) {
      query = query.eq('plan_id', planId);
    }

    if (featureId) {
      query = query.eq('feature_id', featureId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[admin/billing/feature-limits] GET error:', error);
      return NextResponse.json(
        { error: '制限一覧の取得に失敗しました', code: error.code },
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
    console.error('[admin/billing/feature-limits] GET unexpected error:', err);
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
    const validated = createLimitSchema.parse(body);

    // 重複チェック（plan_id + feature_id + limit_keyで一意）
    const { data: existing } = await supabase
      .from('feature_limits_v2')
      .select('id')
      .eq('plan_id', validated.plan_id)
      .eq('feature_id', validated.feature_id)
      .eq('limit_key', validated.limit_key)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'この制限キーは既に存在します', code: 'DUPLICATE_LIMIT' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('feature_limits_v2')
      .insert({
        plan_id: validated.plan_id,
        feature_id: validated.feature_id,
        limit_key: validated.limit_key,
        limit_value: validated.limit_value,
        period: validated.period || null,
        reset_day: validated.reset_day || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        plan:plans(id, name, slug),
        feature:features(id, key, name)
      `)
      .single();

    if (error) {
      console.error('[admin/billing/feature-limits] POST error:', error);
      return NextResponse.json(
        { error: '制限の作成に失敗しました', code: error.code },
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
    console.error('[admin/billing/feature-limits] POST unexpected error:', err);
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

      const { data, error } = await supabase
        .from('feature_limits_v2')
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
    console.error('[admin/billing/feature-limits] PUT unexpected error:', err);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    await requireSiteAdmin(supabase);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'IDが指定されていません', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('feature_limits_v2')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[admin/billing/feature-limits] DELETE error:', error);
      return NextResponse.json(
        { error: '制限の削除に失敗しました', code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: '制限を削除しました' });
  } catch (err) {
    if (err instanceof SiteAdminRequiredError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }
    console.error('[admin/billing/feature-limits] DELETE unexpected error:', err);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
