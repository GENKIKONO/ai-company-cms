/**
 * /api/my/materials/[id] - 個別営業資料の管理API
 *
 * 【認証方式】
 * - createApiAuthClient を使用（統一認証ヘルパー）
 * - getUser() が唯一の Source of Truth
 * - Cookie 同期は applyCookies で行う
 *
 * @see src/lib/supabase/api-auth.ts
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';
import { logger } from '@/lib/utils/logger';

// GET - 指定されたIDの営業資料を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // UUIDフォーマットの検証
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return applyCookies(NextResponse.json({ error: 'Invalid material ID format' }, { status: 400 }));
    }

    // ユーザーの組織メンバーシップを取得
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError || !membership) {
      logger.error('[my/materials/[id]] Failed to fetch user membership', {
        userId: user.id,
        error: membershipError?.message
      });
      return applyCookies(NextResponse.json({
        error: 'NOT_FOUND',
        message: '組織が見つかりません'
      }, { status: 404 }));
    }

    const organizationId = membership.organization_id;

    // 営業資料の取得
    const { data: materials, error } = await supabase
      .from('sales_materials')
      .select('id, organization_id, title, description, file_path, mime_type, size_bytes, is_public, status, created_by, created_at')
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      logger.error('[my/materials/[id]] Failed to fetch material', {
        userId: user.id,
        materialId: id,
        error: error.message
      });
      return applyCookies(NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      ));
    }

    if (!materials || materials.length === 0) {
      return applyCookies(NextResponse.json({
        error: 'NOT_FOUND',
        message: '資料が見つかりません'
      }, { status: 404 }));
    }

    return applyCookies(NextResponse.json({ data: materials[0] }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[GET /api/my/materials/[id]] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
