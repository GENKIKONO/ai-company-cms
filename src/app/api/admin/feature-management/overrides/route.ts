/* eslint-disable no-console */
/**
 * Organization Feature Overrides API
 * 組織別機能オーバーライド（Phase 2実装予定）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAuthError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

// GET - 組織別オーバーライド一覧取得（現在は空実装）
export async function GET() {
  try {
    const supabase = await createClient();
    
    // 管理者認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    // Phase 2で実装予定
    return NextResponse.json({
      message: 'Organization feature overrides will be implemented in Phase 2',
      overrides: [],
      features_available: false,
    });

  } catch (error) {
    const errorId = generateErrorId('get-feature-overrides');
    logger.error('[GET /api/admin/feature-management/overrides] Unexpected error:', { data: { errorId, error } });
    return createInternalError(errorId);
  }
}

// POST - 組織別オーバーライド作成/更新（現在は空実装）
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 管理者認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    // Phase 2で実装予定
    return NextResponse.json({
      error: 'Not implemented',
      message: 'Organization feature overrides will be implemented in Phase 2',
    }, { status: 501 });

  } catch (error) {
    const errorId = generateErrorId('post-feature-overrides');
    logger.error('[POST /api/admin/feature-management/overrides] Unexpected error:', { data: { errorId, error } });
    return createInternalError(errorId);
  }
}