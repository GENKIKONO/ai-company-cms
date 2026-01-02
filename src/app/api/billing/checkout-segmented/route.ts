import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCustomer, createCheckoutSession } from '@/lib/stripe';
import { env } from '@/lib/env';
import { getStripePriceIdForUser, type PlanTier, type PurchaseIntent } from '@/lib/pricing/segment-pricing';
import {
  requireAuth,
  requireSelfServeAccess,
  type AuthContext
} from '@/lib/api/auth-middleware';
import {
  handleApiError,
  notFoundError,
  createErrorResponse
} from '@/lib/api/error-responses';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CheckoutRequest {
  planTier: PlanTier;
  intent: PurchaseIntent;
}

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
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );

    // リクエストボディの解析
    const { planTier, intent }: CheckoutRequest = await request.json();

    // バリデーション
    if (!planTier || !['basic', 'pro', 'business'].includes(planTier)) {
      return createErrorResponse('INVALID_PLAN_TIER', 'Invalid plan tier', 400);
    }

    if (!intent || !['first_purchase', 'upgrade'].includes(intent)) {
      return createErrorResponse('INVALID_INTENT', 'Invalid purchase intent', 400);
    }

    // Get user's organization (Single-Org Mode)
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('created_by', (authResult as AuthContext).user.id)
      .single();

    if (orgError || !organization) {
      return notFoundError('Organization');
    }

    // ユーザー情報を取得（segmentフィールド含む）
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name, segment')
      .eq('id', (authResult as AuthContext).user.id)
      .single();

    if (userError || !userProfile) {
      logger.warn('User profile not found, using auth user data', {
        userId: (authResult as AuthContext).user.id,
        error: userError
      });
    }

    // ユーザーオブジェクトを構築（segment含む）
    const user = {
      id: (authResult as AuthContext).user.id,
      email: (authResult as AuthContext).user.email || '',
      full_name: userProfile?.full_name || (authResult as AuthContext).user.user_metadata?.full_name,
      segment: userProfile?.segment || 'normal_user'
    } as const;

    // セグメントベース価格決定
    const priceId = getStripePriceIdForUser(user, planTier, intent);
    
    if (!priceId) {
      logger.error('Price ID not found for user segment', {
        userId: user.id,
        segment: user.segment,
        planTier,
        intent
      });
      return createErrorResponse('MISSING_PRICE_CONFIG', 'Pricing configuration not found', 500);
    }

    // Get base URL for success/cancel URLs
    const baseUrl = env.APP_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/dashboard/billing?success=1&plan=${planTier}&intent=${intent}`;
    const cancelUrl = `${baseUrl}/dashboard/billing?canceled=1&plan=${planTier}`;

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(organization);

    logger.info('Creating segmented checkout session', {
      userId: user.id,
      organizationId: organization.id,
      segment: user.segment,
      planTier,
      intent,
      priceId,
      customerId
    });

    // Create checkout session with selected price
    const checkoutUrl = await createCheckoutSession({
      priceId,
      customerId,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json(
      { 
        url: checkoutUrl,
        segmentInfo: {
          segment: user.segment,
          planTier,
          intent,
          appliedPricing: user.segment !== 'normal_user' && intent === 'first_purchase' ? 'discounted' : 'normal'
        }
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate'
        }
      }
    );
  } catch (error) {
    logger.error('[POST /api/billing/checkout-segmented] Segmented checkout session creation failed', { 
      data: error instanceof Error ? error : new Error(String(error)) 
    });
    return handleApiError(error);
  }
}