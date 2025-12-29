'use client';

/**
 * Features Panel Component
 * 機能管理パネル
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { HIGButton } from '@/components/ui/HIGButton';
import type { Feature } from '@/lib/billing';

interface FeatureFormData {
  key: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'deprecated' | 'draft';
}

const defaultFormData: FeatureFormData = {
  key: '',
  name: '',
  description: '',
  category: '',
  status: 'draft',
};

export function FeaturesPanel() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FeatureFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);

  const fetchFeatures = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/billing/features?include_deprecated=true');
      if (!res.ok) throw new Error('Failed to fetch features');
      const { data } = await res.json();
      setFeatures(data || []);
    } catch (err) {
      toast.error('機能一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const handleCreate = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (feature: Feature) => {
    setFormData({
      key: feature.key,
      name: feature.name,
      description: feature.description || '',
      category: feature.category || '',
      status: feature.status,
    });
    setEditingId(feature.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingId
        ? `/api/admin/billing/features/${editingId}`
        : '/api/admin/billing/features';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to save feature');
      }

      toast.success(editingId ? '機能を更新しました' : '機能を作成しました');
      setShowForm(false);
      fetchFeatures();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // カテゴリでグループ化
  const groupedFeatures = features.reduce((acc, feature) => {
    const category = feature.category || '未分類';
    if (!acc[category]) acc[category] = [];
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

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
          <h2 className="text-lg font-medium text-[var(--aio-text)]">Features</h2>
          <p className="text-sm text-[var(--aio-text-muted)]">
            機能フラグの作成・編集
          </p>
        </div>
        <HIGButton onClick={handleCreate}>新規作成</HIGButton>
      </div>

      {showForm && (
        <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] p-6">
          <h3 className="text-lg font-medium text-[var(--aio-text)] mb-4">
            {editingId ? '機能を編集' : '新規機能作成'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
                  機能キー (snake_case)
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  className="w-full px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)] font-mono"
                  required
                  pattern="[a-z0-9_]+"
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
                  機能名
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
                  カテゴリ
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
                  placeholder="例: ai, content, analytics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--aio-text)] mb-1">
                  ステータス
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as FeatureFormData['status'] })}
                  className="w-full px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="deprecated">Deprecated</option>
                </select>
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

      {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
        <div key={category} className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] overflow-hidden">
          <div className="px-4 py-3 bg-[var(--aio-surface-secondary)] border-b border-[var(--aio-border)]">
            <h3 className="text-sm font-medium text-[var(--aio-text)]">{category}</h3>
          </div>
          <table className="min-w-full divide-y divide-[var(--aio-border)]">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">キー</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">名前</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">ステータス</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-[var(--aio-text-muted)] uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--aio-border)]">
              {categoryFeatures.map((feature) => (
                <tr key={feature.id} className={feature.status === 'deprecated' ? 'opacity-50' : ''}>
                  <td className="px-4 py-2 text-sm font-mono text-[var(--aio-text)]">{feature.key}</td>
                  <td className="px-4 py-2 text-sm text-[var(--aio-text)]">{feature.name}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        feature.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : feature.status === 'deprecated'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {feature.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleEdit(feature)}
                      className="text-sm text-[var(--aio-primary)] hover:underline"
                    >
                      編集
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
