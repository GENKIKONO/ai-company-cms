import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AiReportGenerator } from '@/lib/ai-reports/generator';
import { canUseFeature } from '@/lib/org-features';

// レポート再生成
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

    // 組織プラン確認（プラン別の再生成制限を実装する場合）
    const { data: org } = await supabase
      .from('organizations')
      .select('plan')
      .eq('id', organizationId)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // TODO: 再生成回数制限チェック（仕様書: 1組織/1ヶ月あたり3回程度）
    // 現時点では省略し、コメントで残す
    
    // period (YYYY-MM) から period_start, period_end を生成
    const periodDate = parsePeriod(resolvedParams.period);
    if (!periodDate) {
      return NextResponse.json({ error: 'Invalid period format. Use YYYY-MM' }, { status: 400 });
    }

    // レポート再生成実行
    const generator = new AiReportGenerator();
    const reportData = await generator.regenerateReport(
      organizationId,
      periodDate.start,
      periodDate.end
    );

    return NextResponse.json({
      success: true,
      message: 'Report regenerated successfully',
      report: {
        organization_id: reportData.organization_id,
        plan_id: reportData.plan_id,
        level: reportData.level,
        period_start: reportData.period_start,
        period_end: reportData.period_end,
        status: 'ready',
      }
    });

  } catch (error) {
    console.error('Failed to regenerate monthly report:', error);
    
    // エラー時はai_monthly_reportsのstatusをfailedに更新
    try {
      const supabase = await createClient();
      const resolvedParams = await params;
      const periodDate = parsePeriod(resolvedParams.period);
      
      if (periodDate) {
        await supabase
          .from('ai_monthly_reports')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('period_start', periodDate.start)
          .eq('period_end', periodDate.end);
      }
    } catch (updateError) {
      console.error('Failed to update failed status:', updateError);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to regenerate report',
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