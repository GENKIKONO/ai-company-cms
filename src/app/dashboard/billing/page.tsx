'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PLAN_LIMITS } from '@/config/plans';
import type { Organization } from '@/types/legacy/database';;
import { HIGButton } from '@/design-system';
import DashboardBackLink from '@/components/dashboard/DashboardBackLink';
import { logger } from '@/lib/utils/logger';
import { handleMaybeSingleResult } from '@/lib/error-mapping';
import { 
  fetchActiveCheckoutForOrg, 
  calculateDiscountedPrice,
  getCampaignDescription
} from '@/lib/utils/checkout-helpers';

interface BillingData {
  organization: Organization;
  currentCounts: {
    services: number;
    posts: number;
    case_studies: number;
    faqs: number;
  };
  checkoutInfo?: {
    stripe_price_id: string;
    stripe_checkout_url: string | null;
    discount_rate: number;
    campaign_type: string;
    is_fallback?: boolean;
  } | null;
}

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for success/cancel parameters
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  const fetchBillingData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push('/login');
        return;
      }

      // Get user's organization (Single-Org Mode)
      const orgResult = await supabase
        .from('organizations')
        .select('*')
        .eq('created_by', user.id)
        .maybeSingle();

      let org;
      try {
        org = handleMaybeSingleResult(orgResult, '組織');
      } catch (error) {
        // 組織が見つからない場合は企業作成ページにリダイレクト
        router.push('/organizations/new');
        return;
      }

      // Get current resource counts
      const [servicesRes, postsRes, caseStudiesRes, faqsRes] = await Promise.all([
        supabase.from('services').select('id', { count: 'exact' }).eq('organization_id', org.id),
        supabase.from('posts').select('id', { count: 'exact' }).eq('organization_id', org.id),
        supabase.from('case_studies').select('id', { count: 'exact' }).eq('organization_id', org.id),
        supabase.from('faqs').select('id', { count: 'exact' }).eq('organization_id', org.id),
      ]);

      // キャンペーン情報を取得
      const checkoutInfo = await fetchActiveCheckoutForOrg('starter', org);

      setData({
        organization: org,
        currentCounts: {
          services: servicesRes.count || 0,
          posts: postsRes.count || 0,
          case_studies: caseStudiesRes.count || 0,
          faqs: faqsRes.count || 0,
        },
        checkoutInfo,
      });
    } catch (error) {
      logger.error('Failed to fetch billing data', { data: error instanceof Error ? error : new Error(String(error)) });
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  async function handleSubscribe() {
    try {
      setActionLoading(true);
      
      // アクティブなチェックアウトリンクがある場合はそれを使用
      if (data?.checkoutInfo?.stripe_checkout_url) {
        window.location.href = data.checkoutInfo.stripe_checkout_url;
        return;
      }
      
      // フォールバック：従来のAPI経由でチェックアウト作成
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to create checkout session';
        logger.error('Checkout failed', { error: errorMessage, status: response.status });
        setError(errorMessage);
        return;
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      logger.error('Checkout failed', { data: error instanceof Error ? error : new Error(String(error)) });
      setError('Failed to start checkout process');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleManageBilling() {
    try {
      setActionLoading(true);
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to create portal session';
        logger.error('Portal creation failed', { error: errorMessage, status: response.status });
        setError(errorMessage);
        return;
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      logger.error('Portal creation failed', { data: error instanceof Error ? error : new Error(String(error)) });
      setError('Failed to open billing portal');
    } finally {
      setActionLoading(false);
    }
  }

  function getPlanLimits(plan: string) {
    return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.starter;
  }

  function formatDate(dateString?: string) {
    if (!dateString) return '未設定';
    return new Date(dateString).toLocaleDateString('ja-JP');
  }

  function getStatusBadge(status?: string) {
    switch (status) {
      case 'active':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">有効</span>;
      case 'past_due':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">支払い遅延</span>;
      case 'canceled':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">キャンセル済み</span>;
      case 'trialing':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">トライアル中</span>;
      default:
        return <span className="bg-slate-200 text-slate-800 px-2 py-1 rounded-full text-sm">未契約</span>;
    }
  }

  if (loading) {
    return (
      <div className="">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="">
        <div className="text-gray-600">データが見つかりません</div>
      </div>
    );
  }

  const { organization, currentCounts, checkoutInfo } = data;
  const currentPlan = organization.plan || 'trial';
  const limits = getPlanLimits(currentPlan);
  const isActive = organization.subscription_status === 'active' || organization.subscription_status === 'trialing';
  const canUpgrade = !isActive || currentPlan === 'trial';
  
  // キャンペーン情報表示用
  const originalPrice = 2980; // Starterプラン基本価格（税別）
  const discountedPrice = checkoutInfo ? calculateDiscountedPrice(originalPrice, checkoutInfo.discount_rate) : originalPrice;
  const campaignDescription = checkoutInfo ? getCampaignDescription(checkoutInfo.campaign_type) : '';
  const hasDiscount = checkoutInfo && checkoutInfo.discount_rate > 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">サブスクリプション管理</h1>
        <p className="text-gray-600">プランの管理と請求情報を確認できます。</p>
      </div>

      {/* Success/Cancel Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">サブスクリプションの設定が完了しました！</p>
        </div>
      )}
      {canceled && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">サブスクリプションの設定がキャンセルされました。</p>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Current Plan Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">現在のプラン</h2>
          {getStatusBadge(organization.subscription_status)}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">プラン</div>
            <div className="text-lg font-medium text-gray-900 capitalize">
              {currentPlan === 'trial' ? 'Trial (14日間無料)' : 
               currentPlan === 'starter' ? 'Starter (¥2,980（税別）/月)' : 
               currentPlan === 'pro' ? 'Pro (¥8,000（税別）/月)' : 
               currentPlan === 'business' ? 'Business (¥15,000（税別）/月)' : 
               currentPlan === 'enterprise' ? 'Enterprise (¥30,000（税別）〜/月)' : currentPlan}
            </div>
          </div>
          
          {organization.current_period_end && (
            <div>
              <div className="text-sm text-gray-500 mb-1">次回請求日</div>
              <div className="text-lg font-medium text-gray-900">
                {formatDate(organization.current_period_end)}
              </div>
            </div>
          )}
        </div>

        {/* Usage Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">利用状況</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(currentCounts).map(([key, count]) => {
              const limit = limits[key as keyof typeof limits];
              const numericLimit = typeof limit === 'number' ? limit : 0;
              const isNearLimit = numericLimit > 0 && count >= numericLimit * 0.8;
              const isOverLimit = numericLimit > 0 && count >= numericLimit;
              
              return (
                <div key={key} className="text-center">
                  <div className="text-sm text-gray-500 mb-1 capitalize">
                    {key === 'case_studies' ? '導入事例' : 
                     key === 'services' ? 'サービス' : 
                     key === 'posts' ? '記事' : 
                     key === 'faqs' ? 'FAQ' : key}
                  </div>
                  <div className={`text-lg font-medium ${isOverLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-gray-900'}`}>
                    {count} / {numericLimit > 0 ? numericLimit : '無制限'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex gap-4">
          {canUpgrade ? (
            <div className="flex flex-col gap-3">
              {hasDiscount && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="text-sm font-medium text-blue-800 mb-1">特別キャンペーン適用</div>
                  <div className="text-sm text-blue-700">{campaignDescription}</div>
                  {checkoutInfo?.is_fallback && (
                    <div className="text-xs text-blue-600 mt-1">※ 通常価格でのご案内となります</div>
                  )}
                </div>
              )}
              <HIGButton
                onClick={handleSubscribe}
                disabled={actionLoading}
                variant="primary"
                size="lg"
              >
                {actionLoading ? '処理中...' : (
                  hasDiscount ? 
                    `Starterプランで購読 (¥${discountedPrice.toLocaleString()}/月)` :
                    'Starterプランで購読 (¥2,980/月)'
                )}
              </HIGButton>
              {hasDiscount && !checkoutInfo?.is_fallback && (
                <div className="text-sm text-gray-500">
                  <span className="line-through">¥{originalPrice.toLocaleString()}/月</span>
                  <span className="ml-2 text-green-600 font-medium">¥{discountedPrice.toLocaleString()}/月</span>
                  <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                    {checkoutInfo?.discount_rate}%OFF
                  </span>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleManageBilling}
              disabled={actionLoading || !organization.stripe_customer_id}
              className="px-6 py-3 bg-[var(--color-blue-600)] text-white rounded-md hover:bg-[var(--color-blue-700)] focus:ring-2 focus:ring-[var(--color-blue-300)] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {actionLoading ? '処理中...' : '請求の管理'}
            </button>
          )}
          
          <DashboardBackLink variant="button" className="mb-0" />
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">プラン比較</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">機能</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trial</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Starter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enterprise</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">サービス</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.trial.services}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.starter.services}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.pro.services}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">無制限</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">無制限</td></tr>
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Q&A項目</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.trial.qa_items}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.starter.qa_items}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.pro.qa_items}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">無制限</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">無制限</td></tr>
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">営業資料</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.trial.materials}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.starter.materials}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.pro.materials}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">無制限</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">無制限</td></tr>
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">料金</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥0 (14日間)</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥2,980/月</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥8,000/月</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥15,000/月</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥30,000〜/月</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}