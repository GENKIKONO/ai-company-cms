'use client';

/**
 * Feature Limits Panel Component
 * 機能制限値管理パネル
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { HIGButton } from '@/components/ui/HIGButton';

interface Plan {
  id: string;
  name: string;
  slug: string;
}

interface Feature {
  id: string;
  key: string;
  name: string;
}

interface FeatureLimit {
  id: string;
  plan_id: string;
  feature_id: string;
  limit_key: string;
  limit_value: number;
  period: 'monthly' | 'yearly' | 'lifetime' | null;
  reset_day: number | null;
  plan?: Plan;
  feature?: Feature;
}

export function FeatureLimitsPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [limits, setLimits] = useState<FeatureLimit[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    feature_id: '',
    limit_key: '',
    limit_value: 0,
    period: 'monthly' as 'monthly' | 'yearly' | 'lifetime' | null,
    reset_day: null as number | null,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [plansRes, featuresRes] = await Promise.all([
          fetch('/api/admin/billing/plans'),
          fetch('/api/admin/billing/features'),
        ]);

        if (!plansRes.ok || !featuresRes.ok) throw new Error('Failed to fetch data');

        const plansData = await plansRes.json();
        const featuresData = await featuresRes.json();

        setPlans(plansData.data || []);
        setFeatures(featuresData.data || []);

        if (plansData.data?.length > 0) {
          setSelectedPlan(plansData.data[0].id);
        }
      } catch (err) {
        toast.error('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedPlan) return;

    async function fetchLimits() {
      try {
        const res = await fetch(`/api/admin/billing/feature-limits?plan_id=${selectedPlan}`);
        if (!res.ok) throw new Error('Failed to fetch limits');
        const { data } = await res.json();
        setLimits(data || []);
      } catch (err) {
        toast.error('制限情報の取得に失敗しました');
      }
    }

    fetchLimits();
  }, [selectedPlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/admin/billing/feature-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlan,
          ...formData,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to save');
      }

      toast.success('制限を追加しました');
      setShowForm(false);

      // リロード
      const limitsRes = await fetch(`/api/admin/billing/feature-limits?plan_id=${selectedPlan}`);
      const { data } = await limitsRes.json();
      setLimits(data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この制限を削除しますか？')) return;

    try {
      const res = await fetch(`/api/admin/billing/feature-limits?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      toast.success('削除しました');
      setLimits((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      toast.error('削除に失敗しました');
    }
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
          <h2 className="text-lg font-medium text-[var(--aio-text)]">Feature Limits</h2>
          <p className="text-sm text-[var(--aio-text-muted)]">
            各プランの機能制限値を設定します
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="px-4 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
          <HIGButton onClick={() => setShowForm(true)}>追加</HIGButton>
        </div>
      </div>

      {showForm && (
        <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] p-6">
          <h3 className="text-lg font-medium text-[var(--aio-text)] mb-4">制限を追加</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
                  機能
                </label>
                <select
                  value={formData.feature_id}
                  onChange={(e) => setFormData({ ...formData, feature_id: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
                  required
                >
                  <option value="">選択してください</option>
                  {features.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.key})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
                  制限キー
                </label>
                <input
                  type="text"
                  value={formData.limit_key}
                  onChange={(e) => setFormData({ ...formData, limit_key: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
                  placeholder="例: max_requests"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
                  制限値
                </label>
                <input
                  type="number"
                  value={formData.limit_value}
                  onChange={(e) => setFormData({ ...formData, limit_value: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
                  期間
                </label>
                <select
                  value={formData.period || ''}
                  onChange={(e) => setFormData({ ...formData, period: (e.target.value || null) as typeof formData.period })}
                  className="w-full px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
                >
                  <option value="">なし</option>
                  <option value="monthly">月次</option>
                  <option value="yearly">年次</option>
                  <option value="lifetime">永続</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
                  リセット日
                </label>
                <input
                  type="number"
                  value={formData.reset_day ?? ''}
                  onChange={(e) => setFormData({ ...formData, reset_day: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
                  placeholder="1-31"
                  min="1"
                  max="31"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <HIGButton type="button" variant="secondary" onClick={() => setShowForm(false)}>
                キャンセル
              </HIGButton>
              <HIGButton type="submit" disabled={isSaving}>
                {isSaving ? '保存中...' : '追加'}
              </HIGButton>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] overflow-hidden">
        <table className="min-w-full divide-y divide-[var(--aio-border)]">
          <thead className="bg-[var(--aio-surface-secondary)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">機能</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">制限キー</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">値</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">期間</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--aio-text-muted)] uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--aio-border)]">
            {limits.map((limit) => (
              <tr key={limit.id}>
                <td className="px-4 py-3 text-sm text-[var(--aio-text)]">
                  {limit.feature?.name || limit.feature_id}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-[var(--aio-text)]">{limit.limit_key}</td>
                <td className="px-4 py-3 text-sm text-[var(--aio-text)]">{limit.limit_value.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-[var(--aio-text-muted)]">
                  {limit.period || '-'}
                  {limit.reset_day && ` (${limit.reset_day}日)`}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(limit.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
            {limits.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--aio-text-muted)]">
                  制限が設定されていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
