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
    name: 'Free',
    price: 0,
    priceId: '', // Will be set when Stripe products are created
    features: [
      'サービス登録：1件まで',
      'Q&A項目：5件まで',
      'Hub上での公開のみ',
      'SEO最適化・構造化データ自動生成',
    ],
    limits: {
      maxServices: 1,
      maxQAItems: 5,
      maxMaterials: 0,
      maxOrganizations: 1,
      maxCaseStudies: 2,
      maxPosts: 5,
      maxFaqs: 5,
    },
  },
  BASIC: {
    id: 'basic',
    name: 'Basic',
    price: 5000,
    priceId: '', // Will be set when Stripe products are created
    features: [
      'サービス登録：10件まで',
      'Q&A項目：20件まで',
      '営業資料添付（最大5個）',
      '外部リンク表示機能',
      'カテゴリタグ検索対応',
      'メールサポート',
    ],
    limits: {
      maxServices: 10,
      maxQAItems: 20,
      maxMaterials: 5,
      maxOrganizations: 1,
      maxCaseStudies: 10,
      maxPosts: 50,
      maxFaqs: 20,
    },
  },
  BUSINESS: {
    id: 'business',
    name: 'Business',
    price: 15000,
    priceId: '', // Will be set when Stripe products are created
    features: [
      'サービス登録：50件まで',
      'Q&A項目：無制限',
      '営業資料添付（最大20個）',
      'Verified法人バッジ',
      '承認フロー機能',
      '認証バッジ機能',
      'AI解析レポート（基本版）',
      'システム監視機能',
      '優先サポート・個別相談',
    ],
    limits: {
      maxServices: 50,
      maxQAItems: -1,
      maxMaterials: 20,
      maxOrganizations: 1,
      maxCaseStudies: -1,
      maxPosts: -1,
      maxFaqs: -1,
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 30000,
    priceId: '', // Will be set when Stripe products are created
    features: [
      'すべての機能無制限',
      'SVG対応大サイズロゴ',
      'AI解析レポート（拡張版）',
      'カスタム機能開発',
      '専任サポート',
      'SLA保証',
      'ホワイトラベル対応',
      'API優先アクセス',
    ],
    limits: {
      maxServices: -1,
      maxQAItems: -1,
      maxMaterials: -1,
      maxOrganizations: 1,
      maxCaseStudies: -1,
      maxPosts: -1,
      maxFaqs: -1,
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
    let plan: 'free' | 'basic' | 'business' | 'enterprise' = 'free';
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
export { PLAN_LIMITS, type PlanType } from '@/config/plans';