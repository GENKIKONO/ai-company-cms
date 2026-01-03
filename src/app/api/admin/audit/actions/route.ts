/**
 * Admin Audit Actions API
 *
 * GET /api/admin/audit/actions - ops_audit の distinct アクション一覧を取得
 *
 * Response規約:
 *   成功: { success: true, data, meta? }
 *   失敗: { success: false, error_code, message }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { ok, err, ErrorCodes } from '@/lib/api/response';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 管理者認証ガード
    const authResult = await requireAdmin();
    if (!isAuthorized(authResult)) {
      return authResult.response;
    }

    const supabase = await createClient();

    // Distinctアクション取得
    const { data, error } = await supabase
      .from('ops_audit')
      .select('action')
      .order('action');

    if (error) {
      logger.error('Actions query error:', { data: error });
      return NextResponse.json(
        err(ErrorCodes.QUERY_ERROR, error.message),
        { status: 500 }
      );
    }

    // ユニークなアクションを抽出
    const uniqueActions = [...new Set(data?.map(d => d.action) || [])];

    return NextResponse.json(ok({ actions: uniqueActions }));
  } catch (e) {
    logger.error('Actions API error:', { data: e });
    return NextResponse.json(
      err(ErrorCodes.INTERNAL_ERROR, e instanceof Error ? e.message : 'Internal server error'),
      { status: 500 }
    );
  }
}
