/**
 * Admin Embeddings API
 * P4-4: Embedding ジョブ管理API
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  enqueueEmbeddingJobServer,
  drainEmbeddingJobsServer,
  enqueueOrganizationEmbeddingsServer,
  type EmbeddingJobRequest
} from '@/server/embedding-admin-client';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'enqueue': {
        const { job } = body;
        if (!job) {
          return NextResponse.json({
            success: false,
            message: 'Embedding job data required'
          }, { status: 400 });
        }

        const result = await enqueueEmbeddingJobServer(job);
        return NextResponse.json(result);
      }

      case 'drain': {
        const drainParams = {
          organization_id: body.organization_id,
          batch_size: body.batch_size || 5,
          diff_strategy: body.diff_strategy || 'content_hash' as const,
          priority_min: body.priority_min,
          priority_max: body.priority_max
        };

        if (!drainParams.organization_id) {
          return NextResponse.json({
            success: false,
            message: 'Missing organization_id for drain operation'
          }, { status: 400 });
        }

        const result = await drainEmbeddingJobsServer(drainParams);
        return NextResponse.json(result);
      }

      case 'bulk_enqueue': {
        const { 
          organization_id, 
          content_types = ['posts', 'services', 'faqs', 'case_studies', 'products'],
          priority = 5 
        } = body;

        if (!organization_id) {
          return NextResponse.json({
            success: false,
            message: 'Organization ID required'
          }, { status: 400 });
        }

        const result = await enqueueOrganizationEmbeddingsServer(
          organization_id,
          content_types,
          priority
        );
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({
          success: false,
          message: `Unknown action: ${action}`
        }, { status: 400 });
    }
  } catch (error) {
    logger.error('[Admin Embeddings API] Error:', { data: error });
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}