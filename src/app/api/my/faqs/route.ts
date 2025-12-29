// Single-Org Mode API: /api/my/faqs
// ユーザーの企業のFAQを管理するためのAPI
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import type { FAQ } from '@/types/legacy/database';
import type { FAQFormData } from '@/types/domain/content';;
import { normalizeFAQPayload, createAuthError, createNotFoundError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { getOrgFeatureLimit as getFeatureLimit } from '@/lib/featureGate';
import { getEffectiveFeatures, canExecute, type Subject, type QuotaResult } from '@/lib/featureGate';
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
    
    // 認証（Core経由）
    const user = await getUserWithClient(supabase);
    if (!user) {
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
      await validateOrgAccess(organizationId, user.id);
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return NextResponse.json({ 
          error: error.code, 
          message: error.message 
        }, { status: error.statusCode });
      }
      
      // Unexpected error
      logger.error('[my/faqs] Unexpected org access validation error', {
        userId: user.id,
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

    // 認証（Core経由）
    const user = await getUserWithClient(supabase);
    if (!user) {
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
      await validateOrgAccess(body.organizationId, user.id);
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return NextResponse.json({ 
          error: error.code, 
          message: error.message 
        }, { status: error.statusCode });
      }
      
      // Unexpected error
      logger.error('[my/faqs] POST Unexpected org access validation error', {
        userId: user.id,
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
        userId: user.id,
        organizationId: body.organizationId,
        error: orgError?.message 
      });
      return NextResponse.json({ 
        error: 'INTERNAL_ERROR', 
        message: '組織情報の取得に失敗しました' 
      }, { status: 500 });
    }

    // プラン制限チェック（Subject型 FeatureGate API使用）
    const subject: Subject = { type: 'org', id: orgData.id };

    try {
      // 1. 機能の有効/無効をチェック
      const effectiveFeatures = await getEffectiveFeatures(supabase, subject);
      const faqFeature = effectiveFeatures.find(f => f.feature_key === 'faq_module');

      if (faqFeature && (faqFeature.is_enabled === false || faqFeature.enabled === false)) {
        logger.info('[my/faqs] FAQ module disabled for org', { orgId: orgData.id });
        return NextResponse.json(
          {
            error: 'Feature disabled',
            code: 'DISABLED',
            message: 'FAQ機能は現在のプランでは利用できません。',
            plan: orgData.plan || 'trial'
          },
          { status: 403 }
        );
      }

      // 2. Quota実行時強制: canExecute で消費チェック
      // idempotency_key で二重消費を防止（タイムスタンプ+ユーザーID+ランダム）
      const idempotencyKey = `faq-create-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const quotaResult: QuotaResult = await canExecute(supabase, {
        subject,
        feature_key: 'faq_module',
        limit_key: 'max_count',
        amount: 1,
        period: 'total', // FAQは総数制限
        idempotency_key: idempotencyKey,
      });

      logger.debug('[my/faqs] canExecute result', {
        orgId: orgData.id,
        quotaResult,
        idempotencyKey
      });

      // 3. Quota判定結果で分岐
      if (!quotaResult.ok) {
        // QuotaResultCode に応じたHTTPステータス
        const statusMap: Record<string, number> = {
          NO_PLAN: 402,
          DISABLED: 403,
          EXCEEDED: 429,
          FORBIDDEN: 403,
          NOT_FOUND: 404,
          INVALID_ARG: 400,
          ERROR: 500,
        };
        const status = statusMap[quotaResult.code] || 402;

        logger.info('[my/faqs] Quota check failed', {
          orgId: orgData.id,
          code: quotaResult.code,
          remaining: quotaResult.remaining,
          limit: quotaResult.limit
        });

        return NextResponse.json(
          {
            error: 'Quota exceeded',
            code: quotaResult.code,
            message: quotaResult.code === 'EXCEEDED'
              ? '上限に達しました。プランをアップグレードしてください。'
              : 'FAQ作成が許可されていません。',
            remaining: quotaResult.remaining,
            limit: quotaResult.limit,
            plan: orgData.plan || 'trial'
          },
          { status }
        );
      }

      logger.debug('[my/faqs] Quota check passed', {
        orgId: orgData.id,
        remaining: quotaResult.remaining,
        limit: quotaResult.limit
      });

    } catch (error) {
      // canExecute RPC が存在しない場合のフォールバック: 旧方式で制限チェック
      logger.warn('[my/faqs] canExecute failed, falling back to legacy check', { error });

      try {
        const featureLimit = await getFeatureLimit(orgData.id, 'faq_module');

        if (featureLimit !== null && featureLimit !== undefined) {
          const { count: currentCount, error: countError } = await supabase
            .from('faqs')
            .select('id', { count: 'exact' })
            .eq('organization_id', orgData.id);

          if (!countError && (currentCount || 0) >= featureLimit) {
            return NextResponse.json(
              {
                error: 'Plan limit exceeded',
                code: 'EXCEEDED',
                message: '上限に達しました。プランをアップグレードしてください。',
                currentCount,
                limit: featureLimit,
                plan: orgData.plan || 'trial'
              },
              { status: 429 }
            );
          }
        }
      } catch (fallbackError) {
        logger.error('[my/faqs] Fallback limit check also failed, allowing creation', { fallbackError });
      }
    }

    // FAQデータを準備
    const faqData = {
      organization_id: orgData.id,
      created_by: user.id,
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
        userId: user.id,
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
          userId: user.id,
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