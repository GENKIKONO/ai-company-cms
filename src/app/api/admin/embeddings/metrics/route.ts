/**
 * Embedding Metrics API
 * P4-4: Embedding パフォーマンス・統計情報取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmbeddingMetrics } from '@/lib/embedding-client';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
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
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}