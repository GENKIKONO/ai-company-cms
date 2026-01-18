'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/utils/logger';
import { LockIcon } from '@/components/icons/HIGIcons';
import { DashboardPageShell } from '@/components/dashboard';

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
  return (
    <DashboardPageShell title="課金リンク管理" requiredRole="admin">
      <BillingLinksContent />
    </DashboardPageShell>
  );
}

function BillingLinksContent() {
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

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/billing-links', {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // NOTE: Don't redirect - middleware handles auth
          throw new Error('認証情報の取得に失敗しました。ページを再読み込みしてください。');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setLinks(result.data || []);
      setError(null);
    } catch (err) {
      logger.error('Failed to fetch checkout links:', { data: err });
      setError(err instanceof Error ? err.message : 'Failed to fetch links');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

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
      logger.error('Failed to activate link:', { data: err });
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
      logger.error('Failed to create link:', { data: err });
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
      logger.error('Failed to copy to clipboard:', { data: err });
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
      <div className="">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--dashboard-card-border)] rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-[var(--dashboard-card-border)] rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Checkout リンク管理</h1>
          <p className="text-lg text-[var(--color-text-secondary)] mt-2">Stripe決済リンクの期間管理・キャンペーン管理</p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-[var(--aio-danger-muted)] border border-[var(--aio-danger)] rounded-md p-4">
            <p className="text-sm text-[var(--aio-danger)]">{error}</p>
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
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-[var(--dashboard-card-border)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">新規リンク追加</h2>
            <form onSubmit={handleAddSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">ラベル *</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({...formData, label: e.target.value})}
                  className="w-full border border-[var(--input-border)] rounded-md px-3 py-2"
                  placeholder="early-user-20off"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">プランタイプ *</label>
                <select
                  value={formData.plan_type}
                  onChange={(e) => setFormData({...formData, plan_type: e.target.value})}
                  className="w-full border border-[var(--input-border)] rounded-md px-3 py-2"
                  required
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">キャンペーンタイプ *</label>
                <select
                  value={formData.campaign_type}
                  onChange={(e) => setFormData({...formData, campaign_type: e.target.value})}
                  className="w-full border border-[var(--input-border)] rounded-md px-3 py-2"
                  required
                >
                  <option value="test_user">test_user (6ヶ月無料+30%OFF)</option>
                  <option value="early_user">early_user (20%OFF)</option>
                  <option value="regular">regular</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">割引率（%）</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_rate}
                  onChange={(e) => setFormData({...formData, discount_rate: parseInt(e.target.value) || 0})}
                  className="w-full border border-[var(--input-border)] rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Stripe Price ID *</label>
                <input
                  type="text"
                  value={formData.stripe_price_id}
                  onChange={(e) => setFormData({...formData, stripe_price_id: e.target.value})}
                  className="w-full border border-[var(--input-border)] rounded-md px-3 py-2"
                  placeholder="price_xxx"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Checkout URL（任意）</label>
                <input
                  type="url"
                  value={formData.stripe_checkout_url}
                  onChange={(e) => setFormData({...formData, stripe_checkout_url: e.target.value})}
                  className="w-full border border-[var(--input-border)] rounded-md px-3 py-2"
                  placeholder="https://checkout.stripe.com/..."
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                  className="h-4 w-4 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)] border-[var(--input-border)] rounded"
                />
                <label htmlFor="is_public" className="ml-2 block text-sm text-[var(--color-text-secondary)]">
                  公開CTA表示（チェックを外すと<LockIcon className="w-3 h-3 inline mx-1" aria-hidden />プライベートリンク：運営が手動で配布する特別価格のリンク）
                </label>
              </div>
              <div className="col-span-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-[var(--input-border)] rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--aio-surface)] disabled:opacity-50"
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
        <div className="bg-white rounded-lg shadow-sm border border-[var(--dashboard-card-border)]">
          <div className="px-6 py-4 border-b border-[var(--dashboard-card-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              登録済みリンク一覧 ({links.length}件)
            </h2>
          </div>

          {links.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[var(--color-text-tertiary)]">登録されたリンクはありません</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--dashboard-card-border)]">
              {links.map((link) => (
                <div key={link.id} className="p-6 hover:bg-[var(--aio-surface)]">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">{link.label}</h3>
                        {link.is_active && (
                          <span className="px-2 py-1 bg-[var(--aio-success-muted)] text-[var(--aio-success)] text-xs font-medium rounded-full">
                            適用中
                          </span>
                        )}
                        {!link.is_public && (
                          <span className="px-2 py-1 bg-[var(--aio-pending-muted)] text-[var(--aio-pending)] text-xs font-medium rounded-full">
                            <LockIcon className="w-3 h-3 inline mr-1" aria-hidden /> プライベートリンク
                          </span>
                        )}
                        {link.discount_rate > 0 && (
                          <span className="px-2 py-1 bg-[var(--aio-muted)] text-[var(--aio-primary)] text-xs font-medium rounded-full">
                            {link.discount_rate}% OFF
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-[var(--color-text-tertiary)] space-x-4">
                        <span>プラン: {link.plan_type}</span>
                        <span>キャンペーン: {getCampaignTypeDisplay(link.campaign_type)}</span>
                        <span>Price ID: {link.stripe_price_id}</span>
                      </div>
                      {link.stripe_checkout_url && (
                        <div className="mt-1 text-xs text-[var(--color-icon-muted)] truncate max-w-lg">
                          URL: {link.stripe_checkout_url}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex space-x-2">
                      {!link.is_active && (
                        <button
                          onClick={() => handleActivate(link.id)}
                          disabled={submitting}
                          className="px-3 py-1 bg-[var(--color-text-secondary)] text-white rounded text-sm hover:opacity-90 disabled:opacity-50"
                        >
                          {submitting ? '...' : 'これを適用'}
                        </button>
                      )}
                      <button
                        onClick={() => copyLinkToClipboard(link)}
                        className="px-3 py-1 bg-[var(--aio-primary)] text-white rounded text-sm hover:bg-[var(--aio-primary-hover)]"
                      >
                        {link.is_public ? 'リンクコピー' : <><LockIcon className="w-3 h-3 inline mr-1" aria-hidden /> プライベートリンクコピー</>}
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