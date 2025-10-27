import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowserAdmin } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe';
import { logger } from '@/lib/utils/logger';

const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly_placeholder';
const SETUP_FEE_PRODUCT_ID = process.env.STRIPE_SETUP_FEE_PRODUCT_ID || 'prod_setup_placeholder';

interface CheckoutRequest {
  organization_id: string;
  setup_fee_amount?: number;
  notes?: string;
  plan_type: 'with_setup' | 'monthly_only';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseBrowserAdmin();
    
    // Note: In production, implement proper auth validation
    // For now, we'll proceed with the implementation

    const body = await request.json() as CheckoutRequest;
    const { organization_id, setup_fee_amount, notes, plan_type } = body;

    if (!organization_id || !plan_type) {
      return NextResponse.json(
        { error: 'Organization ID and plan type are required' },
        { status: 400 }
      );
    }

    // Validate organization exists
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, created_by')
      .eq('id', organization_id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if organization already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('org_id', organization_id)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Organization already has an active subscription' },
        { status: 400 }
      );
    }

    // Create or get Stripe customer
    let customerId: string;
    
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('organization_id', organization_id)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        metadata: {
          organization_id: organization_id,
          organization_name: organization.name,
        },
      });

      customerId = customer.id;

      // Save customer to database
      await supabase
        .from('stripe_customers')
        .insert({
          stripe_customer_id: customerId,
          organization_id: organization_id,
          email: '', // Will be updated when user provides email in checkout
        });
    }

    // Prepare line items for checkout
    const lineItems: any[] = [];

    // Add setup fee if requested
    if (plan_type === 'with_setup' && setup_fee_amount && setup_fee_amount > 0) {
      // Create one-time price for setup fee
      const setupFeePrice = await stripe.prices.create({
        product: SETUP_FEE_PRODUCT_ID,
        unit_amount: setup_fee_amount,
        currency: 'jpy',
        nickname: `Setup Fee - ${organization.name}`,
      });

      lineItems.push({
        price: setupFeePrice.id,
        quantity: 1,
      });
    }

    // Add monthly subscription
    lineItems.push({
      price: MONTHLY_PRICE_ID,
      quantity: 1,
    });

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?cancelled=true`,
      metadata: {
        organization_id: organization_id,
        setup_fee_amount: setup_fee_amount?.toString() || '0',
        plan_type,
        notes: notes || '',
        created_by: 'admin',
      },
      subscription_data: {
        metadata: {
          organization_id: organization_id,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: {
        enabled: true,
      },
    });

    // Note: Add business event tracking in production
    logger.debug('Checkout session created', {
      organization_id,
      plan_type,
      setup_fee_amount,
      checkout_session_id: checkoutSession.id,
    });

    return NextResponse.json({
      success: true,
      checkout_url: checkoutSession.url,
      checkout_session_id: checkoutSession.id,
    });

  } catch (error) {
    logger.error('Checkout creation error', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';