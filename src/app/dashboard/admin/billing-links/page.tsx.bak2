'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/utils/logger';

interface CheckoutLink {
  id: string;
  label: string;
  plan_type: string;
  stripe_price_id: string;
  stripe_checkout_url: string | null;
  discount_rate: number;
  campaign_type: string;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
}

interface FormData {
  label: string;
  plan_type: string;
  stripe_price_id: string;
  stripe_checkout_url: string;
  discount_rate: number;
  campaign_type: string;
  start_at: string;
  end_at: string;
  is_public: boolean;
}

export default function BillingLinksAdminPage() {
  const router = useRouter();
  const [links, setLinks] = useState<CheckoutLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 新規追加フォーム用state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    label: '',
    plan_type: 'starter',
    stripe_price_id: '',
    stripe_checkout_url: '',
    discount_rate: 0,
    campaign_type: 'regular',
    start_at: '',
    end_at: '',
    is_public: true
  });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/billing-links', {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setLinks(result.data || []);
      setError(null);
    } catch (err) {
      logger.error('Failed to fetch checkout links:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch links');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (linkId: string) => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/admin/billing-links/${linkId}/activate`, {
        method: 'PUT'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // 成功後リロード
      await fetchLinks();
    } catch (err) {
      logger.error('Failed to activate link:', err);
      alert('リンクのアクティブ化に失敗しました: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const response = await fetch('/api/admin/billing-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          start_at: formData.start_at || null,
          end_at: formData.end_at || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // フォームリセット・リロード
      setFormData({
        label: '',
        plan_type: 'starter',
        stripe_price_id: '',
        stripe_checkout_url: '',
        discount_rate: 0,
        campaign_type: 'regular',
        start_at: '',
        end_at: '',
        is_public: true
      });
      setShowAddForm(false);
      await fetchLinks();
    } catch (err) {
      logger.error('Failed to create link:', err);
      alert('リンクの作成に失敗しました: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const copyLinkToClipboard = async (link: CheckoutLink) => {
    const url = link.stripe_checkout_url || `[Price ID: ${link.stripe_price_id}]`;
    try {
      await navigator.clipboard.writeText(url);
      alert('リンクをコピーしました');
    } catch (err) {
      logger.error('Failed to copy to clipboard:', err);
      alert(`コピーに失敗しました。手動でコピーしてください:\n${url}`);
    }
  };

  const getCampaignTypeDisplay = (campaignType: string) => {
    switch (campaignType) {
      case 'test_user': return 'Test User (6ヶ月無料+30%OFF)';
      case 'early_user': return 'Early User (20%OFF)';
      case 'regular': return 'Regular';
      default: return campaignType;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout リンク管理</h1>
          <p className="text-lg text-gray-600 mt-2">Stripe決済リンクの期間管理・キャンペーン管理</p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* アクション */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={submitting}
            className="bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
          >
            {showAddForm ? '閉じる' : '新規追加'}
          </button>
        </div>

        {/* 新規追加フォーム */}
        {showAddForm && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">新規リンク追加</h2>
            <form onSubmit={handleAddSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ラベル *</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({...formData, label: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="early-user-20off"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">プランタイプ *</label>
                <select
                  value={formData.plan_type}
                  onChange={(e) => setFormData({...formData, plan_type: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">キャンペーンタイプ *</label>
                <select
                  value={formData.campaign_type}
                  onChange={(e) => setFormData({...formData, campaign_type: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="test_user">test_user (6ヶ月無料+30%OFF)</option>
                  <option value="early_user">early_user (20%OFF)</option>
                  <option value="regular">regular</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">割引率（%）</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_rate}
                  onChange={(e) => setFormData({...formData, discount_rate: parseInt(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stripe Price ID *</label>
                <input
                  type="text"
                  value={formData.stripe_price_id}
                  onChange={(e) => setFormData({...formData, stripe_price_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="price_xxx"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Checkout URL（任意）</label>
                <input
                  type="url"
                  value={formData.stripe_checkout_url}
                  onChange={(e) => setFormData({...formData, stripe_checkout_url: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="https://checkout.stripe.com/..."
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                  className="h-4 w-4 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)] border-gray-300 rounded"
                />
                <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                  公開CTA表示（チェックを外すと🔒プライベートリンク：運営が手動で配布する特別価格のリンク）
                </label>
              </div>
              <div className="col-span-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[var(--aio-primary)] text-white rounded-md hover:bg-[var(--aio-primary-hover)] disabled:opacity-50"
                >
                  {submitting ? '作成中...' : '作成'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* リンク一覧 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              登録済みリンク一覧 ({links.length}件)
            </h2>
          </div>

          {links.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">登録されたリンクはありません</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {links.map((link) => (
                <div key={link.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-medium text-gray-900">{link.label}</h3>
                        {link.is_active && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            適用中
                          </span>
                        )}
                        {!link.is_public && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                            🔒 プライベートリンク
                          </span>
                        )}
                        {link.discount_rate > 0 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {link.discount_rate}% OFF
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-500 space-x-4">
                        <span>プラン: {link.plan_type}</span>
                        <span>キャンペーン: {getCampaignTypeDisplay(link.campaign_type)}</span>
                        <span>Price ID: {link.stripe_price_id}</span>
                      </div>
                      {link.stripe_checkout_url && (
                        <div className="mt-1 text-xs text-gray-400 truncate max-w-lg">
                          URL: {link.stripe_checkout_url}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex space-x-2">
                      {!link.is_active && (
                        <button
                          onClick={() => handleActivate(link.id)}
                          disabled={submitting}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50"
                        >
                          {submitting ? '...' : 'これを適用'}
                        </button>
                      )}
                      <button
                        onClick={() => copyLinkToClipboard(link)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        {link.is_public ? 'リンクコピー' : '🔒 プライベートリンクコピー'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}