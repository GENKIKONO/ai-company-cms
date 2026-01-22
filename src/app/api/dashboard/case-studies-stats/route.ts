/**
 * /api/dashboard/case-studies-stats - 事例統計API
 *
 * 【認証方式】
 * - createApiAuthClient を使用（統一認証ヘルパー）
 * - getUser() が唯一の Source of Truth
 * - Cookie 同期は applyCookies で行う
 * - orgId の正当性はサーバー側で必ず検証
 *
 * @see src/lib/supabase/api-auth.ts
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClient, ApiAuthException, ApiAuthFailure } from '@/lib/supabase/api-auth';
import { logger } from '@/lib/utils/logger';

interface CaseStudiesStatsResponse {
  total: number;
  published: number;
  requestId?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<CaseStudiesStatsResponse | { error: string } | ApiAuthFailure>> {
  try {
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      logger.warn('[case-studies-stats] Missing orgId', { requestId, userId: user.id });
      return applyCookies(NextResponse.json({ error: 'orgId required' }, { status: 400 }));
    }

    // 【重要】org membership をサーバー側で検証（クエリパラメータを信用しない）
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (membershipError) {
      logger.error('[case-studies-stats] Membership check failed', {
        requestId,
        userId: user.id,
        orgId,
        error: membershipError.message,
      });
      return applyCookies(NextResponse.json({ error: 'Failed to verify membership' }, { status: 500 }));
    }

    if (!membership) {
      logger.warn('[case-studies-stats] User not member of org', { requestId, userId: user.id, orgId });
      return applyCookies(NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 }));
    }

    // RLSベースで統計を取得（service_role 廃止）
    try {
      // 総数を取得
      const { count: totalCount, error: totalError } = await supabase
        .from('case_studies')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId);

      if (totalError) {
        // テーブルが存在しない場合は0を返す
        if (totalError.code === '42P01' || totalError.message?.includes('relation') || totalError.message?.includes('does not exist')) {
          logger.debug('[case-studies-stats] Table does not exist, returning zeros', { requestId, orgId });
          return applyCookies(NextResponse.json({ total: 0, published: 0, requestId }));
        }

        logger.error('[case-studies-stats] Total count error', {
          requestId,
          orgId,
          error: totalError.message,
          code: totalError.code,
        });
        return applyCookies(NextResponse.json({ total: 0, published: 0, requestId }));
      }

      // 公開済み数を取得
      const { count: publishedCount, error: publishedError } = await supabase
        .from('case_studies')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_published', true);

      if (publishedError) {
        logger.error('[case-studies-stats] Published count error', {
          requestId,
          orgId,
          error: publishedError.message,
          code: publishedError.code,
        });
        // エラーの場合は総数のみ返す
        return applyCookies(NextResponse.json({ total: totalCount ?? 0, published: 0, requestId }));
      }

      logger.info('[case-studies-stats] Success', {
        requestId,
        userId: user.id,
        orgId,
        total: totalCount ?? 0,
        published: publishedCount ?? 0,
      });

      return applyCookies(NextResponse.json({
        total: totalCount ?? 0,
        published: publishedCount ?? 0,
        requestId,
      }));

    } catch (queryError) {
      // PostgreSQLエラーコード42P01は「テーブルが存在しない」
      const errorMsg = queryError instanceof Error ? queryError.message : String(queryError);
      if (errorMsg.includes('42P01') || errorMsg.includes('relation') || errorMsg.includes('does not exist')) {
        logger.debug('[case-studies-stats] Table does not exist, returning zeros', { requestId, orgId });
        return applyCookies(NextResponse.json({ total: 0, published: 0, requestId }));
      }

      logger.error('[case-studies-stats] Query error', {
        requestId,
        orgId,
        error: errorMsg,
      });
      return applyCookies(NextResponse.json({ error: 'Failed to fetch case studies stats' }, { status: 500 }));
    }

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[case-studies-stats] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
