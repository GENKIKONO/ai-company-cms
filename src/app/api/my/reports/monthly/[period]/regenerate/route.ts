import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canUseFeature } from '@/lib/org-features';
import { requestRegenerateMonthlyReportRpc } from '@/lib/reports/monthly-report-service';
import { logger } from '@/lib/utils/logger';

// レポート再生成（RPC版）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ period: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = await createClient();

    // 認証チェック
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーの組織メンバーシップを取得
    const { data: membershipData } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!membershipData?.organization_id) {
      return NextResponse.json({ error: 'Organization membership not found' }, { status: 404 });
    }

    const organizationId = membershipData.organization_id;

    // AIレポート機能のアクセス制御チェック
    try {
      const canUse = await canUseFeature(organizationId, 'ai_reports');

      if (!canUse) {
        return NextResponse.json(
          {
            error: 'FeatureNotAvailable',
            message: 'ご利用中のプランではAIレポート機能はご利用いただけません。'
          },
          { status: 403 }
        );
      }
    } catch (error) {
      logger.error('AI reports feature check failed:', { data: error });
      return NextResponse.json(
        {
          error: 'FeatureCheckFailed',
          message: '機能チェックに失敗しました。しばらくしてからお試しください。'
        },
        { status: 403 }
      );
    }

    // period (YYYY-MM) からyear/monthを抽出
    const periodDate = parsePeriod(resolvedParams.period);
    if (!periodDate) {
      return NextResponse.json({ error: 'Invalid period format. Use YYYY-MM' }, { status: 400 });
    }

    // RPC経由でレポート再生成をリクエスト
    const { result, error: rpcError } = await requestRegenerateMonthlyReportRpc({
      organizationId,
      year: periodDate.year,
      month: periodDate.month
    });

    if (rpcError) {
      logger.error('RPC regenerate failed:', { data: { rpcError, organizationId, ...periodDate } });
      return NextResponse.json(
        {
          error: 'Failed to regenerate report',
          details: rpcError
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Report regeneration requested successfully',
      result
    });

  } catch (error) {
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
