/**
 * User Plan Retrieval - Real-time plan checking from database
 * 
 * ✅ FIXED: Replaces hardcoded 'free' plan checks with actual database lookups
 */

import { supabaseServer } from '@/lib/supabase-server';
import type { PlanType } from '@/config/plans';
import { logger } from '@/lib/utils/logger';

export interface UserPlanInfo {
  plan: PlanType;
  isActive: boolean;
  subscriptionId?: string;
  customerId?: string;
  currentPeriodEnd?: string;
}

/**
 * Get user's current plan from database (server-side)
 * 
 * @returns UserPlanInfo with actual plan data
 */
export async function getUserPlan(): Promise<UserPlanInfo> {
  try {
    const supabase = await supabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.warn('[getUserPlan] No authenticated user');
      return { plan: 'trial', isActive: false };
    }

    // Get user's organization with subscription info
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select(`
        id,
        plan,
        stripe_subscription_id,
        stripe_customer_id,
        current_period_end
      `)
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError) {
      logger.error('[getUserPlan] Error fetching organization:', orgError);
      return { plan: 'trial', isActive: false };
    }

    if (!organization) {
      logger.debug('Debug', '[getUserPlan] No organization found for user');
      return { plan: 'trial', isActive: false };
    }

    // If organization has Stripe subscription, check its status
    if (organization.stripe_subscription_id) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('stripe_subscription_id', organization.stripe_subscription_id)
        .maybeSingle();

      const isActive = subscription?.status === 'active';
      const plan = (organization.plan || 'trial') as PlanType;

      console.log(`[getUserPlan] Plan found: ${plan} (active: ${isActive})`);
      
      return {
        plan,
        isActive,
        subscriptionId: organization.stripe_subscription_id,
        customerId: organization.stripe_customer_id,
        currentPeriodEnd: subscription?.current_period_end || organization.current_period_end
      };
    }

    // Default to organization plan or free
    const plan = (organization.plan || 'trial') as PlanType;
    console.log(`[getUserPlan] Plan found (no subscription): ${plan}`);
    
    return {
      plan,
      isActive: plan !== 'trial',
      customerId: organization.stripe_customer_id
    };

  } catch (error) {
    logger.error('[getUserPlan] Unexpected error', error instanceof Error ? error : new Error(String(error)));
    return { plan: 'trial', isActive: false };
  }
}

/**
 * Client-side plan checking function
 * Note: For client components, pass plan data from server components
 */
export function getUserPlanClient(organizationData?: any): UserPlanInfo {
  if (!organizationData) {
    return { plan: 'trial', isActive: false };
  }

  const plan = (organizationData.plan || 'trial') as PlanType;
  const isActive = plan !== 'trial' && organizationData.stripe_subscription_id;
  
  return {
    plan,
    isActive,
    subscriptionId: organizationData.stripe_subscription_id,
    customerId: organizationData.stripe_customer_id,
    currentPeriodEnd: organizationData.current_period_end
  };
}

/**
 * Quick plan check for API routes
 */
export async function getCurrentUserPlan(): Promise<PlanType> {
  const planInfo = await getUserPlan();
  return planInfo.plan;
}