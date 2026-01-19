/**
 * Translation Metrics API
 * P4-3: 翻訳ジョブメトリクス・統計情報
 *
 * ⚠️ Requires site_admin authentication.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { getTranslationMetrics } from '@/lib/translation-client';
import { logger } from '@/lib/log';
import { handleApiError, handleDatabaseError } from '@/lib/api/error-responses';

export async function GET(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id') || undefined;

    const result = await getTranslationMetrics(organizationId);

    if (result.error) {
      logger.error('[Translation Metrics API] Failed to get metrics:', { data: result.error });
      return handleDatabaseError({ message: result.error, code: 'TRANSLATION_METRICS_ERROR' });
    }

    logger.debug('[Translation Metrics API] Metrics fetched:', {
      organization_id: organizationId,
      total_jobs: result.data?.total_jobs || 0
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      organization_id: organizationId
    });

  } catch (error) {
    logger.error('[Translation Metrics API] GET error:', {
      data: error instanceof Error ? error : new Error(String(error))
    });
    return handleApiError(error);
  }
}