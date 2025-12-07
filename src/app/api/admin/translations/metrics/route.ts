/**
 * Translation Metrics API
 * P4-3: 翻訳ジョブメトリクス・統計情報
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTranslationMetrics } from '@/lib/translation-client';
import { logger } from '@/lib/log';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id') || undefined;

    const result = await getTranslationMetrics(organizationId);

    if (result.error) {
      logger.error('[Translation Metrics API] Failed to get metrics:', { data: result.error });
      return NextResponse.json(
        { error: 'Failed to fetch translation metrics', details: result.error },
        { status: 500 }
      );
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
    
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}