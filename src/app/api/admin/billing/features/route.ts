/**
 * Features Admin API
 * 機能管理 CRUD
 *
 * GET: 機能一覧取得
 * POST: 機能作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSiteAdmin, SiteAdminRequiredError } from '@/lib/billing';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

// バリデーションスキーマ
const createFeatureSchema = z.object({
  key: z.string().min(1, '機能キーは必須です').regex(/^[a-z0-9_]+$/, '機能キーは小文字英数字とアンダースコアのみ'),
  name: z.string().min(1, '機能名は必須です'),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  status: z.enum(['active', 'deprecated', 'draft']).default('draft'),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    await requireSiteAdmin(supabase);

    const { searchParams } = new URL(request.url);
    const includeDeprecated = searchParams.get('include_deprecated') === 'true';
    const category = searchParams.get('category');

    let query = supabase
      .from('features')
      .select('id, key, name, description, category, status, created_at, updated_at')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (!includeDeprecated) {
      query = query.neq('status', 'deprecated');
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[admin/billing/features] GET error:', { data: error });
      return NextResponse.json(
        { error: '機能一覧の取得に失敗しました', code: error.code },
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
    logger.error('[admin/billing/features] GET unexpected error:', { data: err });
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
    const validated = createFeatureSchema.parse(body);

    // キー重複チェック
    const { data: existing } = await supabase
      .from('features')
      .select('id')
      .eq('key', validated.key)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'この機能キーは既に使用されています', code: 'DUPLICATE_KEY' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('features')
      .insert({
        key: validated.key,
        name: validated.name,
        description: validated.description || null,
        category: validated.category || null,
        status: validated.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('[admin/billing/features] POST error:', { data: error });
      return NextResponse.json(
        { error: '機能の作成に失敗しました', code: error.code },
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
    logger.error('[admin/billing/features] POST unexpected error:', { data: err });
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
