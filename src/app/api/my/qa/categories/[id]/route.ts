/**
 * /api/my/qa/categories/[id] - QAカテゴリ個別操作（取得・更新・削除）
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(req);

    // ユーザーの企業IDを取得（単一組織モード）
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError || !organization) {
      return applyCookies(NextResponse.json({ error: 'User organization not found' }, { status: 400 }));
    }

    // 組織アクセス権限チェック（validate_org_access RPC使用）
    try {
      await validateOrgAccess(organization.id, user.id);
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return applyCookies(NextResponse.json({
          error: error.code,
          message: error.message
        }, { status: error.statusCode }));
      }

      logger.error('[my/qa/categories/[id]] GET Unexpected org access validation error', {
        userId: user.id,
        organizationId: organization.id,
        error: error instanceof Error ? error.message : error
      });
      return applyCookies(NextResponse.json({
        error: 'INTERNAL_ERROR',
        message: 'メンバーシップ確認に失敗しました'
      }, { status: 500 }));
    }

    const { data: category, error } = await supabase
      .from('qa_categories')
      .select('id, organization_id, name, slug, description, visibility, sort_order, is_active, created_at, updated_at, created_by, updated_by')
      .eq('id', id)
      .or(`organization_id.eq.${organization.id},visibility.eq.global`)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return applyCookies(NextResponse.json({ error: 'Category not found' }, { status: 404 }));
      }
      logger.error('Error fetching category', { data: error instanceof Error ? error : new Error(String(error)) });
      return applyCookies(NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 }));
    }

    return applyCookies(NextResponse.json({ data: category }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }
    logger.error('Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(req);

    // ユーザーの企業IDを取得（単一組織モード）
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError || !organization) {
      return applyCookies(NextResponse.json({ error: 'User organization not found' }, { status: 400 }));
    }

    // 組織アクセス権限チェック（validate_org_access RPC使用）
    try {
      await validateOrgAccess(organization.id, user.id);
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return applyCookies(NextResponse.json({
          error: error.code,
          message: error.message
        }, { status: error.statusCode }));
      }

      logger.error('[my/qa/categories/[id]] PUT Unexpected org access validation error', {
        userId: user.id,
        organizationId: organization.id,
        error: error instanceof Error ? error.message : error
      });
      return applyCookies(NextResponse.json({
        error: 'INTERNAL_ERROR',
        message: 'メンバーシップ確認に失敗しました'
      }, { status: 500 }));
    }

    // Check if category exists and user has access
    const { data: existingCategory, error: fetchError } = await supabase
      .from('qa_categories')
      .select('id, organization_id, name, slug, description, visibility, sort_order, is_active, created_at, updated_at, created_by, updated_by')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .eq('visibility', 'org')
      .maybeSingle();

    if (fetchError || !existingCategory) {
      return applyCookies(NextResponse.json({ error: 'Category not found or access denied' }, { status: 404 }));
    }

    const body: QACategoryFormData = await req.json();

    if (!body.name?.trim() || !body.slug?.trim()) {
      return applyCookies(NextResponse.json({ error: 'Name and slug are required' }, { status: 400 }));
    }

    const updateData = {
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: body.description?.trim() || null,
      sort_order: body.sort_order ?? existingCategory.sort_order,
      is_active: body.is_active ?? existingCategory.is_active,
      updated_by: user.id
    };

    const { data: category, error } = await supabase
      .from('qa_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return applyCookies(NextResponse.json({ error: 'Category slug already exists' }, { status: 409 }));
      }
      logger.error('Error updating category', { data: error instanceof Error ? error : new Error(String(error)) });
      return applyCookies(NextResponse.json({ error: 'Failed to update category' }, { status: 500 }));
    }

    // Log the update
    await supabase
      .from('qa_content_logs')
      .insert({
        organization_id: organization.id,
        category_id: id,
        action: 'category_update',
        actor_user_id: user.id,
        changes: {
          before: existingCategory,
          after: updateData
        },
        metadata: { ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown", user_agent: req.headers.get('user-agent') }
      });

    return applyCookies(NextResponse.json({ data: category }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }
    logger.error('Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(req);

    // ユーザーの企業IDを取得（単一組織モード）
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError || !organization) {
      return applyCookies(NextResponse.json({ error: 'User organization not found' }, { status: 400 }));
    }

    // 組織アクセス権限チェック（validate_org_access RPC使用）
    try {
      await validateOrgAccess(organization.id, user.id);
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return applyCookies(NextResponse.json({
          error: error.code,
          message: error.message
        }, { status: error.statusCode }));
      }

      logger.error('[my/qa/categories/[id]] DELETE Unexpected org access validation error', {
        userId: user.id,
        organizationId: organization.id,
        error: error instanceof Error ? error.message : error
      });
      return applyCookies(NextResponse.json({
        error: 'INTERNAL_ERROR',
        message: 'メンバーシップ確認に失敗しました'
      }, { status: 500 }));
    }

    // Check if category exists and user has access
    const { data: existingCategory, error: fetchError } = await supabase
      .from('qa_categories')
      .select('id, organization_id, name, slug, description, visibility, sort_order, is_active, created_at, updated_at, created_by, updated_by')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .eq('visibility', 'org')
      .maybeSingle();

    if (fetchError || !existingCategory) {
      return applyCookies(NextResponse.json({ error: 'Category not found or access denied' }, { status: 404 }));
    }

    // Check if category has associated Q&A entries
    const { data: entries, error: entriesError } = await supabase
      .from('qa_entries')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (entriesError) {
      logger.error('Error checking entries:', { data: entriesError });
      return applyCookies(NextResponse.json({ error: 'Failed to check category usage' }, { status: 500 }));
    }

    if (entries && entries.length > 0) {
      return applyCookies(NextResponse.json({
        error: 'Cannot delete category with associated Q&A entries'
      }, { status: 409 }));
    }

    const { error } = await supabase
      .from('qa_categories')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting category', { data: error instanceof Error ? error : new Error(String(error)) });
      return applyCookies(NextResponse.json({ error: 'Failed to delete category' }, { status: 500 }));
    }

    // Log the deletion
    await supabase
      .from('qa_content_logs')
      .insert({
        organization_id: organization.id,
        category_id: id,
        action: 'category_delete',
        actor_user_id: user.id,
        changes: { deleted: existingCategory },
        metadata: { ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown", user_agent: req.headers.get('user-agent') }
      });

    return applyCookies(NextResponse.json({ message: 'Category deleted successfully' }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }
    logger.error('Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
