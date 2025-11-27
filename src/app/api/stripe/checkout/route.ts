import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { stripe, getAIOHubProducts, createStripeCustomer } from '@/lib/stripe';
import { logger } from '@/lib/utils/logger';
import {
  requireAuth,
  requireSelfServeAccess,
  type AuthContext
} from '@/lib/api/auth-middleware';
import {
  handleApiError
} from '@/lib/api/error-responses';

export async function POST(request: NextRequest) {
  try {
    // 統一認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // セルフサーブアクセスチェック
    const selfServeCheck = requireSelfServeAccess(authResult as AuthContext);
    if (selfServeCheck) {
      return selfServeCheck;
    }

    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json(
        { error: '組織IDが必要です' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    // 組織情報を取得
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, owner_user_id, email, status')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: '組織が見つかりません' },
        { status: 404 }
      );
    }

    // 組織の所有者かチェック
    if (organization.owner_user_id !== (authResult as AuthContext).user.id) {
      return NextResponse.json(
        { error: '組織の所有者のみが決済できます' },
        { status: 403 }
      );
    }

    // 既存のサブスクリプションがないかチェック
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('organization_id', organizationId)
      .in('status', ['active', 'pending'])
      .maybeSingle();

    if (existingSubscription) {
      return NextResponse.json(
        { error: '既にアクティブなサブスクリプションが存在します' },
        { status: 400 }
      );
    }

    // 固定の価格IDを使用（実際の環境では環境変数で管理）
    const SETUP_PRICE_ID = process.env.STRIPE_SETUP_PRICE_ID || 'price_setup_example';
    const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly_example';
    
    if (!SETUP_PRICE_ID || !MONTHLY_PRICE_ID) {
      return NextResponse.json(
        { error: 'Stripe価格IDが設定されていません' },
        { status: 500 }
      );
    }

    // Stripe顧客を作成または取得
    let customerId: string;
    
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.stripe_customer_id;
    } else {
      const customer = await createStripeCustomer(
        organization.email || (authResult as AuthContext).user.email || '',
        organization.name
      );
      customerId = customer.id;

      // 顧客情報をデータベースに保存
      await supabase
        .from('stripe_customers')
        .insert({
          organization_id: organizationId,
          stripe_customer_id: customerId,
          email: organization.email || (authResult as AuthContext).user.email || '',
        });
    }

    // Checkout Sessionを作成
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: SETUP_PRICE_ID,
          quantity: 1,
        },
        {
          price: MONTHLY_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/organizations/${organizationId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/organizations/${organizationId}?payment=cancelled`,
      metadata: {
        organization_id: organizationId,
        user_id: (authResult as AuthContext).user.id,
      },
      subscription_data: {
        metadata: {
          organization_id: organizationId,
          service: 'aiohub_cms',
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      locale: 'ja',
    });

    return NextResponse.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
    });

  } catch (error) {
    logger.error('Stripe checkout error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { error: 'チェックアウトセッションの作成に失敗しました' },
      { status: 500 }
    );
  }
}