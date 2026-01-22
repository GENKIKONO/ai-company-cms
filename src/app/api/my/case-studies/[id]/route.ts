/**
 * /api/my/case-studies/[id] - 個別事例の管理API
 *
 * 【認証方式】
 * - createApiAuthClient を使用（統一認証ヘルパー）
 * - getUser() が唯一の Source of Truth
 * - Cookie 同期は applyCookies で行う
 *
 * @see src/lib/supabase/api-auth.ts
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';
import type { CaseStudyFormData } from '@/types/domain/content';
import { normalizeCaseStudyPayload } from '@/lib/utils/data-normalization';
import {
  validateFilesForPublish,
  extractImageUrlsFromCaseStudy,
} from '@/lib/file-scan';
import { logger } from '@/lib/utils/logger';

// GET - 個別事例を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    const { data, error } = await supabase
      .from('case_studies')
      .select('id, organization_id, service_id, title, slug, client_name, client_industry, client_size, challenge, solution, outcome, testimonial, images, is_published, created_by, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return applyCookies(NextResponse.json(
          { error: 'Not Found', message: 'Case study not found' },
          { status: 404 }
        ));
      }
      logger.error('[my/case-studies/[id]] Failed to fetch case study', {
        userId: user.id,
        caseStudyId: id,
        error: error.message
      });
      return applyCookies(NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      ));
    }

    if (!data) {
      return applyCookies(NextResponse.json(
        { error: 'NOT_FOUND', message: '事例が見つかりません' },
        { status: 404 }
      ));
    }

    // Map database 'outcome' field to frontend 'result' field for consistency
    const mappedData = {
      ...data,
      result: data.outcome,
      outcome: undefined
    };

    return applyCookies(NextResponse.json({ data: mappedData }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[GET /api/my/case-studies/[id]] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT - 事例を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    const body: Partial<CaseStudyFormData> & { organizationId?: string } = await request.json();
    const { organizationId, ...restBody } = body;

    // 存在確認 + RLS チェック（created_by を含む）
    const { data: existingCaseStudy, error: fetchError } = await supabase
      .from('case_studies')
      .select('id, organization_id, created_by, is_published, featured_image, thumbnail_url, image_url, images')
      .eq('id', id)
      .eq('created_by', user.id)
      .maybeSingle();

    if (fetchError) {
      logger.error('[my/case-studies/[id]] Failed to fetch case study for update', {
        userId: user.id,
        caseStudyId: id,
        error: fetchError.message
      });
      return applyCookies(NextResponse.json(
        { error: 'Database error', message: fetchError.message },
        { status: 500 }
      ));
    }

    if (!existingCaseStudy) {
      return applyCookies(NextResponse.json(
        { error: 'Not Found', message: 'Case study not found or access denied' },
        { status: 404 }
      ));
    }

    // organizationId が指定されている場合は、既存レコードの organization_id と一致するかチェック
    if (organizationId && existingCaseStudy.organization_id !== organizationId) {
      return applyCookies(NextResponse.json(
        { error: 'Validation error', message: 'Cannot change organization of existing case study' },
        { status: 400 }
      ));
    }

    // データを正規化
    const normalizedData = normalizeCaseStudyPayload(restBody);
    const updateData: Record<string, unknown> = {
      ...normalizedData,
      updated_at: new Date().toISOString(),
    };

    // 公開時のファイルスキャンバリデーション
    const isBecomingPublished =
      (updateData.is_published === true && existingCaseStudy.is_published !== true);

    if (isBecomingPublished) {
      const mergedData = { ...existingCaseStudy, ...updateData };
      const imageUrls = extractImageUrlsFromCaseStudy(mergedData as Record<string, unknown>);

      if (imageUrls.length > 0) {
        const scanResult = await validateFilesForPublish(supabase, imageUrls);

        if (!scanResult.valid) {
          logger.warn('[my/case-studies/[id]] File scan validation failed for publish', {
            userId: user.id,
            caseStudyId: id,
            failedPaths: scanResult.failedPaths,
          });
          return applyCookies(NextResponse.json({
            error: 'ファイルのスキャンが完了していないため公開できません',
            code: 'FILE_SCAN_VALIDATION_FAILED',
            failedPaths: scanResult.failedPaths,
          }, { status: 422 }));
        }
      }
    }

    const { data, error } = await supabase
      .from('case_studies')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      logger.error('[my/case-studies/[id]] Failed to update case study', {
        userId: user.id,
        caseStudyId: id,
        error: error.message
      });

      // RLS エラーの場合は 403 を返す
      if (error.code === '42501' || error.message?.includes('RLS')) {
        return applyCookies(NextResponse.json({
          error: 'RLS_FORBIDDEN',
          message: 'Row Level Security によって拒否されました'
        }, { status: 403 }));
      }

      return applyCookies(NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      ));
    }

    // Map database 'outcome' field to frontend 'result' field for consistency
    const mappedData = data ? {
      ...data,
      result: data.outcome,
      outcome: undefined
    } : null;

    return applyCookies(NextResponse.json({ data: mappedData }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[PUT /api/my/case-studies/[id]] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - 事例を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // 存在確認 + RLS チェック（created_by を含む）
    const { data: existingCaseStudy, error: fetchError } = await supabase
      .from('case_studies')
      .select('id, created_by')
      .eq('id', id)
      .eq('created_by', user.id)
      .maybeSingle();

    if (fetchError) {
      logger.error('[my/case-studies/[id]] Failed to fetch case study for delete', {
        userId: user.id,
        caseStudyId: id,
        error: fetchError.message
      });
      return applyCookies(NextResponse.json(
        { error: 'Database error', message: fetchError.message },
        { status: 500 }
      ));
    }

    if (!existingCaseStudy) {
      return applyCookies(NextResponse.json(
        { error: 'Not Found', message: 'Case study not found or access denied' },
        { status: 404 }
      ));
    }

    const { error } = await supabase
      .from('case_studies')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id);

    if (error) {
      logger.error('[my/case-studies/[id]] Failed to delete case study', {
        userId: user.id,
        caseStudyId: id,
        error: error.message
      });

      // RLS エラーの場合は 403 を返す
      if (error.code === '42501' || error.message?.includes('RLS')) {
        return applyCookies(NextResponse.json({
          error: 'RLS_FORBIDDEN',
          message: 'Row Level Security によって拒否されました'
        }, { status: 403 }));
      }

      return applyCookies(NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      ));
    }

    return applyCookies(NextResponse.json({ message: 'Case study deleted successfully' }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[DELETE /api/my/case-studies/[id]] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
