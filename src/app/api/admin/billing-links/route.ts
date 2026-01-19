import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { handleApiError, handleDatabaseError, validationError } from '@/lib/api/error-responses';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    // リンク一覧を取得
    const { data, error } = await supabase
      .from('billing_checkout_links')
      .select(`
        id,
        label,
        plan_type,
        stripe_price_id,
        stripe_checkout_url,
        discount_rate,
        campaign_type,
        start_at,
        end_at,
        is_active,
        is_public,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch billing checkout links', { data: error instanceof Error ? error : new Error(String(error)) });
      return handleDatabaseError(error);
    }

    return NextResponse.json({ data });

  } catch (error) {
    logger.error('GET /api/admin/billing-links error', { data: error instanceof Error ? error : new Error(String(error)) });
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    const body = await request.json();
    const { label, plan_type, stripe_price_id, stripe_checkout_url, discount_rate, campaign_type, start_at, end_at, is_public } = body;

    // 必須フィールドチェック
    const missingFields: { field: string; message: string }[] = [];
    if (!label) missingFields.push({ field: 'label', message: 'Label is required' });
    if (!plan_type) missingFields.push({ field: 'plan_type', message: 'Plan type is required' });
    if (!stripe_price_id) missingFields.push({ field: 'stripe_price_id', message: 'Stripe price ID is required' });
    if (!campaign_type) missingFields.push({ field: 'campaign_type', message: 'Campaign type is required' });

    if (missingFields.length > 0) {
      return validationError(missingFields);
    }

    // 新規リンク作成 - untyped client, no cast needed
    const { data, error } = await supabase
      .from('billing_checkout_links')
      .insert([{
        label,
        plan_type,
        stripe_price_id,
        stripe_checkout_url,
        discount_rate: discount_rate || 0,
        campaign_type,
        start_at,
        end_at,
        is_public: is_public !== false,
        created_by: authResult.userId
      }])
      .select()
      .single();

    if (error) {
      logger.error('Failed to create billing checkout link', { data: error instanceof Error ? error : new Error(String(error)) });
      return handleDatabaseError(error);
    }

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    logger.error('POST /api/admin/billing-links error', { data: error instanceof Error ? error : new Error(String(error)) });
    return handleApiError(error);
  }
}