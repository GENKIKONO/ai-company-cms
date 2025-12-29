/**
 * 営業資料取得API (個別)
 * 指定されたIDの営業資料を取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { createAuthError, createNotFoundError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';
import { validateOrgAccess, OrgAccessError } from '@/lib/utils/org-access';

export const dynamic = 'force-dynamic';

// GET - 指定されたIDの営業資料を取得
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 認証チェック（Core経由）
    const user = await getUserWithClient(supabase);
    if (!user) {
      return createAuthError();
    }

    // UUIDフォーマットの検証
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid material ID format' }, { status: 400 });
    }

    // ユーザーの組織IDを取得
    const { data: userProfiles, error: profileError } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('id', user.id);

    if (profileError) {
      logger.error('[my/materials/[id]] Failed to fetch user profile', { data: profileError });
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    const userProfile = userProfiles?.[0];
    if (!userProfile?.organization_id) {
      return createNotFoundError('Organization not found');
    }

    const organizationId = userProfile.organization_id;

    // validateOrgAccessでメンバーシップ確認
    try {
      await validateOrgAccess(organizationId, user.id, 'read');
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return NextResponse.json({ 
          error: error.code, 
          message: error.message 
        }, { status: error.statusCode });
      }
      return NextResponse.json({ 
        error: 'INTERNAL_ERROR', 
        message: 'メンバーシップ確認に失敗しました' 
      }, { status: 500 });
    }

    // 営業資料の取得
    const { data: materials, error } = await supabase
      .from('sales_materials')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      logger.error('[my/materials/[id]] Database error', { data: error });
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    if (!materials || materials.length === 0) {
      return createNotFoundError('Material not found or access denied');
    }

    return NextResponse.json({ data: materials[0] });

  } catch (error) {
    const errorId = generateErrorId('get-material-by-id');
    logger.error('[GET /api/my/materials/[id]] Unexpected error:', { data: { errorId, error } });
    return createInternalError(errorId);
  }
}