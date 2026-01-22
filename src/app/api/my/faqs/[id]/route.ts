/**
 * /api/my/faqs/[id] - 個別FAQの管理API
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
import type { FAQFormData } from '@/types/domain/content';
import { normalizeFAQPayload } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';

// GET - 個別FAQを取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // FAQを取得（RLSで組織メンバーのみアクセス可能）
    const { data, error } = await supabase
      .from('faqs')
      .select('id, organization_id, service_id, question, answer, category, order_index, is_published, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error('[my/faqs/[id]] Failed to fetch FAQ', {
        userId: user.id,
        faqId: id,
        error: error.message
      });
      return applyCookies(NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      ));
    }

    if (!data) {
      return applyCookies(NextResponse.json(
        { error: 'NOT_FOUND', message: 'FAQが見つかりません' },
        { status: 404 }
      ));
    }

    return applyCookies(NextResponse.json({ data }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[GET /api/my/faqs/[id]] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT - FAQを更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    const body: Partial<FAQFormData> = await request.json();

    // 存在確認（RLSで組織メンバーのみアクセス可能）
    const { data: existingFAQ, error: fetchError } = await supabase
      .from('faqs')
      .select('id, organization_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      logger.error('[my/faqs/[id]] Failed to fetch FAQ for update', {
        userId: user.id,
        faqId: id,
        error: fetchError.message
      });
      return applyCookies(NextResponse.json(
        { error: 'Database error', message: fetchError.message },
        { status: 500 }
      ));
    }

    if (!existingFAQ) {
      return applyCookies(NextResponse.json(
        { error: 'NOT_FOUND', message: 'FAQが見つかりません' },
        { status: 404 }
      ));
    }

    // 組織メンバーシップチェック
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('organization_id', existingFAQ.organization_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      logger.warn('[my/faqs/[id]] User not authorized to update FAQ', {
        userId: user.id,
        faqId: id,
        organizationId: existingFAQ.organization_id
      });
      return applyCookies(NextResponse.json({
        error: 'FORBIDDEN',
        message: 'この組織のメンバーではありません'
      }, { status: 403 }));
    }

    // データ正規化
    const normalizedData = normalizeFAQPayload(body);
    const updateData = {
      ...normalizedData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('faqs')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      logger.error('[my/faqs/[id]] Failed to update FAQ', {
        userId: user.id,
        faqId: id,
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

    logger.error('[PUT /api/my/faqs/[id]] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - FAQを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // 存在確認（RLSで組織メンバーのみアクセス可能）
    const { data: existingFAQ, error: fetchError } = await supabase
      .from('faqs')
      .select('id, organization_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      logger.error('[my/faqs/[id]] Failed to fetch FAQ for delete', {
        userId: user.id,
        faqId: id,
        error: fetchError.message
      });
      return applyCookies(NextResponse.json(
        { error: 'Database error', message: fetchError.message },
        { status: 500 }
      ));
    }

    if (!existingFAQ) {
      return applyCookies(NextResponse.json(
        { error: 'NOT_FOUND', message: 'FAQが見つかりません' },
        { status: 404 }
      ));
    }

    // 組織メンバーシップチェック
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('organization_id', existingFAQ.organization_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      logger.warn('[my/faqs/[id]] User not authorized to delete FAQ', {
        userId: user.id,
        faqId: id,
        organizationId: existingFAQ.organization_id
      });
      return applyCookies(NextResponse.json({
        error: 'FORBIDDEN',
        message: 'この組織のメンバーではありません'
      }, { status: 403 }));
    }

    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('[my/faqs/[id]] Failed to delete FAQ', {
        userId: user.id,
        faqId: id,
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

    return applyCookies(NextResponse.json({ message: 'FAQ deleted successfully' }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[DELETE /api/my/faqs/[id]] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
