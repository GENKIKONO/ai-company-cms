/**
 * Embedding Metrics API
 * P4-4: Embedding パフォーマンス・統計情報取得
 *
 * ⚠️ Requires site_admin authentication.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { getEmbeddingMetrics } from '@/lib/embedding-client';
import { logger } from '@/lib/utils/logger';
import { handleApiError, handleDatabaseError } from '@/lib/api/error-responses';

export async function GET(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organization_id') || undefined;

    const result = await getEmbeddingMetrics(organizationId);
    
    if (result.error) {
      return NextResponse.json({
        success: false,
        message: result.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    logger.error('[Embedding Metrics API] Error:', { data: error });
    return handleApiError(error);
  }
}