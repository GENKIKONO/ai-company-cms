'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { 
  getUserSubscription, 
  getSubscriptionStats, 
  createCustomerPortalSession,
  createCheckoutSession,
  getSubscriptionStatusBadge,
  isSubscriptionActive,
  isSubscriptionExpiringSoon
} from '@/lib/subscriptions';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { type AppUser, type Subscription } from '@/types/database';

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const currentUser = await getCurrentUser();
        // middleware認証済み前提のため、リダイレクト削除
        
        if (currentUser) {
          setUser(currentUser);

          const [subscriptionResult, statsResult] = await Promise.all([
            getUserSubscription(currentUser.id),
            getSubscriptionStats(currentUser.id)
        ]);

        if (subscriptionResult.data) {
          setSubscription(subscriptionResult.data);
        }

          if (statsResult.data) {
            setStats(statsResult.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch billing data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const handleManageSubscription = async () => {
    if (!subscription?.org_id) return;

    setActionLoading('portal');
    try {
      const result = await createCustomerPortalSession(subscription.org_id);
      if (result.data?.portal_url) {
        window.open(result.data.portal_url, '_blank');
      }
    } catch (error) {
      console.error('Failed to open customer portal:', error);
      alert('サブスクリプション管理画面を開けませんでした');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user || !stats?.totalOrganizations) {
      alert('サブスクリプションを開始するには、まず企業を作成してください。');
      return;
    }

    setActionLoading(planId);
    try {
      // 最初の組織IDを使用（実際のアプリでは組織選択UIを提供することを想定）
      const result = await createCheckoutSession('org-id-placeholder', planId);
      if (result.data?.checkout_url) {
        window.location.href = result.data.checkout_url;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('サブスクリプション開始に失敗しました');
    } finally {
      setActionLoading(null);
    }
  };

  const getCurrentPlan = () => {
    if (!subscription) return SUBSCRIPTION_PLANS.FREE;
    return SUBSCRIPTION_PLANS[subscription.plan_id as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.FREE;
  };

  const statusBadge = getSubscriptionStatusBadge(subscription);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                AIO Hub AI企業CMS
              </Link>
              <nav className="ml-10 hidden md:flex space-x-8">
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                  ダッシュボード
                </Link>
                <Link href="/organizations" className="text-gray-500 hover:text-gray-700">
                  企業ディレクトリ
                </Link>
                <span className="text-blue-600 font-medium">
                  サブスクリプション
                </span>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                こんにちは、{user?.full_name || user?.email}さん
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* パンくずナビ */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                ダッシュボード
              </Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span className="text-gray-900 font-medium">サブスクリプション管理</span>
            </li>
          </ol>
        </nav>

        {/* ページタイトル */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">サブスクリプション管理</h1>
          <p className="text-lg text-gray-600">
            プランの管理と使用状況の確認
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 現在のプラン */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">現在のプラン</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.className}`}>
                  {statusBadge.text}
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentPlan.name}</h3>
                <p className="text-3xl font-bold text-blue-600 mb-4">
                  ¥{currentPlan.price.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500">/月</span>
                </p>
                
                {subscription && isSubscriptionExpiringSoon(subscription) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                    <div className="flex">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          サブスクリプションの更新が近づいています
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          次回更新日: {subscription && new Date(subscription.current_period_end).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {subscription && (subscription as any).setup_fee_amount && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                    <h4 className="font-medium text-green-800 mb-2">初期費用情報</h4>
                    <div className="text-sm text-green-700">
                      <p>支払済み初期費用: ¥{(subscription as any).setup_fee_amount.toLocaleString()}</p>
                      {(subscription as any).setup_fee_paid_at && (
                        <p>支払日: {new Date((subscription as any).setup_fee_paid_at).toLocaleDateString('ja-JP')}</p>
                      )}
                      {(subscription as any).notes && (
                        <p className="mt-1">備考: {(subscription as any).notes}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">プラン機能</h4>
                  <ul className="space-y-1">
                    {currentPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {isSubscriptionActive(subscription) ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={actionLoading === 'portal'}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  {actionLoading === 'portal' ? '読み込み中...' : 'サブスクリプション管理'}
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    より多くの機能を利用するには、有料プランをご検討ください。
                  </p>
                  <Link
                    href="#plans"
                    className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
                  >
                    プランを見る
                  </Link>
                </div>
              )}
            </div>

            {/* 使用状況 */}
            {stats && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">使用状況</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">企業登録数</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.totalOrganizations}
                      <span className="text-sm font-normal text-gray-500">
                        / {currentPlan.limits.maxOrganizations === -1 ? '無制限' : currentPlan.limits.maxOrganizations}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">サービス登録数</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.totalServices}
                      <span className="text-sm font-normal text-gray-500">
                        / {currentPlan.limits.maxServices === -1 ? '無制限' : currentPlan.limits.maxServices}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">導入事例数</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.totalCaseStudies}
                      <span className="text-sm font-normal text-gray-500">
                        / {currentPlan.limits.maxCaseStudies === -1 ? '無制限' : currentPlan.limits.maxCaseStudies}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">FAQ数</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.totalFaqs}
                      <span className="text-sm font-normal text-gray-500">
                        / {currentPlan.limits.maxCaseStudies === -1 ? '無制限' : currentPlan.limits.maxCaseStudies}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* プラン変更 */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">プラン変更</h2>
              
              <div className="space-y-4" id="plans">
                {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => {
                  const isCurrentPlan = subscription?.plan_id === planId || (!subscription && planId === 'FREE');
                  
                  return (
                    <div 
                      key={planId}
                      className={`border rounded-lg p-4 ${
                        isCurrentPlan ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                        {isCurrentPlan && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            現在のプラン
                          </span>
                        )}
                      </div>
                      
                      <p className="text-lg font-bold text-gray-900 mb-2">
                        ¥{plan.price.toLocaleString()}/月
                      </p>
                      
                      <ul className="text-sm text-gray-600 space-y-1 mb-3">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <svg className="h-3 w-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      {!isCurrentPlan && planId !== 'FREE' && (
                        <button
                          onClick={() => handleSubscribe(planId)}
                          disabled={actionLoading === planId}
                          className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {actionLoading === planId ? '処理中...' : '選択する'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Admin Tools */}
            {user?.role === 'admin' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">管理者ツール</h2>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    管理者専用の機能です。初期費用付きのサブスクリプション作成などが可能です。
                  </p>
                  <Link
                    href="/dashboard/billing/new-session"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    新規チェックアウトセッション作成
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}