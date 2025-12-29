// Single-Org Mode API: /api/my/case-studies
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import type { CaseStudy } from '@/types/legacy/database';
import type { CaseStudyFormData } from '@/types/domain/content';;
import { getOrgFeatureLimit as getFeatureLimit } from '@/lib/featureGate';
import { normalizeCaseStudyPayload, createAuthError, createNotFoundError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';
import { validateOrgAccess, OrgAccessError } from '@/lib/utils/org-access';

async function logErrorToDiag(errorInfo: any) {
  try {
    await fetch('/api/diag/ui', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'server_error', ...errorInfo }),
      cache: 'no-store'
    });
  } catch {}
}

export const dynamic = 'force-dynamic';

// GET - ユーザー企業の事例一覧を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証（Core経由）
    const user = await getUserWithClient(supabase);
    if (!user) {
      return createAuthError();
    }

    // organizationId クエリパラメータ必須チェック
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    
    if (!organizationId) {
      logger.debug('[my/case-studies] organizationId parameter required');
      return NextResponse.json({ error: 'organizationId parameter is required' }, { status: 400 });
    }


    // 組織アクセス権限チェック（validate_org_access RPC使用）
    try {
      await validateOrgAccess(organizationId, user.id);
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return NextResponse.json({
          error: error.code,
          message: error.message
        }, { status: error.statusCode });
      }

      logger.error('[my/case-studies] GET Unexpected org access validation error', {
        userId: user.id,
        organizationId,
        error: error instanceof Error ? error.message : error 
      });
      return NextResponse.json({ 
        error: 'INTERNAL_ERROR', 
        message: 'メンバーシップ確認に失敗しました' 
      }, { status: 500 });
    }

    // 事例取得（RLSにより組織メンバーのみアクセス可能）
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Database error', message: error.message }, { status: 500 });
    }

    // Map database 'outcome' field to frontend 'result' field for consistency
    const mappedData = (data || []).map((caseStudy: any) => ({
      ...caseStudy,
      result: caseStudy.outcome,
      // Remove outcome field to avoid confusion
      outcome: undefined
    }));

    return NextResponse.json({ data: mappedData });

  } catch (error) {
    const errorId = generateErrorId('get-case-studies');
    logErrorToDiag({
      errorId,
      endpoint: 'GET /api/my/case-studies',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return createInternalError(errorId);
  }
}

// POST - 新しい事例を作成
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証（Core経由）
    const user = await getUserWithClient(supabase);
    if (!user) {
      return createAuthError();
    }

    const body: CaseStudyFormData & { organizationId?: string } = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: 'Validation error', message: 'Title is required' }, { status: 400 });
    }

    // organizationId が body に含まれている場合は検証、含まれていない場合はユーザーの組織を取得
    const { organizationId, ...restBody } = body;
    let targetOrgData;
    
    if (organizationId) {
      // organizationId が指定されている場合は、組織アクセス権限チェック（validate_org_access RPC使用）
      try {
        await validateOrgAccess(organizationId, user.id);
      } catch (error) {
        if (error instanceof OrgAccessError) {
          return NextResponse.json({
            error: error.code,
            message: error.message
          }, { status: error.statusCode });
        }

        logger.error('[my/case-studies] POST Unexpected org access validation error', {
          userId: user.id,
          organizationId,
          error: error instanceof Error ? error.message : error 
        });
        return NextResponse.json({ 
          error: 'INTERNAL_ERROR', 
          message: 'メンバーシップ確認に失敗しました' 
        }, { status: 500 });
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
        return NextResponse.json({ 
          error: 'INTERNAL_ERROR', 
          message: '組織情報の取得に失敗しました' 
        }, { status: 500 });
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
        return createNotFoundError('Organization');
      }

      // ユーザー所有組織への権限チェック
      try {
        await validateOrgAccess(orgData.id, user.id);
      } catch (error) {
        if (error instanceof OrgAccessError) {
          return NextResponse.json({
            error: error.code,
            message: error.message
          }, { status: error.statusCode });
        }

        logger.error('[my/case-studies] POST Unexpected org access validation error (user org)', {
          userId: user.id,
          organizationId: orgData.id,
          error: error instanceof Error ? error.message : error 
        });
        return NextResponse.json({ 
          error: 'INTERNAL_ERROR', 
          message: 'メンバーシップ確認に失敗しました' 
        }, { status: 500 });
      }
      
      targetOrgData = orgData;
    }

    // プラン制限チェック（effective-features使用）
    try {
      const featureLimit = await getFeatureLimit(targetOrgData.id, 'case_studies');
      
      // null/undefined は無制限扱い
      if (featureLimit !== null && featureLimit !== undefined) {
        const { count: currentCount, error: countError } = await supabase
          .from('case_studies')
          .select('id', { count: 'exact' })
          .eq('organization_id', targetOrgData.id);

        if (countError) {
          logger.error('Error counting case studies:', { data: countError });
          return NextResponse.json(
            { error: 'Database error', message: countError.message },
            { status: 500 }
          );
        }

        if ((currentCount || 0) >= featureLimit) {
          return NextResponse.json(
            {
              error: 'Plan limit exceeded',
              message: '上限に達しました。プランをアップグレードしてください。',
              currentCount,
              limit: featureLimit,
              plan: targetOrgData.plan || 'trial'
            },
            { status: 402 }
          );
        }
      }
    } catch (error) {
      logger.error('Feature limit check failed, allowing creation:', { data: error });
      // effective-features エラー時は作成を許可（FAQs/materialsと同じポリシー）
    }

    // organizationId を除去したbodyデータを正規化
    const normalizedData = normalizeCaseStudyPayload(restBody);
    // RLS compliance: include both organization_id and created_by
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
      return NextResponse.json({ error: 'Database error', message: error.message }, { status: 500 });
    }

    // Map database 'outcome' field to frontend 'result' field for consistency
    const mappedData = data ? {
      ...data,
      result: data.outcome,
      outcome: undefined
    } : null;

    return NextResponse.json({ data: mappedData }, { status: 201 });

  } catch (error) {
    const errorId = generateErrorId('post-case-studies');
    logErrorToDiag({
      errorId,
      endpoint: 'POST /api/my/case-studies',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return createInternalError(errorId);
  }
}