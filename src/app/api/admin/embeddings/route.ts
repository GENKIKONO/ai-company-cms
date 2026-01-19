/**
 * Admin Embeddings API
 * P4-4: Embedding ジョブ管理API
 *
 * ⚠️ Requires site_admin authentication.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import {
  enqueueEmbeddingJobServer,
  drainEmbeddingJobsServer,
  enqueueOrganizationEmbeddingsServer,
  type EmbeddingJobRequest
} from '@/server/embedding-admin-client';
import { logger } from '@/lib/utils/logger';
import { handleApiError, validationError } from '@/lib/api/error-responses';

export async function POST(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'enqueue': {
        const { job } = body;
        if (!job) {
          return validationError([
            { field: 'job', message: 'Embedding job data required' }
          ]);
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
          return validationError([
            { field: 'organization_id', message: 'Missing organization_id for drain operation' }
          ]);
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
          return validationError([
            { field: 'organization_id', message: 'Organization ID required' }
          ]);
        }

        const result = await enqueueOrganizationEmbeddingsServer(
          organization_id,
          content_types,
          priority
        );
        return NextResponse.json(result);
      }

      default:
        return validationError([
          { field: 'action', message: `Unknown action: ${action}` }
        ]);
    }
  } catch (error) {
    logger.error('[Admin Embeddings API] Error:', { data: error });
    return handleApiError(error);
  }
}