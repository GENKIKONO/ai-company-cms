// Single-Org Mode API: /api/my/case-studies
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import type { CaseStudy, CaseStudyFormData } from '@/types/database';
import { PLAN_LIMITS } from '@/config/plans';
import { normalizeCaseStudyPayload, createAuthError, createNotFoundError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';

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
    const supabase = await supabaseServer();
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    // organizationId クエリパラメータ必須チェック
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    
    if (!organizationId) {
      logger.debug('[my/case-studies] organizationId parameter required');
      return NextResponse.json({ error: 'organizationId parameter is required' }, { status: 400 });
    }

    // 組織の所有者チェック
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, created_by')
      .eq('id', organizationId)
      .eq('created_by', authData.user.id)
      .single();

    if (orgError || !orgData) {
      logger.error('[my/case-studies] Organization access denied', { 
        userId: authData.user.id, 
        organizationId,
        error: orgError?.message 
      });
      return NextResponse.json({ 
        error: 'RLS_FORBIDDEN', 
        message: 'Row Level Security によって拒否されました' 
      }, { status: 403 });
    }

    // RLS compliance: check both organization ownership and created_by
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('created_by', authData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Database error', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });

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
    const supabase = await supabaseServer();
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
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
      // organizationId が指定されている場合は、そのorganizationの所有者かチェック
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, plan, created_by')
        .eq('id', organizationId)
        .eq('created_by', authData.user.id)
        .single();

      if (orgError || !orgData) {
        logger.error('[my/case-studies] POST Organization access denied', { 
          userId: authData.user.id, 
          organizationId,
          error: orgError?.message 
        });
        return NextResponse.json({ 
          error: 'RLS_FORBIDDEN', 
          message: 'Row Level Security によって拒否されました' 
        }, { status: 403 });
      }
      
      targetOrgData = orgData;
    } else {
      // organizationId が指定されていない場合はユーザーの組織を取得
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, plan')
        .eq('created_by', authData.user.id)
        .single();

      if (orgError || !orgData) {
        return createNotFoundError('Organization');
      }
      
      targetOrgData = orgData;
    }

    // プラン制限チェック
    const currentPlan = targetOrgData.plan || 'trial';
    const planLimits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.trial;
    
    if (planLimits.case_studies > 0) {
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

      if ((currentCount || 0) >= planLimits.case_studies) {
        return NextResponse.json(
          {
            error: 'Plan limit exceeded',
            message: '上限に達しました。プランをアップグレードしてください。',
            currentCount,
            limit: planLimits.case_studies,
            plan: currentPlan
          },
          { status: 402 }
        );
      }
    }

    // organizationId を除去したbodyデータを正規化
    const normalizedData = normalizeCaseStudyPayload(restBody);
    // RLS compliance: include both organization_id and created_by
    const caseStudyData = { 
      ...normalizedData, 
      organization_id: targetOrgData.id,
      created_by: authData.user.id
    };

    const { data, error } = await supabase
      .from('case_studies')
      .insert([caseStudyData])
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Database error', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });

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