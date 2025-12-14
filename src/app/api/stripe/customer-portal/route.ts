import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { stripe } from '@/lib/stripe';
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

    // 組織の所有者かチェック
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, created_by')
      .eq('id', organizationId)
      .maybeSingle();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: '組織が見つかりません' },
        { status: 404 }
      );
    }

    if (organization.created_by !== (authResult as AuthContext).user.id) {
      return NextResponse.json(
        { error: '組織の所有者のみがアクセスできます' },
        { status: 403 }
      );
    }

    // Stripeカスタマー情報を取得
    const { data: stripeCustomer, error: customerError } = await supabase
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
    logger.error('Customer portal error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { error: 'カスタマーポータルセッションの作成に失敗しました' },
      { status: 500 }
    );
  }
}