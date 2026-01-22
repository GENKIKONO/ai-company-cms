/**
 * /api/my/services/[id] - 個別サービスの管理API
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
import type { ServiceFormData } from '@/types/domain/content';
import { normalizeServicePayload } from '@/lib/utils/data-normalization';
import {
  validateFilesForPublish,
  extractImageUrlsFromService,
} from '@/lib/file-scan';
import { logger } from '@/lib/utils/logger';

// GET - 個別サービスを取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // Get user organization first for RLS compliance
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError || !organization) {
      return applyCookies(NextResponse.json(
        { error: 'NOT_FOUND', message: '組織が見つかりません' },
        { status: 404 }
      ));
    }

    // RLS compliance: check both organization ownership and created_by
    const { data, error } = await supabase
      .from('services')
      .select('id, organization_id, name, slug, summary, description, price, price_range, duration_months, category, features, image_url, video_url, cta_text, cta_url, is_published, status, created_by, created_at, updated_at')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .eq('created_by', user.id)
      .maybeSingle();

    if (error) {
      logger.error('[my/services/[id]] Failed to fetch service', {
        userId: user.id,
        serviceId: id,
        error: error.message
      });
      return applyCookies(NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      ));
    }

    if (!data) {
      return applyCookies(NextResponse.json(
        { error: 'NOT_FOUND', message: 'サービスが見つかりません' },
        { status: 404 }
      ));
    }

    return applyCookies(NextResponse.json({ data }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[GET /api/my/services/[id]] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT - サービスを更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    const body: Partial<ServiceFormData> = await request.json();

    // Get user organization first for RLS compliance
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError || !organization) {
      return applyCookies(NextResponse.json(
        { error: 'NOT_FOUND', message: '組織が見つかりません' },
        { status: 404 }
      ));
    }

    // RLS compliance: check both organization ownership and created_by
    const { data: existingService, error: fetchError } = await supabase
      .from('services')
      .select('id, is_published, image_url, thumbnail_url, media')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .eq('created_by', user.id)
      .maybeSingle();

    if (fetchError) {
      logger.error('[my/services/[id]] Failed to fetch service for update', {
        userId: user.id,
        serviceId: id,
        error: fetchError.message
      });
      return applyCookies(NextResponse.json(
        { error: 'Database error', message: fetchError.message },
        { status: 500 }
      ));
    }

    if (!existingService) {
      return applyCookies(NextResponse.json(
        { error: 'NOT_FOUND', message: 'サービスが見つかりません' },
        { status: 404 }
      ));
    }

    // データ正規化
    const normalizedData = normalizeServicePayload(body);
    const updateData: Record<string, unknown> = {
      ...normalizedData,
      updated_at: new Date().toISOString(),
    };

    // 公開時のファイルスキャンバリデーション
    const isBecomingPublished =
      (updateData.is_published === true && existingService.is_published !== true);

    if (isBecomingPublished) {
      const mergedData = { ...existingService, ...updateData };
      const imageUrls = extractImageUrlsFromService(mergedData as Record<string, unknown>);

      if (imageUrls.length > 0) {
        const scanResult = await validateFilesForPublish(supabase, imageUrls);

        if (!scanResult.valid) {
          logger.warn('[my/services/[id]] File scan validation failed for publish', {
            userId: user.id,
            serviceId: id,
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

    // Update with RLS compliance
    const { data, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organization.id)
      .eq('created_by', user.id)
      .select()
      .maybeSingle();

    if (error) {
      logger.error('[my/services/[id]] Failed to update service', {
        userId: user.id,
        serviceId: id,
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

    return applyCookies(NextResponse.json({ data }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[PUT /api/my/services/[id]] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - サービスを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // Get user organization first for RLS compliance
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError || !organization) {
      return applyCookies(NextResponse.json(
        { error: 'NOT_FOUND', message: '組織が見つかりません' },
        { status: 404 }
      ));
    }

    // RLS compliance: check both organization ownership and created_by
    const { data: existingService, error: fetchError } = await supabase
      .from('services')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .eq('created_by', user.id)
      .maybeSingle();

    if (fetchError) {
      logger.error('[my/services/[id]] Failed to fetch service for delete', {
        userId: user.id,
        serviceId: id,
        error: fetchError.message
      });
      return applyCookies(NextResponse.json(
        { error: 'Database error', message: fetchError.message },
        { status: 500 }
      ));
    }

    if (!existingService) {
      return applyCookies(NextResponse.json(
        { error: 'NOT_FOUND', message: 'サービスが見つかりません' },
        { status: 404 }
      ));
    }

    // Delete with RLS compliance
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .eq('organization_id', organization.id)
      .eq('created_by', user.id);

    if (error) {
      logger.error('[my/services/[id]] Failed to delete service', {
        userId: user.id,
        serviceId: id,
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

    return applyCookies(NextResponse.json({ message: 'Service deleted successfully' }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[DELETE /api/my/services/[id]] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
