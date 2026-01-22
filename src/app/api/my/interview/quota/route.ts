/**
 * /api/my/interview/quota - インタビュー質問数使用状況取得API
 *
 * 【認証方式】
 * - createApiAuthClient を使用（統一認証ヘルパー）
 * - getUser() が唯一の Source of Truth
 * - Cookie 同期は applyCookies で行う
 *
 * NOTE: 新実装（Supabase RPC ベース）
 * - 旧実装: Stripe price_id → 静的制限値
 * - 新実装: get_org_quota_usage RPC → plan_features ベースの動的制限値
 * - 無制限は -1 で表現（既存フロントエンド互換性のため）
 *
 * @see src/lib/supabase/api-auth.ts
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClient, ApiAuthException, ApiAuthFailure } from '@/lib/supabase/api-auth';
import { logger } from '@/lib/utils/logger';
import { validateOrgAccess, OrgAccessError } from '@/lib/utils/org-access';
import { fetchOrgQuotaUsage } from '@/lib/featureGate';

interface QuotaResponse {
  success: boolean;
  data?: {
    priceId: string | null;
    monthlyLimit: number;              // -1: 無制限, 0以上: 制限値
    currentUsage: number;
    remainingQuestions: number;         // -1: 無制限, 0以上: 残り数
    usagePercentage: number;           // 無制限時は 0
    isExceeded: boolean;
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<QuotaResponse | ApiAuthFailure>> {
  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(request);

    // URL パラメータからorganizationIdを取得
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return applyCookies(NextResponse.json(
        {
          success: false,
          error: 'organization_id parameter is required'
        },
        { status: 400 }
      ));
    }

    // UUID形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organizationId)) {
      return applyCookies(NextResponse.json(
        {
          success: false,
          error: 'Invalid organization ID format'
        },
        { status: 400 }
      ));
    }

    // 組織メンバー権限チェック
    try {
      await validateOrgAccess(organizationId, user.id, 'read');
    } catch (error) {
      if (error instanceof OrgAccessError) {
        logger.warn('Unauthorized access to quota information:', {
          organizationId,
          userId: user.id
        });
        return applyCookies(NextResponse.json(
          {
            success: false,
            error: 'Forbidden'
          },
          { status: error.statusCode }
        ));
      }
      throw error;
    }

    // 新しいRPCベースのクオータ取得
    const quotaResult = await fetchOrgQuotaUsage(organizationId, 'ai_interview');

    if (quotaResult.error) {
      // 権限エラーの場合
      if (quotaResult.error.type === 'permission') {
        logger.warn('RLS permission error in interview quota API:', {
          organizationId,
          userId: user.id,
          error: quotaResult.error.message
        });
        return applyCookies(NextResponse.json(
          {
            success: false,
            error: quotaResult.error.message
          },
          { status: 403 }
        ));
      }

      // その他のエラー
      logger.error('Error fetching interview quota:', {
        organizationId,
        userId: user.id,
        error: quotaResult.error.message
      });
      return applyCookies(NextResponse.json(
        {
          success: false,
          error: quotaResult.error.message
        },
        { status: 500 }
      ));
    }

    if (!quotaResult.data) {
      logger.error('No quota data returned for interview:', {
        organizationId,
        userId: user.id
      });
      return applyCookies(NextResponse.json(
        {
          success: false,
          error: 'クオータ情報の取得に失敗しました'
        },
        { status: 500 }
      ));
    }

    const quota = quotaResult.data;

    // レスポンス形式を既存APIと互換性を保つよう変換
    const monthlyLimit = quota.limits.unlimited ? Number.POSITIVE_INFINITY : quota.limits.effectiveLimit;
    const currentUsage = quota.usage.usedInWindow;
    const remainingQuestions = quota.limits.unlimited ? Number.POSITIVE_INFINITY : quota.usage.remaining;
    const usagePercentage = quota.limits.unlimited ? 0 : Math.round((currentUsage / quota.limits.effectiveLimit) * 100);
    const isExceeded = !quota.limits.unlimited && currentUsage >= quota.limits.effectiveLimit;

    logger.debug('Quota information retrieved via RPC', {
      organizationId,
      userId: user.id,
      featureKey: 'ai_interview',
      currentUsage,
      monthlyLimit: quota.limits.unlimited ? 'unlimited' : quota.limits.effectiveLimit
    });

    return applyCookies(NextResponse.json({
      success: true,
      data: {
        priceId: quota.plan || null, // プランIDをそのまま使用（後方互換性のため）
        monthlyLimit: quota.limits.unlimited ? -1 : quota.limits.effectiveLimit, // -1 で無制限を表現
        currentUsage,
        remainingQuestions: quota.limits.unlimited ? -1 : quota.usage.remaining, // -1 で無制限を表現
        usagePercentage,
        isExceeded
      }
    }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('Quota API error:', error);

    // 組織メンバーアクセスエラーやRLS権限エラーの場合
    if (error instanceof Error && (
      error.message.includes('Organization') ||
      error.message.includes('Forbidden') ||
      error.message.includes('42501') ||
      error.message.includes('insufficient_privilege')
    )) {
      return NextResponse.json(
        {
          success: false,
          error: 'この組織のクオータ情報にアクセスする権限がありません'
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// 他のHTTPメソッドは拒否
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}
