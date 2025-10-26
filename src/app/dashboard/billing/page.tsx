'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { PLAN_LIMITS } from '@/config/plans';
import type { Organization } from '@/types/database';

interface BillingData {
  organization: Organization;
  currentCounts: {
    services: number;
    posts: number;
    case_studies: number;
    faqs: number;
  };
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
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('created_by', user.id)
        .single();

      if (orgError || !org) {
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

      setData({
        organization: org,
        currentCounts: {
          services: servicesRes.count || 0,
          posts: postsRes.count || 0,
          case_studies: caseStudiesRes.count || 0,
          faqs: faqsRes.count || 0,
        },
      });
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
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
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout failed:', error);
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
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Portal creation failed:', error);
      setError('Failed to open billing portal');
    } finally {
      setActionLoading(false);
    }
  }

  function getPlanLimits(plan: string) {
    return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">データが見つかりません</div>
      </div>
    );
  }

  const { organization, currentCounts } = data;
  const currentPlan = organization.plan || 'free';
  const limits = getPlanLimits(currentPlan);
  const isActive = organization.subscription_status === 'active' || organization.subscription_status === 'trialing';
  const canUpgrade = !isActive || currentPlan === 'free';

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
              {currentPlan === 'free' ? 'Free (¥0)' : 
               currentPlan === 'basic' ? 'Basic (¥5,000（税別）/月)' : 
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
            <button
              onClick={handleSubscribe}
              disabled={actionLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {actionLoading ? '処理中...' : 'Basicプランで購読 (¥5,000/月)'}
            </button>
          ) : (
            <button
              onClick={handleManageBilling}
              disabled={actionLoading || !organization.stripe_customer_id}
              className="px-6 py-3 bg-[#3B82F6] text-white rounded-md hover:bg-[#2563EB] focus:ring-2 focus:ring-[#93C5FD] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {actionLoading ? '処理中...' : '請求の管理'}
            </button>
          )}
          
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
          >
            ダッシュボードに戻る
          </button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Free</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enterprise</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">サービス</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.free.services}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.basic.services}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.business.services}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">無制限</td></tr>
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Q&A項目</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.free.qa_items}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.basic.qa_items}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">無制限</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">無制限</td></tr>
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">営業資料</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.free.materials}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.basic.materials}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.business.materials}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">無制限</td></tr>
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">料金</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥0</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥5,000/月</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥15,000/月</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥30,000〜/月</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}