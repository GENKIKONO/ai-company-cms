'use client';

import { useState } from 'react';
import { formatJPYAmount } from '@/lib/stripe';

interface SubscriptionManagerProps {
  organizationId: string;
  organizationName: string;
  hasActiveSubscription: boolean;
  subscriptionStatus?: string;
}

export default function SubscriptionManager({
  organizationId,
  organizationName,
  hasActiveSubscription,
  subscriptionStatus
}: SubscriptionManagerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });

      const data = await response.json();

      if (response.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert(data.error || 'チェックアウトの作成に失敗しました');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('チェックアウトの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (hasActiveSubscription) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-green-900">
              サブスクリプション有効
            </h3>
            <p className="text-sm text-green-700">
              {organizationName} のLuxuCare CMSプランは現在 {subscriptionStatus} です。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          LuxuCare CMS プラン
        </h3>
        
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 初期費用 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">初期設定費</h4>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatJPYAmount(50000)}
              </div>
              <p className="text-xs text-gray-500">
                初期設定・導入サポート（一回限り）
              </p>
            </div>

            {/* 月額費用 */}
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="text-sm font-medium text-blue-700 mb-2">月額利用料</h4>
              <div className="text-2xl font-bold text-blue-900 mb-1">
                {formatJPYAmount(9800)}
              </div>
              <p className="text-xs text-blue-600">
                保守・サポート・機能更新含む
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">プランに含まれる機能</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• JSON-LD構造化データ自動生成</li>
            <li>• SEO最適化済み企業ページ</li>
            <li>• Google検索結果表示対応</li>
            <li>• 承認ワークフロー</li>
            <li>• 技術サポート</li>
          </ul>
        </div>

        <button
          onClick={handleStartSubscription}
          disabled={isLoading}
          className={`w-full px-6 py-3 rounded-md text-sm font-medium ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {isLoading ? '処理中...' : 'サブスクリプションを開始'}
        </button>

        <p className="mt-3 text-xs text-gray-500">
          Stripeの安全な決済システムを使用します
        </p>
      </div>
    </div>
  );
}