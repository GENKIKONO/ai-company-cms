/**
 * /api/my/case-studies - ユーザーの事例管理API
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
import { getOrgFeatureLimit as getFeatureLimit } from '@/lib/featureGate';
import { normalizeCaseStudyPayload } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';

// GET - ユーザー企業の事例一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // organizationId クエリパラメータ必須チェック
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      logger.debug('[my/case-studies] organizationId parameter required');
      return applyCookies(NextResponse.json({ error: 'organizationId parameter is required' }, { status: 400 }));
    }

    // 組織メンバーシップチェック（RLSモデルに準拠）
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) {
      logger.error('[my/case-studies] Organization membership check failed', {
        userId: user.id,
        organizationId,
        error: membershipError.message
      });
      return applyCookies(NextResponse.json({
        error: 'INTERNAL_ERROR',
        message: 'メンバーシップ確認に失敗しました'
      }, { status: 500 }));
    }

    if (!membership) {
      logger.warn('[my/case-studies] User not a member of organization', {
        userId: user.id,
        organizationId
      });
      return applyCookies(NextResponse.json({
        error: 'FORBIDDEN',
        message: 'この組織のメンバーではありません'
      }, { status: 403 }));
    }

    // 事例取得（セキュアビュー経由）
    const { data, error } = await supabase
      .from('v_dashboard_case_studies_secure')
      .select('id, title, slug, is_published, published_at, organization_id, status, problem, solution, result, tags, created_at, updated_at, summary, client_name, industry')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[my/case-studies] Failed to fetch case studies', {
        userId: user.id,
        organizationId,
        error: error.message
      });
      return applyCookies(NextResponse.json({ error: 'Database error', message: error.message }, { status: 500 }));
    }

    return applyCookies(NextResponse.json({ data: data || [] }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[GET /api/my/case-studies] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - 新しい事例を作成
export async function POST(request: NextRequest) {
  try {
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    const body: CaseStudyFormData & { organizationId?: string } = await request.json();

    if (!body.title) {
      return applyCookies(NextResponse.json({ error: 'Validation error', message: 'Title is required' }, { status: 400 }));
    }

    // organizationId が body に含まれている場合は検証、含まれていない場合はユーザーの組織を取得
    const { organizationId, ...restBody } = body;
    let targetOrgData;

    if (organizationId) {
      // 組織メンバーシップチェック（RLSモデルに準拠）
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (membershipError || !membership) {
        logger.error('[my/case-studies] POST Organization membership check failed', {
          userId: user.id,
          organizationId,
          error: membershipError?.message
        });
        return applyCookies(NextResponse.json({
          error: 'FORBIDDEN',
          message: 'この組織のメンバーではありません'
        }, { status: 403 }));
      }

      // 組織情報取得（プラン制限チェック用）
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, plan')
        .eq('id', organizationId)
        .maybeSingle();

      if (orgError || !orgData) {
        logger.error('[my/case-studies] POST Organization data fetch failed', {
          userId: user.id,
          organizationId,
          error: orgError?.message
        });
        return applyCookies(NextResponse.json({
          error: 'INTERNAL_ERROR',
          message: '組織情報の取得に失敗しました'
        }, { status: 500 }));
      }

      targetOrgData = orgData;
    } else {
      // organizationId が指定されていない場合はユーザーの組織を取得
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, plan')
        .eq('created_by', user.id)
        .maybeSingle();

      if (orgError || !orgData) {
        return applyCookies(NextResponse.json({
          error: 'NOT_FOUND',
          message: '組織が見つかりません'
        }, { status: 404 }));
      }

      // ユーザー所有組織へのメンバーシップチェック
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('organization_id', orgData.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (membershipError || !membership) {
        logger.error('[my/case-studies] POST User org membership check failed', {
          userId: user.id,
          organizationId: orgData.id,
          error: membershipError?.message
        });
        return applyCookies(NextResponse.json({
          error: 'FORBIDDEN',
          message: 'この組織のメンバーではありません'
        }, { status: 403 }));
      }

      targetOrgData = orgData;
    }

    // プラン制限チェック
    try {
      const featureLimit = await getFeatureLimit(targetOrgData.id, 'case_studies');

      if (featureLimit !== null && featureLimit !== undefined) {
        const { count: currentCount, error: countError } = await supabase
          .from('case_studies')
          .select('id', { count: 'exact' })
          .eq('organization_id', targetOrgData.id);

        if (countError) {
          logger.error('[my/case-studies] Error counting case studies', { data: countError });
          return applyCookies(NextResponse.json(
            { error: 'Database error', message: countError.message },
            { status: 500 }
          ));
        }

        if ((currentCount || 0) >= featureLimit) {
          return applyCookies(NextResponse.json(
            {
              error: 'Plan limit exceeded',
              message: '上限に達しました。プランをアップグレードしてください。',
              currentCount,
              limit: featureLimit,
              plan: targetOrgData.plan || 'trial'
            },
            { status: 402 }
          ));
        }
      }
    } catch (error) {
      logger.error('[my/case-studies] Feature limit check failed, allowing creation', { data: error });
    }

    // データを正規化
    const normalizedData = normalizeCaseStudyPayload(restBody);
    const caseStudyData = {
      ...normalizedData,
      organization_id: targetOrgData.id,
      created_by: user.id
    };

    const { data, error } = await supabase
      .from('case_studies')
      .insert([caseStudyData])
      .select()
      .maybeSingle();

    if (error) {
      logger.error('[my/case-studies POST] Failed to create case study', {
        userId: user.id,
        orgId: targetOrgData.id,
        error: error,
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });

      // RLS エラーの場合は 403 を返す
      if (error.code === '42501' || error.message?.includes('RLS')) {
        return applyCookies(NextResponse.json({
          error: 'RLS_FORBIDDEN',
          message: 'Row Level Security によって拒否されました'
        }, { status: 403 }));
      }

      return applyCookies(NextResponse.json({ error: 'Database error', message: error.message }, { status: 500 }));
    }

    // Map database 'outcome' field to frontend 'result' field for consistency
    const mappedData = data ? {
      ...data,
      result: data.outcome,
      outcome: undefined
    } : null;

    return applyCookies(NextResponse.json({ data: mappedData }, { status: 201 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[POST /api/my/case-studies] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
