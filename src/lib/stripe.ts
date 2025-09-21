// Stripe configuration for future subscription implementation
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe.js with publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

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

// Future API routes structure
/*
/api/stripe/
  ├── checkout-session.ts     - Create checkout session
  ├── customer-portal.ts      - Customer portal redirect
  ├── webhooks.ts            - Handle Stripe webhooks
  └── subscription-status.ts  - Get current subscription
*/