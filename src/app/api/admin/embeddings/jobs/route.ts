/**
 * Embedding Jobs API
 * P4-4: Embedding ジョブ一覧・詳細取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmbeddingJobs, getEmbeddings } from '@/lib/embedding-client';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'jobs'; // 'jobs' or 'embeddings'
    
    if (type === 'embeddings') {
      // Embedding一覧取得
      const filter = {
        organization_id: searchParams.get('organization_id') || undefined,
        source_table: searchParams.get('source_table') || undefined,
        source_id: searchParams.get('source_id') || undefined,
        is_active: searchParams.get('is_active') === 'true' ? true : 
                   searchParams.get('is_active') === 'false' ? false : undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
      };

      const result = await getEmbeddings(filter);
      
      if (result.error) {
        return NextResponse.json({
          success: false,
          message: result.error
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        total: result.total
      });

    } else {
      // ジョブ一覧取得
      const filter = {
        organization_id: searchParams.get('organization_id') || undefined,
        source_table: searchParams.get('source_table') || undefined,
        source_field: searchParams.get('source_field') || undefined,
        status: (searchParams.get('status') as 'pending' | 'processing' | 'completed' | 'failed' | null) || undefined,
        priority_min: searchParams.get('priority_min') ? parseInt(searchParams.get('priority_min')!) : undefined,
        priority_max: searchParams.get('priority_max') ? parseInt(searchParams.get('priority_max')!) : undefined,
        created_after: searchParams.get('created_after') || undefined,
        created_before: searchParams.get('created_before') || undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
      };

      const result = await getEmbeddingJobs(filter);
      
      if (result.error) {
        return NextResponse.json({
          success: false,
          message: result.error
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        total: result.total
      });
    }

  } catch (error) {
    logger.error('[Embedding Jobs API] Error:', { data: error });
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}