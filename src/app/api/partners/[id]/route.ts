import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseServer();
    const partnerId = params.id;

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

    // アクセス権限チェック
    if (!['admin', 'partner_admin'].includes(appUser.role) && appUser.partner_id !== partnerId) {
      return NextResponse.json(
        { error: 'このパートナー情報へのアクセス権限がありません' },
        { status: 403 }
      );
    }

    // パートナー詳細情報取得
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select(`
        *,
        organizations!partner_id(
          id,
          name,
          slug,
          status,
          created_at,
          subscriptions!org_id(
            id,
            plan,
            status,
            stripe_customer_id,
            stripe_subscription_id,
            created_at,
            updated_at
          )
        )
      `)
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'パートナーが見つかりません' },
        { status: 404 }
      );
    }

    // 売上履歴の計算（デモ用）
    const generateRevenueHistory = () => {
      const months = ['2024-01', '2024-02', '2024-03', '2024-04'];
      return months.map(month => {
        const baseAmount = 100000 + Math.random() * 100000;
        const commission = baseAmount * (partner.commission_rate_mrr / 100);
        return {
          month,
          amount: Math.round(baseAmount),
          commission: Math.round(commission)
        };
      });
    };

    // 統計情報の計算
    const organizations = partner.organizations || [];
    const organizationCount = organizations.length;
    const activeOrganizations = organizations.filter((org: any) => org.status === 'published').length;
    
    // 月間売上の計算（仮の計算）
    const totalRevenue = organizations.reduce((sum: number, org: any) => {
      const activeSubscriptions = org.subscriptions?.filter((sub: any) => sub.status === 'active') || [];
      return sum + (activeSubscriptions.length * 50000); // 仮の月額
    }, 0);

    const partnerWithStats = {
      ...partner,
      organization_count: organizationCount,
      active_organizations: activeOrganizations,
      total_revenue: totalRevenue,
      revenue_history: generateRevenueHistory(),
      organizations: organizations.map((org: any) => ({
        ...org,
        monthly_revenue: (org.subscriptions?.filter((sub: any) => sub.status === 'active').length || 0) * 50000
      }))
    };

    return NextResponse.json({
      partner: partnerWithStats
    });

  } catch (error) {
    console.error('Partner detail API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseServer();
    const partnerId = params.id;

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

    // 更新権限チェック
    if (appUser.role !== 'admin' && appUser.partner_id !== partnerId) {
      return NextResponse.json(
        { error: 'このパートナーの更新権限がありません' },
        { status: 403 }
      );
    }

    const updateData = await request.json();
    const allowedFields = ['name', 'contact_email', 'brand_logo_url', 'commission_rate_init', 'commission_rate_mrr'];
    
    // 管理者のみが変更可能なフィールド
    if (appUser.role !== 'admin') {
      delete updateData.commission_rate_init;
      delete updateData.commission_rate_mrr;
    }

    // 許可されたフィールドのみ抽出
    const filteredUpdateData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    if (Object.keys(filteredUpdateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // パートナー情報更新
    const { data: updatedPartner, error: updateError } = await supabase
      .from('partners')
      .update(filteredUpdateData)
      .eq('id', partnerId)
      .select()
      .single();

    if (updateError) {
      console.error('Partner update error:', updateError);
      return NextResponse.json(
        { error: 'パートナー情報の更新に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      partner: updatedPartner,
      message: 'パートナー情報が正常に更新されました'
    });

  } catch (error) {
    console.error('Partner update API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseServer();
    const partnerId = params.id;

    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザーロール確認（削除は管理者のみ）
    const { data: appUser, error: userError } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !appUser || appUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'パートナー削除権限がありません' },
        { status: 403 }
      );
    }

    // 関連する組織の存在確認
    const { data: organizations, error: orgCheckError } = await supabase
      .from('organizations')
      .select('id')
      .eq('partner_id', partnerId);

    if (orgCheckError) {
      console.error('Organization check error:', orgCheckError);
      return NextResponse.json(
        { error: '関連組織の確認に失敗しました' },
        { status: 500 }
      );
    }

    if (organizations && organizations.length > 0) {
      return NextResponse.json(
        { 
          error: 'このパートナーには関連する組織があるため削除できません。先に組織を削除してください。',
          related_organizations: organizations.length
        },
        { status: 400 }
      );
    }

    // パートナー削除
    const { error: deleteError } = await supabase
      .from('partners')
      .delete()
      .eq('id', partnerId);

    if (deleteError) {
      console.error('Partner deletion error:', deleteError);
      return NextResponse.json(
        { error: 'パートナーの削除に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'パートナーが正常に削除されました'
    });

  } catch (error) {
    console.error('Partner deletion API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}