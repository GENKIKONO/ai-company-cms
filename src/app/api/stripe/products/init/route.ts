import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createLuxuCareProducts, getLuxuCareProducts } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer();

    // 管理者権限チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { data: appUser, error: userError } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || appUser?.role !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    // 既存の商品をチェック
    const existingProducts = await getLuxuCareProducts();
    
    if (existingProducts.setupPrice && existingProducts.monthlyPrice) {
      return NextResponse.json({
        message: '商品は既に作成済みです',
        products: {
          setupPrice: {
            id: existingProducts.setupPrice.id,
            amount: existingProducts.setupPrice.unit_amount,
          },
          monthlyPrice: {
            id: existingProducts.monthlyPrice.id,
            amount: existingProducts.monthlyPrice.unit_amount,
          },
        },
      });
    }

    // 新しい商品を作成
    const products = await createLuxuCareProducts();

    // 商品情報をデータベースに保存
    const { error: insertError } = await supabase
      .from('stripe_products')
      .upsert([
        {
          stripe_product_id: products.setupProduct.id,
          stripe_price_id: products.setupPrice.id,
          product_type: 'setup_fee',
          name: products.setupProduct.name,
          description: products.setupProduct.description,
          amount: products.setupPrice.unit_amount,
          currency: 'jpy',
          active: true,
        },
        {
          stripe_product_id: products.monthlyProduct.id,
          stripe_price_id: products.monthlyPrice.id,
          product_type: 'monthly_fee',
          name: products.monthlyProduct.name,
          description: products.monthlyProduct.description,
          amount: products.monthlyPrice.unit_amount,
          currency: 'jpy',
          active: true,
          recurring_interval: 'month',
        },
      ], {
        onConflict: 'stripe_product_id'
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Stripeの商品は作成済みなので、データベースエラーでも成功として扱う
    }

    return NextResponse.json({
      success: true,
      message: 'Stripe商品を作成しました',
      products: {
        setupPrice: {
          id: products.setupPrice.id,
          amount: products.setupPrice.unit_amount,
          product_id: products.setupProduct.id,
          name: products.setupProduct.name,
        },
        monthlyPrice: {
          id: products.monthlyPrice.id,
          amount: products.monthlyPrice.unit_amount,
          product_id: products.monthlyProduct.id,
          name: products.monthlyProduct.name,
        },
      },
    });

  } catch (error) {
    console.error('Stripe products initialization error:', error);
    return NextResponse.json(
      { error: 'Stripe商品の作成に失敗しました' },
      { status: 500 }
    );
  }
}