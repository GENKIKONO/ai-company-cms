import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCustomer, createCheckoutSession } from '@/lib/stripe';
import { env } from '@/lib/env';
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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Get user's organization (Single-Org Mode)
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('created_by', (authResult as AuthContext).user.id)
      .single();

    if (orgError || !organization) {
      return notFoundError('Organization');
    }

    // Check if required environment variables are set - use unified basic price ID
    const priceId = env.STRIPE_BASIC_PRICE_ID;
    if (!priceId) {
      return createErrorResponse('MISSING_CONFIG', 'Subscription plan not configured', 400);
    }

    // Get base URL for success/cancel URLs
    const baseUrl = env.APP_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/dashboard/billing?success=1`;
    const cancelUrl = `${baseUrl}/dashboard/billing?canceled=1`;

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(organization);

    // Create checkout session
    const checkoutUrl = await createCheckoutSession({
      priceId,
      customerId,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json(
      { url: checkoutUrl },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate'
        }
      }
    );
  } catch (error) {
    console.error('[POST /api/billing/checkout] Checkout session creation failed:', error);
    return handleApiError(error);
  }
}