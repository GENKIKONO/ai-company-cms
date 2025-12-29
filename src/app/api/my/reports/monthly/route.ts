import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { canUseFeature } from '@/lib/featureGate';

// レポート一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証チェック（Core経由）
    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーの組織メンバーシップを取得（Supabase Q1回答準拠）
    const { data: membershipData } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
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

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '12', 10);

    // 直近のレポート一覧を取得
    const { data: reports, error } = await supabase
      .from('ai_monthly_reports')
      .select(`
        id,
        plan_id,
        level,
        period_start,
        period_end,
        status,
        metrics,
        summary_text,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .order('period_start', { ascending: false })
      .limit(Math.min(limit, 50));

    if (error) {
      console.error('Failed to query ai_monthly_reports:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch reports',
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reports: reports || [],
      organization_id: organizationId,
    });

  } catch (error) {
    console.error('Failed to fetch monthly reports:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch reports',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}