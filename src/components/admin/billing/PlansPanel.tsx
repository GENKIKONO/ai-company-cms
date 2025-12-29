'use client';

/**
 * Plans Panel Component
 * プラン管理パネル
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { HIGButton } from '@/components/ui/HIGButton';
import type { Plan } from '@/lib/billing';

interface PlanFormData {
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'deprecated' | 'draft';
  sort_order: number;
  monthly_price: number | null;
  yearly_price: number | null;
}

const defaultFormData: PlanFormData = {
  name: '',
  slug: '',
  description: '',
  status: 'draft',
  sort_order: 0,
  monthly_price: null,
  yearly_price: null,
};

export function PlansPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [includeDeprecated, setIncludeDeprecated] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = `/api/admin/billing/plans${includeDeprecated ? '?include_deprecated=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch plans');
      const { data } = await res.json();
      setPlans(data || []);
    } catch (err) {
      toast.error('プラン一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [includeDeprecated]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleCreate = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (plan: Plan) => {
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      status: plan.status,
      sort_order: plan.sort_order,
      monthly_price: plan.monthly_price,
      yearly_price: plan.yearly_price,
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingId
        ? `/api/admin/billing/plans/${editingId}`
        : '/api/admin/billing/plans';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to save plan');
      }

      toast.success(editingId ? 'プランを更新しました' : 'プランを作成しました');
      setShowForm(false);
      fetchPlans();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeprecate = async (id: string) => {
    if (!confirm('このプランを非推奨にしますか？')) return;

    try {
      const res = await fetch(`/api/admin/billing/plans/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to deprecate plan');
      }

      toast.success('プランを非推奨にしました');
      fetchPlans();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作に失敗しました');
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
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-[var(--aio-text)]">Plans</h2>
          <p className="text-sm text-[var(--aio-text-muted)]">
            料金プランの作成・編集・非推奨化
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-[var(--aio-text-muted)]">
            <input
              type="checkbox"
              checked={includeDeprecated}
              onChange={(e) => setIncludeDeprecated(e.target.checked)}
              className="rounded border-[var(--aio-border)]"
            />
            非推奨も表示
          </label>
          <HIGButton onClick={handleCreate}>新規作成</HIGButton>
        </div>
      </div>

      {/* フォーム */}
      {showForm && (
        <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] p-6">
          <h3 className="text-lg font-medium text-[var(--aio-text)] mb-4">
            {editingId ? 'プランを編集' : '新規プラン作成'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
                  プラン名
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
                  スラッグ
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="w-full px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
                  required
                  pattern="[a-z0-9-]+"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
                説明
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
                  ステータス
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PlanFormData['status'] })}
                  className="w-full px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="deprecated">Deprecated</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
                  表示順
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
                  月額料金
                </label>
                <input
                  type="number"
                  value={formData.monthly_price ?? ''}
                  onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
                  min="0"
                  placeholder="未設定"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
                  年額料金
                </label>
                <input
                  type="number"
                  value={formData.yearly_price ?? ''}
                  onChange={(e) => setFormData({ ...formData, yearly_price: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
                  min="0"
                  placeholder="未設定"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <HIGButton type="button" variant="secondary" onClick={() => setShowForm(false)}>
                キャンセル
              </HIGButton>
              <HIGButton type="submit" disabled={isSaving}>
                {isSaving ? '保存中...' : editingId ? '更新' : '作成'}
              </HIGButton>
            </div>
          </form>
        </div>
      )}

      {/* テーブル */}
      <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] overflow-hidden">
        <table className="min-w-full divide-y divide-[var(--aio-border)]">
          <thead className="bg-[var(--aio-surface-secondary)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">順</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">名前</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">スラッグ</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">ステータス</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">月額</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">年額</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--aio-text-muted)] uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--aio-border)]">
            {plans.map((plan) => (
              <tr key={plan.id} className={plan.status === 'deprecated' ? 'opacity-50' : ''}>
                <td className="px-4 py-3 text-sm text-[var(--aio-text)]">{plan.sort_order}</td>
                <td className="px-4 py-3 text-sm text-[var(--aio-text)] font-medium">{plan.name}</td>
                <td className="px-4 py-3 text-sm text-[var(--aio-text-muted)] font-mono">{plan.slug}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      plan.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : plan.status === 'deprecated'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {plan.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--aio-text)]">
                  {plan.monthly_price !== null ? `¥${plan.monthly_price.toLocaleString()}` : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--aio-text)]">
                  {plan.yearly_price !== null ? `¥${plan.yearly_price.toLocaleString()}` : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="text-sm text-[var(--aio-primary)] hover:underline mr-3"
                  >
                    編集
                  </button>
                  {plan.status !== 'deprecated' && (
                    <button
                      onClick={() => handleDeprecate(plan.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      非推奨化
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--aio-text-muted)]">
                  プランがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
