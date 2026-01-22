/**
 * /api/my/qa/categories - QAカテゴリ一覧取得・新規作成
 * 【認証方式】
 * - createApiAuthClient を使用（統一認証ヘルパー）
 * - getUser() が唯一の Source of Truth
 * - Cookie 同期は applyCookies で行う
 * @see src/lib/supabase/api-auth.ts
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';

import type { QACategoryFormData } from '@/types/domain/qa-system';
import { logger } from '@/lib/utils/logger';
import { validateOrgAccess, OrgAccessError } from '@/lib/utils/org-access';

export async function GET(req: NextRequest) {
  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(req);

    // organizationId クエリパラメータ必須チェック（他のAPIと統一）
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      logger.debug('[my/qa/categories] organizationId parameter required');
      return applyCookies(NextResponse.json({ error: 'organizationId parameter is required' }, { status: 400 }));
    }


    // validateOrgAccessでメンバーシップ確認
    try {
      await validateOrgAccess(organizationId, user.id, 'read');
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return applyCookies(NextResponse.json({
          error: error.code,
          message: error.message
        }, { status: error.statusCode }));
      }
      return applyCookies(NextResponse.json({
        error: 'INTERNAL_ERROR',
        message: 'メンバーシップ確認に失敗しました'
      }, { status: 500 }));
    }

    // 対象テーブル単体＋organization_idフィルタで取得
    const { data: categories, error } = await supabase
      .from('qa_categories')
      .select('id, organization_id, name, slug, description, visibility, sort_order, is_active, created_at, updated_at, created_by, updated_by')
      .or(`organization_id.eq.${organizationId},visibility.eq.global`)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      logger.error('[QA_CATEGORIES_DEBUG] supabase error', {
        data: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        }
      });
      return applyCookies(NextResponse.json({
        error: 'Failed to fetch categories',
        message: error.message,
        details: error.details
      }, { status: 500 }));
    }

    return applyCookies(NextResponse.json({ data: categories }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }
    logger.error('Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(req);

    const body: QACategoryFormData & { organizationId?: string } = await req.json();

    // organizationId 必須チェック（他のAPIと統一）
    if (!body.organizationId) {
      logger.debug('[my/qa/categories] POST organizationId required');
      return applyCookies(NextResponse.json({ error: 'organizationId is required' }, { status: 400 }));
    }

    // validateOrgAccessでメンバーシップ確認
    try {
      await validateOrgAccess(body.organizationId, user.id, 'write');
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return applyCookies(NextResponse.json({
          error: error.code,
          message: error.message
        }, { status: error.statusCode }));
      }
      return applyCookies(NextResponse.json({
        error: 'INTERNAL_ERROR',
        message: 'メンバーシップ確認に失敗しました'
      }, { status: 500 }));
    }

    if (!body.name?.trim() || !body.slug?.trim()) {
      return applyCookies(NextResponse.json({ error: 'Name and slug are required' }, { status: 400 }));
    }

    const categoryData = {
      organization_id: body.organizationId,
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: body.description?.trim() || null,
      visibility: 'org' as const,
      sort_order: body.sort_order || 0,
      is_active: body.is_active ?? true,
      created_by: user.id,
      updated_by: user.id
    };

    const { data: category, error } = await supabase
      .from('qa_categories')
      .insert(categoryData)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return applyCookies(NextResponse.json({ error: 'Category slug already exists' }, { status: 409 }));
      }
      logger.error('Error creating category', { data: error instanceof Error ? error : new Error(String(error)) });
      return applyCookies(NextResponse.json({ error: 'Failed to create category' }, { status: 500 }));
    }

    // .maybeSingle()はデータなしでもerrorにならないため明示的null分岐
    if (!category) {
      logger.error('Error creating category: no data returned from insert');
      return applyCookies(NextResponse.json({ error: 'Failed to create category' }, { status: 500 }));
    }

    // Log the creation
    await supabase
      .from('qa_content_logs')
      .insert({
        organization_id: body.organizationId,
        category_id: category.id,
        action: 'category_create',
        actor_user_id: user.id,
        changes: { created: categoryData },
        metadata: { ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown", user_agent: req.headers.get('user-agent') }
      });

    return applyCookies(NextResponse.json({ data: category }, { status: 201 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }
    logger.error('Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
