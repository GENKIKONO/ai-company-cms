/**
 * Billing Domain Types
 * 
 * 請求・決済関連の専用型
 */

// Subscription Types
export interface Subscription {
  id: string;
  organization_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: 'active' | 'pending' | 'paused' | 'cancelled';
  plan_id: string;
  current_period_start: string;
  current_period_end: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StripeCustomer {
  id: string;
  organization_id: string;
  stripe_customer_id: string;
  email: string;
  created_at: string;
  updated_at: string;
}