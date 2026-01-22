/**
 * /api/my/reports/monthly/[period] - レポート詳細取得
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
import { logger } from '@/lib/utils/logger';

// レポート詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ period: string }> }
) {
  try {
    const resolvedParams = await params;
    const { supabase, user, applyCookies } = await createApiAuthClient(request);

    // ユーザーの組織メンバーシップを取得（Supabase Q1回答準拠）
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
      // NOTE: AIレポート機能チェックでエラー時は禁止側に倒す
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

    // period (YYYY-MM) から period_start, period_end を生成
    const periodDate = parsePeriod(resolvedParams.period);
    if (!periodDate) {
      return applyCookies(
        NextResponse.json({ error: 'Invalid period format. Use YYYY-MM' }, { status: 400 })
      );
    }

    // レポート詳細を取得（.single()禁止 → .maybeSingle()で安全化）
    const { data: report, error } = await supabase
      .from('ai_monthly_reports')
      .select('id, organization_id, plan_id, level, period_start, period_end, status, summary_text, metrics, sections, suggestions, created_at, updated_at')
      .eq('organization_id', organizationId)
      .eq('period_start', periodDate.start)
      .eq('period_end', periodDate.end)
      .maybeSingle();

    if (error) {
      logger.error('Failed to query ai_monthly_reports detail:', { data: error });
      return applyCookies(
        NextResponse.json(
          {
            error: 'Failed to fetch report',
            details: error.message
          },
          { status: 500 }
        )
      );
    }

    // .maybeSingle()はデータなしでもerrorにならないため明示的null分岐
    if (!report) {
      return applyCookies(
        NextResponse.json({ error: 'Report not found' }, { status: 404 })
      );
    }

    return applyCookies(
      NextResponse.json({
        report: {
          id: report.id,
          plan_id: report.plan_id,
          level: report.level,
          period_start: report.period_start,
          period_end: report.period_end,
          status: report.status,
          summary_text: report.summary_text,
          metrics: report.metrics,
          sections: report.sections,
          suggestions: report.suggestions,
          created_at: report.created_at,
          updated_at: report.updated_at,
        }
      })
    );

  } catch (error) {
    // ApiAuthException のハンドリング
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('Failed to fetch monthly report:', { data: error });
    return NextResponse.json(
      {
        error: 'Failed to fetch report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// YYYY-MM形式をperiod_start, period_endに変換
function parsePeriod(period: string): { start: string; end: string } | null {
  const match = period.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const [, year, month] = match;
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0); // 月の最終日

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
}
