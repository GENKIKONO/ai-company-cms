import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();

    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザーロール確認
    const { data: appUser, error: userError } = await supabase
      .from('app_users')
      .select('role, partner_id')
      .eq('id', user.id)
      .single();

    if (userError || !appUser) {
      return NextResponse.json(
        { error: 'ユーザー情報が見つかりません' },
        { status: 404 }
      );
    }

    // 管理者権限チェック
    if (!['admin', 'partner_admin'].includes(appUser.role)) {
      return NextResponse.json(
        { error: 'パートナー管理権限がありません' },
        { status: 403 }
      );
    }

    // パートナー一覧取得（統計情報込み）
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select(`
        *,
        organizations!partner_id(
          id,
          name,
          status,
          created_at,
          subscriptions!org_id(
            plan,
            status
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (partnersError) {
      console.error('Partners fetch error:', partnersError);
      return NextResponse.json(
        { error: 'パートナー情報の取得に失敗しました' },
        { status: 500 }
      );
    }

    // 統計情報の計算
    const partnersWithStats = partners.map(partner => {
      const organizations = partner.organizations || [];
      const organizationCount = organizations.length;
      
      // 月間売上の計算（仮の計算、実際は subscriptions テーブルから算出）
      const totalRevenue = organizations.reduce((sum: number, org: any) => {
        const activeSubscriptions = org.subscriptions?.filter((sub: any) => sub.status === 'active') || [];
        return sum + (activeSubscriptions.length * 50000); // 仮の月額
      }, 0);

      return {
        ...partner,
        organization_count: organizationCount,
        total_revenue: totalRevenue,
        organizations: organizations
      };
    });

    return NextResponse.json({
      partners: partnersWithStats,
      total_count: partners.length
    });

  } catch (error) {
    console.error('Partners API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer();

    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザーロール確認
    const { data: appUser, error: userError } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !appUser || appUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'パートナー作成権限がありません' },
        { status: 403 }
      );
    }

    const { name, contact_email, subdomain, commission_rate_init, commission_rate_mrr, brand_logo_url } = await request.json();

    // 必須フィールドの検証
    if (!name || !contact_email || !subdomain) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています' },
        { status: 400 }
      );
    }

    // サブドメインの重複チェック
    const { data: existingPartner, error: checkError } = await supabase
      .from('partners')
      .select('id')
      .eq('subdomain', subdomain)
      .single();

    if (!checkError && existingPartner) {
      return NextResponse.json(
        { error: 'このサブドメインは既に使用されています' },
        { status: 400 }
      );
    }

    // パートナー作成
    const { data: newPartner, error: insertError } = await supabase
      .from('partners')
      .insert({
        name,
        contact_email,
        subdomain,
        commission_rate_init: commission_rate_init || 15.0,
        commission_rate_mrr: commission_rate_mrr || 10.0,
        brand_logo_url
      })
      .select()
      .single();

    if (insertError) {
      console.error('Partner creation error:', insertError);
      return NextResponse.json(
        { error: 'パートナーの作成に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      partner: newPartner,
      message: 'パートナーが正常に作成されました'
    }, { status: 201 });

  } catch (error) {
    console.error('Partner creation API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}