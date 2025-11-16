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
export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', authData.user.id)
      .single();

    if (orgError || !orgData) {
      return createNotFoundError('Organization');
    }

    // RLS compliance: check both organization ownership and created_by
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('organization_id', orgData.id)
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

    const body: CaseStudyFormData = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: 'Validation error', message: 'Title is required' }, { status: 400 });
    }

    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, plan')
      .eq('created_by', authData.user.id)
      .single();

    if (orgError || !orgData) {
      return createNotFoundError('Organization');
    }

    // プラン制限チェック
    const currentPlan = orgData.plan || 'trial';
    const planLimits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.trial;
    
    if (planLimits.case_studies > 0) {
      const { count: currentCount, error: countError } = await supabase
        .from('case_studies')
        .select('id', { count: 'exact' })
        .eq('organization_id', orgData.id);

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

    const normalizedData = normalizeCaseStudyPayload(body);
    // RLS compliance: include both organization_id and created_by
    const caseStudyData = { 
      ...normalizedData, 
      organization_id: orgData.id,
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