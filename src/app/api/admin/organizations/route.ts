/**
 * Admin Organizations API
 * P4-3/P4-4: 組織一覧取得（翻訳・Embedding一括処理用）
 *
 * ⚠️ Requires site_admin authentication.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { handleApiError, handleDatabaseError } from '@/lib/api/error-responses';

export async function GET(request: NextRequest) {
  // 管理者認証チェック（必須）
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('is_published', true)
      .order('name', { ascending: true });

    if (error) {
      logger.error('[Admin Organizations API] Database error', {
        userId: authResult.userId,
        error: { code: error.code, message: error.message }
      });
      return handleDatabaseError(error);
    }

    logger.debug('[Admin Organizations API] Fetched organizations', {
      userId: authResult.userId,
      count: organizations?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: organizations || []
    });

  } catch (error) {
    logger.error('[Admin Organizations API] Unexpected error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return handleApiError(error);
  }
}
