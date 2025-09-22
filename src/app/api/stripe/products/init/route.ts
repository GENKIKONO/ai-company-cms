import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createAIOHubProducts, getAIOHubProducts } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabaseBrowser = await supabaseServer();

    // 管理者権限チェック
    const { data: { user }, error: authError } = await supabaseBrowser.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { data: appUser, error: userError } = await supabaseBrowser
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
    const existingProducts = await getAIOHubProducts();
    
    if (existingProducts && existingProducts.length >= 2) {
      return NextResponse.json({
        message: '商品は既に作成済みです',
        products: existingProducts.slice(0, 2).map(product => ({
          id: product.id,
          name: product.name,
          price_id: typeof product.default_price === 'object' && product.default_price ? product.default_price.id : '',
        })),
      });
    }

    // 新しい商品を作成
    const products = await createAIOHubProducts();

    // 商品情報をデータベースに保存
    const productsToSave = [];
    for (const productData of products) {
      productsToSave.push({
        stripe_product_id: productData.product.id,
        stripe_price_id: productData.price.id,
        product_type: productData.product.metadata?.planId === 'basic' ? 'monthly_fee' : 'setup_fee',
        name: productData.product.name,
        description: productData.product.description,
        amount: productData.price.unit_amount,
        currency: 'jpy',
        active: true,
        recurring_interval: productData.price.recurring ? 'month' : null,
      });
    }

    const { error: insertError } = await supabaseBrowser
      .from('stripe_products')
      .upsert(productsToSave, {
        onConflict: 'stripe_product_id'
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Stripeの商品は作成済みなので、データベースエラーでも成功として扱う
    }

    return NextResponse.json({
      success: true,
      message: 'Stripe商品を作成しました',
      products: products.map(productData => ({
        price_id: productData.price.id,
        amount: productData.price.unit_amount,
        product_id: productData.product.id,
        name: productData.product.name,
      })),
    });

  } catch (error) {
    console.error('Stripe products initialization error:', error);
    return NextResponse.json(
      { error: 'Stripe商品の作成に失敗しました' },
      { status: 500 }
    );
  }
}