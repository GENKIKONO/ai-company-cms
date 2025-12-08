import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser, requireOrgMember } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
// TODO: [SUPABASE_PLAN_MIGRATION] このロジックは get_org_quota_usage RPC に寄せる想定
// 現在: getOrganizationPlanInfo() でStripe price_id → 静的制限値
// 提案: fetchOrgQuotaUsage(orgId, 'ai_interview') → plan_features ベースの動的制限値
import { getOrganizationPlanInfo } from '@/lib/billing/interview-credits';

/**
 * インタビュー質問数の使用状況取得API
 * フロントエンドが残り質問数を表示するために使用
 */

interface QuotaResponse {
  success: boolean;
  data?: {
    priceId: string | null;
    monthlyLimit: number;              // 常に数値（無制限は廃止）
    currentUsage: number;
    remainingQuestions: number;         // 常に数値（無制限は廃止）
    usagePercentage: number;           // 常に数値（無制限は廃止）
    isExceeded: boolean;
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<QuotaResponse>> {
  try {
    // 認証確認
    const user = await requireAuthUser();

    // URL パラメータからorganizationIdを取得
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'organization_id parameter is required'
        },
        { status: 400 }
      );
    }

    // UUID形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organizationId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid organization ID format'
        },
        { status: 400 }
      );
    }

    // 組織メンバー権限チェック
    try {
      await requireOrgMember(organizationId);
    } catch (error) {
      logger.warn('Unauthorized access to quota information:', { 
        organizationId, 
        userId: user.id,
        error
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden'
        },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // プラン情報と使用状況を取得
    const planInfo = await getOrganizationPlanInfo(supabase, organizationId);

    logger.debug('Quota information retrieved', {
      organizationId,
      userId: user.id,
      priceId: planInfo.priceId,
      currentUsage: planInfo.currentUsage,
      monthlyLimit: planInfo.monthlyLimit
    });

    return NextResponse.json({
      success: true,
      data: {
        priceId: planInfo.priceId,
        monthlyLimit: planInfo.monthlyLimit,
        currentUsage: planInfo.currentUsage,
        remainingQuestions: planInfo.remainingQuestions,
        usagePercentage: planInfo.usagePercentage,
        isExceeded: planInfo.isExceeded
      }
    });

  } catch (error) {
    logger.error('Quota API error:', error);

    // 認証エラーの場合
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required'
        },
        { status: 401 }
      );
    }

    // 組織メンバーアクセスエラーの場合
    if (error instanceof Error && (error.message.includes('Organization') || error.message.includes('Forbidden'))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden'
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