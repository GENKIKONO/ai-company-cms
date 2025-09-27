// Single-Org Mode API: /api/my/case-studies
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import type { CaseStudy, CaseStudyFormData } from '@/types/database';
import { PLAN_LIMITS } from '@/lib/plan-limits';

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
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required' }, { status: 401 });
    }

    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', authData.user.id)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json({ error: 'Not Found', message: 'Organization not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('organization_id', orgData.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Database error', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });

  } catch (error) {
    const errorId = `get-case-studies-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logErrorToDiag({
      errorId,
      endpoint: 'GET /api/my/case-studies',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ error: 'Internal server error', errorId }, { status: 500 });
  }
}

// POST - 新しい事例を作成
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required' }, { status: 401 });
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
      return NextResponse.json({ error: 'Not Found', message: 'Organization not found' }, { status: 404 });
    }

    // プラン制限チェック
    const currentPlan = orgData.plan || 'free';
    const planLimits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
    
    if (planLimits.case_studies > 0) {
      const { count: currentCount, error: countError } = await supabase
        .from('case_studies')
        .select('id', { count: 'exact' })
        .eq('organization_id', orgData.id);

      if (countError) {
        console.error('Error counting case studies:', countError);
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
    const caseStudyData = { ...normalizedData, organization_id: orgData.id };

    const { data, error } = await supabase
      .from('case_studies')
      .insert([caseStudyData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Database error', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    const errorId = `post-case-studies-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logErrorToDiag({
      errorId,
      endpoint: 'POST /api/my/case-studies',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ error: 'Internal server error', errorId }, { status: 500 });
  }
}

function normalizeCaseStudyPayload(data: any) {
  const normalized = { ...data };
  const optionalTextFields = ['problem', 'solution', 'result'];
  
  optionalTextFields.forEach(field => {
    if (normalized[field] === '') {
      normalized[field] = null;
    }
  });
  
  // tags配列の処理
  if (!normalized.tags || normalized.tags.length === 0) {
    normalized.tags = null;
  }
  
  return normalized;
}