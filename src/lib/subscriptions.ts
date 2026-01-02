'use client';

import { supabaseBrowser } from '@/lib/supabase/client';
import type { Subscription } from '@/types/domain/billing';
import type { Organization } from '@/types/legacy/database';;
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { logger } from '@/lib/utils/logger';

// ユーザーのサブスクリプション情報取得
export async function getUserSubscription(userId: string) {
  try {
    const { data, error } = await supabaseBrowser
      .from('subscriptions')
      .select(`
        *,
        organization:organizations(id, name, slug)
      `)
      .eq('organization.created_by', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('Error fetching user subscription', { data: error instanceof Error ? error : new Error(String(error)) });
    return { data: null, error };
  }
}

// 組織のサブスクリプション情報取得
export async function getOrganizationSubscription(organizationId: string) {
  try {
    const { data, error } = await supabaseBrowser
      .from('subscriptions')
      .select('id, organization_id, plan_id, status, current_period_start, current_period_end, stripe_subscription_id, stripe_customer_id, cancel_at_period_end, created_at, updated_at')
      .eq('organization_id', organizationId)
      .in('status', ['active', 'pending'])
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('Error fetching organization subscription', { data: error instanceof Error ? error : new Error(String(error)) });
    return { data: null, error };
  }
}

// サブスクリプション統計取得
export async function getSubscriptionStats(userId: string) {
  try {
    // ユーザーが所有する組織の情報を取得
    const { data: organizations, error: orgError } = await supabaseBrowser
      .from('organizations')
      .select(`
        id,
        name,
        status,
        created_at,
        services(count),
        case_studies(count),
        faqs(count)
      `)
      .eq('created_by', userId);

    if (orgError) throw orgError;

    const stats = {
      totalOrganizations: organizations?.length || 0,
      publishedOrganizations: organizations?.filter(org => org.status === 'published').length || 0,
      totalServices: organizations?.reduce((sum, org) => sum + (org.services?.[0]?.count || 0), 0) || 0,
      totalCaseStudies: organizations?.reduce((sum, org) => sum + (org.case_studies?.[0]?.count || 0), 0) || 0,
      totalFaqs: organizations?.reduce((sum, org) => sum + (org.faqs?.[0]?.count || 0), 0) || 0,
    };

    return { data: stats, error: null };
  } catch (error) {
    logger.error('Error fetching subscription stats', { data: error instanceof Error ? error : new Error(String(error)) });
    return { data: null, error };
  }
}

// プラン制限チェック
export async function checkPlanLimits(userId: string, resourceType: 'organizations' | 'services' | 'case_studies' | 'faqs') {
  try {
    // ユーザーのサブスクリプション取得
    const { data: subscription } = await getUserSubscription(userId);
    const planId = subscription?.plan_id || 'trial';
    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.FREE;

    // 現在の使用量取得
    const { data: stats } = await getSubscriptionStats(userId);
    if (!stats) return { allowed: false, error: 'Usage data not available' };

    let currentCount = 0;
    let limit = 0;

    switch (resourceType) {
      case 'organizations':
        currentCount = stats.totalOrganizations;
        limit = plan.limits.maxOrganizations;
        break;
      case 'services':
        currentCount = stats.totalServices;
        limit = plan.limits.maxServices;
        break;
      case 'case_studies':
        currentCount = stats.totalCaseStudies;
        limit = plan.limits.maxCaseStudies;
        break;
      case 'faqs':
        currentCount = stats.totalFaqs;
        limit = plan.limits.maxCaseStudies; // FAQs use same limit as case studies for now
        break;
    }

    const allowed = limit === -1 || currentCount < limit;
    
    return {
      allowed,
      currentCount,
      limit: limit === -1 ? '無制限' : limit,
      planName: plan.name,
      error: null
    };
  } catch (error) {
    logger.error('Error checking plan limits', { data: error instanceof Error ? error : new Error(String(error)) });
    return { allowed: false, error };
  }
}

// Stripeカスタマーポータルセッション作成
export async function createCustomerPortalSession(organizationId: string) {
  try {
    const response = await fetch('/api/stripe/customer-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ organizationId }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create customer portal session');
    }

    return { data, error: null };
  } catch (error) {
    logger.error('Error creating customer portal session', { data: error instanceof Error ? error : new Error(String(error)) });
    return { data: null, error };
  }
}

// Stripeチェックアウトセッション作成
export async function createCheckoutSession(organizationId: string, planId: string) {
  try {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ organizationId, planId }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    return { data, error: null };
  } catch (error) {
    logger.error('Error creating checkout session', { data: error instanceof Error ? error : new Error(String(error)) });
    return { data: null, error };
  }
}

// サブスクリプション状態チェックヘルパー
export const isSubscriptionActive = (subscription: Subscription | null): boolean => {
  return subscription?.status === 'active';
};

export const isSubscriptionExpiringSoon = (subscription: Subscription | null): boolean => {
  if (!subscription || subscription.status !== 'active') return false;
  
  const endDate = new Date(subscription.current_period_end);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
};

export const getSubscriptionStatusBadge = (subscription: Subscription | null) => {
  if (!subscription) {
    return { text: 'フリープラン', className: 'bg-gray-100 text-gray-800' };
  }

  switch (subscription.status) {
    case 'active':
      return { text: 'アクティブ', className: 'bg-green-100 text-green-800' };
    case 'pending':
      return { text: '保留中', className: 'bg-yellow-100 text-yellow-800' };
    case 'paused':
      return { text: '一時停止', className: 'bg-orange-100 text-orange-800' };
    case 'cancelled':
      return { text: 'キャンセル済み', className: 'bg-red-100 text-red-800' };
    default:
      return { text: '不明', className: 'bg-gray-100 text-gray-800' };
  }
};