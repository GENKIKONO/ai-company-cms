import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { handleApiError, handleDatabaseError } from '@/lib/api/error-responses';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'daily';
    const days = parseInt(searchParams.get('days') || '30');
    const campaign_type = searchParams.get('campaign_type');

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { data, error } = await supabase.rpc('get_billing_trends', {
      p_period: period,
      p_days: days,
      p_filter_campaign_type: campaign_type
    });

    if (error) {
      return handleDatabaseError(error);
    }

    return NextResponse.json({ trends: data || [], period_days: days });
  } catch (error) {
    return handleApiError(error);
  }
}