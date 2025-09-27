import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getOrCreateCustomer, createCheckoutSession } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization (Single-Org Mode)
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('created_by', user.id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if required environment variables are set
    const priceId = process.env.STRIPE_PRICE_BASIC;
    if (!priceId) {
      return NextResponse.json({ error: 'Subscription plan not configured' }, { status: 400 });
    }

    // Get base URL for success/cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}