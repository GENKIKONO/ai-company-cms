/**
 * /api/my/faqs - ユーザーのFAQ管理API
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
import type { FAQFormData } from '@/types/domain/content';
import { getOrgFeatureLimit as getFeatureLimit } from '@/lib/featureGate';
import { getEffectiveFeatures, canExecute, type Subject, type QuotaResult } from '@/lib/featureGate';
import { logger } from '@/lib/utils/logger';

// GET - ユーザー企業のFAQ一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // organizationId クエリパラメータ必須チェック
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      logger.debug('[my/faqs] organizationId parameter required');
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
      logger.error('[my/faqs] Organization membership check failed', {
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
      logger.warn('[my/faqs] User not a member of organization', {
        userId: user.id,
        organizationId
      });
      return applyCookies(NextResponse.json({
        error: 'FORBIDDEN',
        message: 'この組織のメンバーではありません'
      }, { status: 403 }));
    }

    // FAQs取得（セキュアビュー経由）
    const { data, error } = await supabase
      .from('v_dashboard_faqs_secure')
      .select('id, question, slug, is_published, published_at, organization_id, status, answer, category, created_at, updated_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[my/faqs] Failed to fetch FAQs', {
        userId: user.id,
        organizationId,
        error: error.message
      });
      return applyCookies(NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      ));
    }

    return applyCookies(NextResponse.json({ data: data || [] }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[GET /api/my/faqs] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - 新しいFAQを作成
export async function POST(request: NextRequest) {
  try {
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    const body: FAQFormData & { organizationId?: string } = await request.json();

    // organizationId 必須チェック
    if (!body.organizationId) {
      logger.debug('[my/faqs] POST organizationId required');
      return applyCookies(NextResponse.json({ error: 'organizationId is required' }, { status: 400 }));
    }

    if (!body.question || !body.answer) {
      return applyCookies(NextResponse.json({
        error: '質問と回答は必須です'
      }, { status: 400 }));
    }

    // 組織メンバーシップチェック（RLSモデルに準拠）
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('organization_id', body.organizationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      logger.error('[my/faqs] POST Organization membership check failed', {
        userId: user.id,
        organizationId: body.organizationId,
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
      .eq('id', body.organizationId)
      .maybeSingle();

    if (orgError || !orgData) {
      logger.error('[my/faqs] POST Organization data fetch failed', {
        userId: user.id,
        organizationId: body.organizationId,
        error: orgError?.message
      });
      return applyCookies(NextResponse.json({
        error: 'INTERNAL_ERROR',
        message: '組織情報の取得に失敗しました'
      }, { status: 500 }));
    }

    // プラン制限チェック（Subject型 FeatureGate API使用）
    const subject: Subject = { type: 'org', id: orgData.id };

    try {
      // 1. 機能の有効/無効をチェック
      const effectiveFeatures = await getEffectiveFeatures(supabase, subject);
      const faqFeature = effectiveFeatures.find(f => f.feature_key === 'faq_module');

      if (faqFeature && (faqFeature.is_enabled === false || faqFeature.enabled === false)) {
        logger.info('[my/faqs] FAQ module disabled for org', { orgId: orgData.id });
        return applyCookies(NextResponse.json(
          {
            error: 'Feature disabled',
            code: 'DISABLED',
            message: 'FAQ機能は現在のプランでは利用できません。',
            plan: orgData.plan || 'trial'
          },
          { status: 403 }
        ));
      }

      // 2. Quota実行時強制: canExecute で消費チェック
      const idempotencyKey = `faq-create-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const quotaResult: QuotaResult = await canExecute(supabase, {
        subject,
        feature_key: 'faq_module',
        limit_key: 'max_count',
        amount: 1,
        period: 'total',
        idempotency_key: idempotencyKey,
      });

      logger.debug('[my/faqs] canExecute result', {
        orgId: orgData.id,
        quotaResult,
        idempotencyKey
      });

      // 3. Quota判定結果で分岐
      if (!quotaResult.ok) {
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

        return applyCookies(NextResponse.json(
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
        ));
      }

      logger.debug('[my/faqs] Quota check passed', {
        orgId: orgData.id,
        remaining: quotaResult.remaining,
        limit: quotaResult.limit
      });

    } catch (error) {
      // canExecute RPC が存在しない場合のフォールバック
      logger.warn('[my/faqs] canExecute failed, falling back to legacy check', { error });

      try {
        const featureLimit = await getFeatureLimit(orgData.id, 'faq_module');

        if (featureLimit !== null && featureLimit !== undefined) {
          const { count: currentCount, error: countError } = await supabase
            .from('faqs')
            .select('id', { count: 'exact' })
            .eq('organization_id', orgData.id);

          if (!countError && (currentCount || 0) >= featureLimit) {
            return applyCookies(NextResponse.json(
              {
                error: 'Plan limit exceeded',
                code: 'EXCEEDED',
                message: '上限に達しました。プランをアップグレードしてください。',
                currentCount,
                limit: featureLimit,
                plan: orgData.plan || 'trial'
              },
              { status: 429 }
            ));
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
      is_published: true,
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // INSERT
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

      // RLS エラーの場合は 403 を返す
      if (insertError.code === '42501' || insertError.message?.includes('RLS')) {
        return applyCookies(NextResponse.json({
          error: 'RLS_FORBIDDEN',
          message: 'Row Level Security によって拒否されました'
        }, { status: 403 }));
      }

      return applyCookies(NextResponse.json({
        error: 'FAQの作成に失敗しました',
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      }, { status: 500 }));
    }

    // INSERT成功後、改めてSELECTで取得
    let data = null;
    if (insertData?.id) {
      const { data: selectData, error: selectError } = await supabase
        .from('faqs')
        .select('id, organization_id, question, answer, category, sort_order, is_published, status, created_by, created_at, updated_at')
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
        data = { id: insertData.id, ...faqData };
      } else {
        data = selectData;
      }
    } else {
      data = faqData;
    }

    return applyCookies(NextResponse.json({ data }, { status: 201 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[POST /api/my/faqs] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
