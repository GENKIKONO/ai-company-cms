// Single-Org Mode API: /api/my/faqs
// ユーザーの企業のFAQを管理するためのAPI
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { FAQ } from '@/types/legacy/database';
import type { FAQFormData } from '@/types/domain/content';;
import { normalizeFAQPayload, createAuthError, createNotFoundError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { getFeatureLimit } from '@/lib/org-features';
import { logger } from '@/lib/utils/logger';
import { validateOrgAccess, OrgAccessError } from '@/lib/utils/org-access';

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
    const supabase = await createClient();
    
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

    // 組織アクセス権限チェック（validate_org_access RPC使用）
    try {
      await validateOrgAccess(organizationId, authData.user.id);
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return NextResponse.json({ 
          error: error.code, 
          message: error.message 
        }, { status: error.statusCode });
      }
      
      // Unexpected error
      logger.error('[my/faqs] Unexpected org access validation error', { 
        userId: authData.user.id, 
        organizationId,
        error: error instanceof Error ? error.message : error 
      });
      return NextResponse.json({ 
        error: 'INTERNAL_ERROR', 
        message: 'メンバーシップ確認に失敗しました' 
      }, { status: 500 });
    }

    // FAQs取得（RLSにより組織メンバーのみアクセス可能）
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('organization_id', organizationId)
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
    const supabase = await createClient();
    
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

    // 組織アクセス権限チェック（validate_org_access RPC使用）
    try {
      await validateOrgAccess(body.organizationId, authData.user.id);
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return NextResponse.json({ 
          error: error.code, 
          message: error.message 
        }, { status: error.statusCode });
      }
      
      // Unexpected error
      logger.error('[my/faqs] POST Unexpected org access validation error', { 
        userId: authData.user.id, 
        organizationId: body.organizationId,
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
      .eq('id', body.organizationId)
      .maybeSingle();

    if (orgError || !orgData) {
      logger.error('[my/faqs] POST Organization data fetch failed', { 
        userId: authData.user.id, 
        organizationId: body.organizationId,
        error: orgError?.message 
      });
      return NextResponse.json({ 
        error: 'INTERNAL_ERROR', 
        message: '組織情報の取得に失敗しました' 
      }, { status: 500 });
    }

    // プラン制限チェック（effective-features使用）
    try {
      const featureLimit = await getFeatureLimit(orgData.id, 'faq_module');
      
      // null/undefined は無制限扱い
      if (featureLimit !== null && featureLimit !== undefined) {
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

        if ((currentCount || 0) >= featureLimit) {
          return NextResponse.json(
            {
              error: 'Plan limit exceeded',
              message: '上限に達しました。プランをアップグレードしてください。',
              currentCount,
              limit: featureLimit,
              plan: orgData.plan || 'trial'
            },
            { status: 402 }
          );
        }
      }
    } catch (error) {
      logger.error('Feature limit check failed, allowing creation:', { data: error });
      // TODO: ここは後で要確認 - effective-features エラー時のフォールバック挙動
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
      status: 'published', // 公開状態を明示的に設定
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // PGRST204対策: INSERT とSELECTを分離して安全に処理
    const { data: insertData, error: insertError } = await supabase
      .from('faqs')
      .insert(faqData)
      .select('id')
      .maybeSingle();

    if (insertError) {
      logger.error('[my/faqs POST] Failed to create FAQ', {
        userId: authData.user.id,
        orgId: orgData.id,
        faqData: { ...faqData, answer: '[内容省略]' },
        error: insertError,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        message: insertError.message
      });
      return NextResponse.json({
        error: 'FAQの作成に失敗しました',
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      }, { status: 500 });
    }

    // INSERT成功後、改めてSELECTで取得（RLSポリシー対応）
    let data = null;
    if (insertData?.id) {
      const { data: selectData, error: selectError } = await supabase
        .from('faqs')
        .select('*')
        .eq('id', insertData.id)
        .eq('organization_id', orgData.id)
        .maybeSingle();

      if (selectError) {
        logger.warn('[my/faqs POST] SELECT after INSERT failed, but INSERT succeeded', {
          userId: authData.user.id,
          orgId: orgData.id,
          faqId: insertData.id,
          selectError: selectError.code
        });
        // SELECT失敗でもINSERT成功なら201を返す
        data = { id: insertData.id, ...faqData };
      } else {
        data = selectData;
      }
    } else {
      // INSERT成功したがIDが返ってこない場合
      data = faqData;
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