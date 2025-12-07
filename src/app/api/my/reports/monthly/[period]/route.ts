import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canUseFeature } from '@/lib/org-features';

// レポート詳細取得
export async function GET(
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

    // ユーザーの組織メンバーシップを取得（Supabase Q1回答準拠）
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
      console.error('AI reports feature check failed:', error);
      // NOTE: AIレポート機能チェックでエラー時は禁止側に倒す
      return NextResponse.json(
        {
          error: 'FeatureCheckFailed',
          message: '機能チェックに失敗しました。しばらくしてからお試しください。'
        },
        { status: 403 }
      );
    }

    // period (YYYY-MM) から period_start, period_end を生成
    const periodDate = parsePeriod(resolvedParams.period);
    if (!periodDate) {
      return NextResponse.json({ error: 'Invalid period format. Use YYYY-MM' }, { status: 400 });
    }

    // レポート詳細を取得
    const { data: report, error } = await supabase
      .from('ai_monthly_reports')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('period_start', periodDate.start)
      .eq('period_end', periodDate.end)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({
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
    });

  } catch (error) {
    console.error('Failed to fetch monthly report:', error);
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