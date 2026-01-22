/**
 * /api/dashboard/activities - 組織のアクティビティ取得API
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

interface ActivitiesResponse {
  data: Array<{
    id: string;
    action: string;
    resource_type: string;
    metadata: Record<string, unknown> | null;
    user_id: string | null;
    created_at: string;
  }>;
}

export async function GET(request: NextRequest): Promise<NextResponse<ActivitiesResponse | { error: string } | ApiAuthFailure>> {
  try {
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      logger.warn('[activities] Missing orgId', { requestId, userId: user.id });
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
      logger.error('[activities] Membership check failed', {
        requestId,
        userId: user.id,
        orgId,
        error: membershipError.message,
      });
      return applyCookies(NextResponse.json({ error: 'Failed to verify membership' }, { status: 500 }));
    }

    if (!membership) {
      logger.warn('[activities] User not member of org', { requestId, userId: user.id, orgId });
      return applyCookies(NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 }));
    }

    // RLSベースでアクティビティを取得（service_role 廃止）
    const { data, error } = await supabase
      .from('activities')
      .select('id, action, resource_type, metadata, user_id, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      // テーブルが存在しない場合は空配列を返す
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        logger.debug('[activities] Table does not exist, returning empty', { requestId, orgId });
        return applyCookies(NextResponse.json({ data: [] }));
      }

      logger.error('[activities] Fetch error', {
        requestId,
        userId: user.id,
        orgId,
        error: error.message,
        code: error.code,
      });
      return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }));
    }

    logger.info('[activities] Success', {
      requestId,
      userId: user.id,
      orgId,
      count: data?.length || 0,
    });

    return applyCookies(NextResponse.json({ data: data || [] }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[activities] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}