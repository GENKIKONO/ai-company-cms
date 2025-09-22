import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowserAdmin } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json(
        { error: '組織IDが必要です' },
        { status: 400 }
      );
    }

    const supabaseBrowser = supabaseBrowserAdmin();

    // 認証チェック
    const { data: { user }, error: authError } = await supabaseBrowser.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // 組織の所有者かチェック
    const { data: organization, error: orgError } = await supabaseBrowser
      .from('organizations')
      .select('id, name, created_by')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: '組織が見つかりません' },
        { status: 404 }
      );
    }

    if (organization.created_by !== user.id) {
      return NextResponse.json(
        { error: '組織の所有者のみがアクセスできます' },
        { status: 403 }
      );
    }

    // Stripeカスタマー情報を取得
    const { data: stripeCustomer, error: customerError } = await supabaseBrowser
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (customerError || !stripeCustomer) {
      return NextResponse.json(
        { error: 'サブスクリプション情報が見つかりません' },
        { status: 404 }
      );
    }

    // カスタマーポータルセッションを作成
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomer.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });

    return NextResponse.json({
      success: true,
      portal_url: session.url,
    });

  } catch (error) {
    console.error('Customer portal error:', error);
    return NextResponse.json(
      { error: 'カスタマーポータルセッションの作成に失敗しました' },
      { status: 500 }
    );
  }
}