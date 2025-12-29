'use client';

/**
 * Subscriptions Panel Component
 * サブスクリプション管理パネル
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { HIGButton } from '@/components/ui/HIGButton';

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';
  starts_at: string;
  ends_at: string | null;
  canceled_at: string | null;
  created_at: string;
  plan?: {
    id: string;
    name: string;
    slug: string;
  };
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export function SubscriptionsPanel() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        setIsLoading(true);
        const url = `/api/admin/billing/subscriptions${statusFilter ? `?status=${statusFilter}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch subscriptions');
        const { data } = await res.json();
        setSubscriptions(data || []);
      } catch (err) {
        toast.error('サブスクリプション一覧の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscriptions();
  }, [statusFilter]);

  const handleAction = async (id: string, action: string) => {
    setIsActioning(true);
    try {
      const res = await fetch(`/api/admin/billing/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Action failed');
      }

      const { message } = await res.json();
      toast.success(message);

      // リロード
      const subsRes = await fetch(`/api/admin/billing/subscriptions${statusFilter ? `?status=${statusFilter}` : ''}`);
      const { data } = await subsRes.json();
      setSubscriptions(data || []);
      setSelectedSub(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作に失敗しました');
    } finally {
      setIsActioning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-[var(--aio-info-muted)] text-[var(--aio-info)]',
      paused: 'bg-yellow-100 text-yellow-800',
      canceled: 'bg-gray-100 text-gray-800',
      past_due: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-[var(--aio-text)]">Subscriptions</h2>
          <p className="text-sm text-[var(--aio-text-muted)]">
            ユーザーのサブスクリプション管理
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
        >
          <option value="">すべて</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="paused">Paused</option>
          <option value="canceled">Canceled</option>
          <option value="past_due">Past Due</option>
        </select>
      </div>

      <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] overflow-hidden">
        <table className="min-w-full divide-y divide-[var(--aio-border)]">
          <thead className="bg-[var(--aio-surface-secondary)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">ユーザー</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">プラン</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">ステータス</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">開始日</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">終了日</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--aio-text-muted)] uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--aio-border)]">
            {subscriptions.map((sub) => (
              <tr key={sub.id}>
                <td className="px-4 py-3">
                  <div className="text-sm text-[var(--aio-text)]">{sub.user?.name || 'N/A'}</div>
                  <div className="text-xs text-[var(--aio-text-muted)]">{sub.user?.email}</div>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--aio-text)]">
                  {sub.plan?.name || sub.plan_id}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusBadge(sub.status)}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--aio-text-muted)]">
                  {new Date(sub.starts_at).toLocaleDateString('ja-JP')}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--aio-text-muted)]">
                  {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString('ja-JP') : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedSub(sub)}
                    className="text-sm text-[var(--aio-primary)] hover:underline"
                  >
                    詳細
                  </button>
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--aio-text-muted)]">
                  サブスクリプションがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 詳細モーダル */}
      {selectedSub && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-medium text-[var(--aio-text)] mb-4">
              サブスクリプション詳細
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--aio-text-muted)]">ユーザー:</span>
                <span className="text-sm text-[var(--aio-text)]">{selectedSub.user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--aio-text-muted)]">プラン:</span>
                <span className="text-sm text-[var(--aio-text)]">{selectedSub.plan?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--aio-text-muted)]">ステータス:</span>
                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedSub.status)}`}>
                  {selectedSub.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--aio-text-muted)]">開始日:</span>
                <span className="text-sm text-[var(--aio-text)]">
                  {new Date(selectedSub.starts_at).toLocaleString('ja-JP')}
                </span>
              </div>
              {selectedSub.ends_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--aio-text-muted)]">終了日:</span>
                  <span className="text-sm text-[var(--aio-text)]">
                    {new Date(selectedSub.ends_at).toLocaleString('ja-JP')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {selectedSub.status === 'active' && (
                <>
                  <HIGButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAction(selectedSub.id, 'pause')}
                    disabled={isActioning}
                  >
                    一時停止
                  </HIGButton>
                  <HIGButton
                    variant="danger"
                    size="sm"
                    onClick={() => handleAction(selectedSub.id, 'cancel')}
                    disabled={isActioning}
                  >
                    キャンセル
                  </HIGButton>
                </>
              )}
              {selectedSub.status === 'paused' && (
                <HIGButton
                  size="sm"
                  onClick={() => handleAction(selectedSub.id, 'resume')}
                  disabled={isActioning}
                >
                  再開
                </HIGButton>
              )}
            </div>

            <div className="flex justify-end">
              <HIGButton variant="secondary" onClick={() => setSelectedSub(null)}>
                閉じる
              </HIGButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
