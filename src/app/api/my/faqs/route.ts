// Single-Org Mode API: /api/my/faqs
// ユーザーの企業のFAQを管理するためのAPI
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import type { FAQ, FAQFormData } from '@/types/database';
import { normalizeFAQPayload, createAuthError, createNotFoundError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { PLAN_LIMITS } from '@/config/plans';
import { logger } from '@/lib/utils/logger';

async function logErrorToDiag(errorInfo: any) {
  try {
    await fetch('/api/diag/ui', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'server_error',
        ...errorInfo
      }),
      cache: 'no-store'
    });
  } catch {
    // 診断ログ送信失敗は無視
  }
}

export const dynamic = 'force-dynamic';

// GET - ユーザー企業のFAQ一覧を取得
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
      logger.debug('[my/faqs] organizationId parameter required');
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
      logger.error('[my/faqs] Organization access denied', { 
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
      .from('faqs')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('created_by', authData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });

  } catch (error) {
    const errorId = generateErrorId('get-faqs');
    logErrorToDiag({
      errorId,
      endpoint: 'GET /api/my/faqs',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return createInternalError(errorId);
  }
}

// POST - 新しいFAQを作成
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({
        error: '認証が必要です'
      }, { status: 401 });
    }

    const body: FAQFormData & { organizationId?: string } = await request.json();

    // organizationId 必須チェック
    if (!body.organizationId) {
      logger.debug('[my/faqs] POST organizationId required');
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    if (!body.question || !body.answer) {
      return NextResponse.json({
        error: '質問と回答は必須です'
      }, { status: 400 });
    }

    // 組織の所有者チェック
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, plan, created_by')
      .eq('id', body.organizationId)
      .eq('created_by', authData.user.id)
      .single();

    if (orgError || !orgData) {
      logger.error('[my/faqs] POST Organization access denied', { 
        userId: authData.user.id, 
        organizationId: body.organizationId,
        error: orgError?.message 
      });
      return NextResponse.json({ 
        error: 'RLS_FORBIDDEN', 
        message: 'Row Level Security によって拒否されました' 
      }, { status: 403 });
    }

    // プラン制限チェック
    const currentPlan = orgData.plan || 'trial';
    const planLimits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.trial;
    
    if (planLimits.faqs > 0) {
      const { count: currentCount, error: countError } = await supabase
        .from('faqs')
        .select('id', { count: 'exact' })
        .eq('organization_id', orgData.id);

      if (countError) {
        logger.error('Error counting FAQs:', { data: countError });
        return NextResponse.json(
          { error: 'Database error', message: countError.message },
          { status: 500 }
        );
      }

      if ((currentCount || 0) >= planLimits.faqs) {
        return NextResponse.json(
          {
            error: 'Plan limit exceeded',
            message: '上限に達しました。プランをアップグレードしてください。',
            currentCount,
            limit: planLimits.faqs,
            plan: currentPlan
          },
          { status: 402 }
        );
      }
    }

    // FAQデータを準備
    const faqData = {
      organization_id: orgData.id,
      created_by: authData.user.id,
      question: body.question,
      answer: body.answer,
      category: body.category || null,
      sort_order: body.sort_order || 1,
      is_published: true, // 作成されたFAQは即座に公開対象とする
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('faqs')
      .insert(faqData)
      .select()
      .maybeSingle();

    if (error) {
      logger.error('[my/faqs POST] Failed to create FAQ', {
        userId: authData.user.id,
        orgId: orgData.id,
        faqData: { ...faqData, answer: '[内容省略]' },
        error: error,
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });
      return NextResponse.json({
        error: 'FAQの作成に失敗しました',
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    const errorId = generateErrorId('post-faqs');
    logErrorToDiag({
      errorId,
      endpoint: 'POST /api/my/faqs',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return createInternalError(errorId);
  }
}