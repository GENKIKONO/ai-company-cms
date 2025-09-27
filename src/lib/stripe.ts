// Stripe configuration for subscription implementation
import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabase-server';
import type { Organization } from '@/types/database';

// Initialize Stripe.js with publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Initialize server-side Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export { stripePromise };

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'フリープラン',
    price: 0,
    priceId: '', // Will be set when Stripe products are created
    features: [
      '企業登録 最大5社',
      'サービス登録 最大10個',
      '導入事例 最大5件',
      '基本検索機能',
    ],
    limits: {
      maxOrganizations: 5,
      maxServices: 10,
      maxCaseStudies: 5,
    },
  },
  BASIC: {
    id: 'basic',
    name: 'ベーシックプラン',
    price: 2980,
    priceId: '', // Will be set when Stripe products are created
    features: [
      '企業登録 最大50社',
      'サービス登録 最大100個',
      '導入事例 最大50件',
      '高度な検索・フィルター機能',
      'データエクスポート機能',
      'メールサポート',
    ],
    limits: {
      maxOrganizations: 50,
      maxServices: 100,
      maxCaseStudies: 50,
    },
  },
  PREMIUM: {
    id: 'premium',
    name: 'プレミアムプラン',
    price: 9800,
    priceId: '', // Will be set when Stripe products are created
    features: [
      '企業登録 無制限',
      'サービス登録 無制限',
      '導入事例 無制限',
      'AI検索・推薦機能',
      'カスタムレポート',
      'API アクセス',
      '優先サポート',
      'カスタムブランディング',
    ],
    limits: {
      maxOrganizations: -1, // Unlimited
      maxServices: -1, // Unlimited
      maxCaseStudies: -1, // Unlimited
    },
  },
} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;

// Helper functions for subscription management
export const getCurrentPlan = (planId?: string): typeof SUBSCRIPTION_PLANS[SubscriptionPlanId] => {
  if (!planId) return SUBSCRIPTION_PLANS.FREE;
  return SUBSCRIPTION_PLANS[planId as SubscriptionPlanId] || SUBSCRIPTION_PLANS.FREE;
};

export const canCreateResource = (
  currentCount: number,
  planId: string,
  resourceType: 'organizations' | 'services' | 'caseStudies'
): boolean => {
  const plan = getCurrentPlan(planId);
  const limit = plan.limits[
    resourceType === 'organizations' ? 'maxOrganizations' :
    resourceType === 'services' ? 'maxServices' : 'maxCaseStudies'
  ];
  
  return limit === -1 || currentCount < limit;
};

// Stripe webhook types (for future implementation)
export interface StripeWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

// Helper functions for Stripe operations
export const getAIOHubProducts = async () => {
  try {
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    });
    return products.data;
  } catch (error) {
    console.error('Error fetching AIO Hub products:', error);
    return [];
  }
};

export const createAIOHubProducts = async () => {
  try {
    const products = [];
    
    for (const [planId, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
      if (planId === 'FREE') continue; // Skip free plan
      
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.features.join(', '),
        metadata: {
          planId: planId.toLowerCase(),
        },
      });
      
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price * 100, // Convert to cents
        currency: 'jpy',
        recurring: {
          interval: 'month',
        },
        metadata: {
          planId: planId.toLowerCase(),
        },
      });
      
      products.push({ product, price });
    }
    
    return products;
  } catch (error) {
    console.error('Error creating AIO Hub products:', error);
    throw error;
  }
};

export const createStripeCustomer = async (email: string, name?: string) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        source: 'aiohub_cms',
      },
    });
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
};

// Single-Org Mode specific functions

/**
 * Get or create a Stripe customer for an organization (Single-Org Mode)
 */
export async function getOrCreateCustomer(organization: Organization): Promise<string> {
  // If customer already exists, return it
  if (organization.stripe_customer_id) {
    return organization.stripe_customer_id;
  }

  try {
    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: organization.email || undefined,
      name: organization.name,
      metadata: {
        organization_id: organization.id,
        organization_slug: organization.slug,
      },
    });

    // Update organization with new customer ID
    const supabase = await supabaseServer();
    const { error } = await supabase
      .from('organizations')
      .update({ stripe_customer_id: customer.id })
      .eq('id', organization.id);

    if (error) {
      console.error('Failed to save customer ID to database:', error);
      throw new Error('Failed to save customer ID');
    }

    return customer.id;
  } catch (error) {
    console.error('Failed to create Stripe customer:', error);
    throw new Error('Failed to create customer');
  }
}

/**
 * Create a Stripe Billing Portal URL
 */
export async function getPortalUrl(customerId: string, returnUrl?: string): Promise<string> {
  const defaultReturnUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`
    : 'http://localhost:3000/dashboard/billing';

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: process.env.STRIPE_PORTAL_RETURN_URL || returnUrl || defaultReturnUrl,
    });

    return portalSession.url;
  } catch (error) {
    console.error('Failed to create portal session:', error);
    throw new Error('Failed to create portal session');
  }
}

interface CreateCheckoutSessionParams {
  priceId: string;
  customerId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create a Stripe Checkout Session
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<string> {
  const { priceId, customerId, successUrl, cancelUrl } = params;

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      automatic_tax: { enabled: false },
      metadata: {
        customer_id: customerId,
      },
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return session.url;
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

/**
 * Verify webhook signature (safe fallback if no secret)
 */
export function verifyWebhookSignature(body: string, signature: string): Stripe.Event | null {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not configured - webhook verification skipped');
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}

/**
 * Handle subscription status updates
 */
export async function updateSubscriptionInDB(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = subscription.customer as string;

    const supabase = await supabaseServer();
    
    // Find organization by customer ID
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (fetchError || !org) {
      console.error('Organization not found for customer:', customerId);
      return;
    }

    // Determine plan based on subscription status and items
    let plan: 'free' | 'basic' | 'pro' = 'free';
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      // For now, all paid subscriptions are 'basic'
      // Later can check subscription.items.data[0].price.id to determine plan
      plan = 'basic';
    }

    // Update organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        stripe_subscription_id: subscriptionId,
        subscription_status: subscription.status,
        plan: plan,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('id', org.id);

    if (updateError) {
      console.error('Failed to update subscription in database:', updateError);
    }
  } catch (error) {
    console.error('Failed to update subscription:', error);
  }
}

// Re-export plan limits for convenience
export { PLAN_LIMITS, type PlanType, type ResourceType } from '@/lib/plan-limits';