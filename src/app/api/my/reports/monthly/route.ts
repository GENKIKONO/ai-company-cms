import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canUseFeature } from '@/lib/org-features';

// レポート一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証ユーザーの組織IDを取得
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

    // 直近12ヶ月のレポート一覧を取得
    const { data: reports, error } = await supabase
      .from('ai_monthly_reports')
      .select(`
        id,
        plan_id,
        level,
        period_start,
        period_end,
        status,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .order('period_start', { ascending: false })
      .limit(12);

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