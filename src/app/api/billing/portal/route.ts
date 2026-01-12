import { NextRequest, NextResponse } from 'next/server';
import { getPortalUrl } from '@/lib/stripe';
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
import { logger } from '@/lib/utils/logger';

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

    // Get user's organization via organization_members
    const { data: membershipData, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', (authResult as AuthContext).user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError || !membershipData) {
      return notFoundError('Organization membership');
    }

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', membershipData.organization_id)
      .single();

    if (orgError || !organization) {
      return notFoundError('Organization');
    }

    if (!organization.stripe_customer_id) {
      return createErrorResponse('NO_STRIPE_CUSTOMER', 'No Stripe customer found', 400);
    }

    // Get return URL from request body or use default
    const baseUrl = env.APP_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/dashboard/billing`;

    // Create portal URL
    const portalUrl = await getPortalUrl(organization.stripe_customer_id, returnUrl);

    return NextResponse.json(
      { url: portalUrl },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate'
        }
      }
    );
  } catch (error) {
    logger.error('[POST /api/billing/portal] Portal session creation failed', { data: error instanceof Error ? error : new Error(String(error)) });
    return handleApiError(error);
  }
}