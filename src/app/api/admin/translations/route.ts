/**
 * Translation Jobs Management API
 * P4-3: 翻訳ジョブの管理・操作
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getTranslationJobs, 
  getTranslationMetrics,
  type TranslationJobFilter
} from '@/lib/translation-client';
import {
  enqueueTranslationJobServer,
  drainTranslationJobsServer,
  enqueueOrganizationTranslationsServer,
  calculateContentHash,
  type TranslationJobRequest
} from '@/server/translation-admin-client';
import { logger } from '@/lib/log';

// GET: 翻訳ジョブ一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // フィルタパラメータ解析
    const filter: TranslationJobFilter = {
      organization_id: searchParams.get('organization_id') || undefined,
      source_table: searchParams.get('source_table') || undefined,
      source_field: searchParams.get('source_field') || undefined,
      source_lang: searchParams.get('source_lang') || undefined,
      target_lang: searchParams.get('target_lang') || undefined,
      status: (searchParams.get('status') as 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | null) || undefined,
      priority_min: searchParams.get('priority_min') ? parseInt(searchParams.get('priority_min')!) : undefined,
      priority_max: searchParams.get('priority_max') ? parseInt(searchParams.get('priority_max')!) : undefined,
      created_after: searchParams.get('created_after') || undefined,
      created_before: searchParams.get('created_before') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    const result = await getTranslationJobs(filter);
    
    if (result.error) {
      logger.error('[Translation API] Failed to get jobs:', { data: result.error });
      return NextResponse.json(
        { error: 'Failed to fetch translation jobs', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      filter
    });

  } catch (error) {
    logger.error('[Translation API] GET error:', { 
      data: error instanceof Error ? error : new Error(String(error)) 
    });
    
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST: 翻訳ジョブ操作
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'enqueue': {
        // 個別ジョブ投入
        const jobRequest: TranslationJobRequest = {
          organization_id: body.organization_id,
          source_table: body.source_table,
          source_id: body.source_id,
          source_field: body.source_field,
          source_lang: body.source_lang || 'ja',
          target_lang: body.target_lang,
          source_text: body.source_text,
          content_hash: await calculateContentHash(body.source_text),
          priority: body.priority || 5
        };

        // バリデーション
        if (!jobRequest.organization_id || !jobRequest.source_table || 
            !jobRequest.source_id || !jobRequest.source_field || 
            !jobRequest.target_lang || !jobRequest.source_text) {
          return NextResponse.json(
            { error: 'Missing required fields for translation job' },
            { status: 400 }
          );
        }

        const result = await enqueueTranslationJobServer(jobRequest);

        if (!result.success) {
          logger.error('[Translation API] Enqueue failed:', { data: result.message });
          return NextResponse.json(
            { error: 'Failed to enqueue translation job', details: result.message },
            { status: 500 }
          );
        }

        logger.info('[Translation API] Job enqueued:', { 
          job_id: result.job_id,
          organization_id: jobRequest.organization_id,
          target_lang: jobRequest.target_lang
        });

        return NextResponse.json({
          success: true,
          job_id: result.job_id,
          message: result.message
        });
      }

      case 'drain': {
        // バッチ処理実行
        const drainParams = {
          organization_id: body.organization_id,
          batch_size: body.batch_size || 10,
          diff_strategy: body.diff_strategy || 'content_hash' as const,
          priority_min: body.priority_min,
          priority_max: body.priority_max
        };

        if (!drainParams.organization_id) {
          return NextResponse.json(
            { error: 'Missing organization_id for drain operation' },
            { status: 400 }
          );
        }

        const result = await drainTranslationJobsServer(drainParams);

        if (!result.success) {
          logger.error('[Translation API] Drain failed:', { data: result.message });
          return NextResponse.json(
            { error: 'Failed to process translation jobs', details: result.message },
            { status: 500 }
          );
        }

        logger.info('[Translation API] Jobs processed:', { 
          processed_count: result.processed_count,
          job_run_id: result.job_run_id
        });

        return NextResponse.json({
          success: true,
          processed_count: result.processed_count,
          skipped_count: result.skipped_count,
          failed_count: result.failed_count,
          job_run_id: result.job_run_id,
          message: result.message
        });
      }

      case 'bulk_enqueue': {
        // 組織コンテンツ一括翻訳
        const {
          organization_id,
          target_languages,
          content_types,
          priority = 5
        } = body;

        if (!organization_id || !target_languages || !Array.isArray(target_languages)) {
          return NextResponse.json(
            { error: 'Missing organization_id or target_languages' },
            { status: 400 }
          );
        }

        const result = await enqueueOrganizationTranslationsServer(
          organization_id,
          target_languages,
          content_types,
          priority
        );

        if (!result.success) {
          logger.error('[Translation API] Bulk enqueue failed:', { data: result.message });
          return NextResponse.json(
            { error: 'Failed to enqueue bulk translation', details: result.message },
            { status: 500 }
          );
        }

        logger.info('[Translation API] Bulk enqueue completed:', {
          organization_id,
          target_languages,
          enqueued_count: result.enqueued_count
        });

        return NextResponse.json({
          success: true,
          enqueued_count: result.enqueued_count,
          message: result.message
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: enqueue, drain, bulk_enqueue' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('[Translation API] POST error:', { 
      data: error instanceof Error ? error : new Error(String(error)) 
    });
    
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}