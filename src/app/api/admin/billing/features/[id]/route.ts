/**
 * Feature Admin API - Individual
 * 個別機能 取得/更新/削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSiteAdmin, SiteAdminRequiredError } from '@/lib/billing';
import { z } from 'zod';

// 更新用バリデーションスキーマ
const updateFeatureSchema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9_]+$/).optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  status: z.enum(['active', 'deprecated', 'draft']).optional(),
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
      .from('features')
      .select('id, key, name, description, category, status, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '機能が見つかりません', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[admin/billing/features/[id]] GET error:', error);
      return NextResponse.json(
        { error: '機能の取得に失敗しました', code: error.code },
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
    console.error('[admin/billing/features/[id]] GET unexpected error:', err);
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
    const validated = updateFeatureSchema.parse(body);

    // キー変更時の重複チェック
    if (validated.key) {
      const { data: existing } = await supabase
        .from('features')
        .select('id')
        .eq('key', validated.key)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: 'この機能キーは既に使用されています', code: 'DUPLICATE_KEY' },
          { status: 400 }
        );
      }
    }

    const updateData = {
      ...validated,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('features')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '機能が見つかりません', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[admin/billing/features/[id]] PUT error:', error);
      return NextResponse.json(
        { error: '機能の更新に失敗しました', code: error.code },
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
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが無効です', details: err.errors },
        { status: 400 }
      );
    }
    console.error('[admin/billing/features/[id]] PUT unexpected error:', err);
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

    // デフォルトは非推奨化
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (!force) {
      const { data, error } = await supabase
        .from('features')
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
            { error: '機能が見つかりません', code: 'NOT_FOUND' },
            { status: 404 }
          );
        }
        console.error('[admin/billing/features/[id]] DELETE (deprecate) error:', error);
        return NextResponse.json(
          { error: '機能の非推奨化に失敗しました', code: error.code },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data,
        message: '機能を非推奨化しました。完全に削除するには force=true を指定してください。',
      });
    }

    // 強制削除
    const { error } = await supabase.from('features').delete().eq('id', id);

    if (error) {
      console.error('[admin/billing/features/[id]] DELETE error:', error);
      return NextResponse.json(
        { error: '機能の削除に失敗しました', code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: '機能を削除しました' });
  } catch (err) {
    if (err instanceof SiteAdminRequiredError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }
    console.error('[admin/billing/features/[id]] DELETE unexpected error:', err);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
