/**
 * /api/my/reports/monthly/[period]/regenerate - レポート再生成（RPC版）
 * 【認証方式】
 * - createApiAuthClient を使用（統一認証ヘルパー）
 * - getUser() が唯一の Source of Truth
 * - Cookie 同期は applyCookies で行う
 * @see src/lib/supabase/api-auth.ts
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';
import { canUseFeature } from '@/lib/featureGate';
import { requestRegenerateMonthlyReportRpc } from '@/lib/reports/monthly-report-service';
import { logger } from '@/lib/utils/logger';

// レポート再生成（RPC版）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ period: string }> }
) {
  try {
    const resolvedParams = await params;
    const { supabase, user, applyCookies } = await createApiAuthClient(request);

    // ユーザーの組織メンバーシップを取得
    const { data: membershipData } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membershipData?.organization_id) {
      return applyCookies(
        NextResponse.json({ error: 'Organization membership not found' }, { status: 404 })
      );
    }

    const organizationId = membershipData.organization_id;

    // AIレポート機能のアクセス制御チェック
    try {
      const canUse = await canUseFeature(organizationId, 'ai_reports');

      if (!canUse) {
        return applyCookies(
          NextResponse.json(
            {
              error: 'FeatureNotAvailable',
              message: 'ご利用中のプランではAIレポート機能はご利用いただけません。'
            },
            { status: 403 }
          )
        );
      }
    } catch (error) {
      logger.error('AI reports feature check failed:', { data: error });
      return applyCookies(
        NextResponse.json(
          {
            error: 'FeatureCheckFailed',
            message: '機能チェックに失敗しました。しばらくしてからお試しください。'
          },
          { status: 403 }
        )
      );
    }

    // period (YYYY-MM) からyear/monthを抽出
    const periodDate = parsePeriod(resolvedParams.period);
    if (!periodDate) {
      return applyCookies(
        NextResponse.json({ error: 'Invalid period format. Use YYYY-MM' }, { status: 400 })
      );
    }

    // RPC経由でレポート再生成をリクエスト
    const { result, error: rpcError } = await requestRegenerateMonthlyReportRpc({
      organizationId,
      year: periodDate.year,
      month: periodDate.month
    });

    if (rpcError) {
      logger.error('RPC regenerate failed:', { data: { rpcError, organizationId, ...periodDate } });
      return applyCookies(
        NextResponse.json(
          {
            error: 'Failed to regenerate report',
            details: rpcError
          },
          { status: 500 }
        )
      );
    }

    return applyCookies(
      NextResponse.json({
        success: true,
        message: 'Report regeneration requested successfully',
        result
      })
    );

  } catch (error) {
    // ApiAuthException のハンドリング
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('Failed to regenerate monthly report:', { data: error });
    return NextResponse.json(
      {
        error: 'Failed to regenerate report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// YYYY-MM形式からyear/monthを抽出
function parsePeriod(period: string): { year: number; month: number } | null {
  const match = period.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const [, yearStr, monthStr] = match;
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10)
  };
}
