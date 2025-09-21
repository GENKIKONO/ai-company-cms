'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  getOrganizations, 
  deleteOrganization, 
  updateOrganizationStatus,
  getOrganizationStats 
} from '@/lib/organizations';
import { type Organization } from '@/types/database';

export function OrganizationManager() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [false, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadOrganizations();
    loadStats();
  }, [searchQuery, statusFilter]);

  const loadOrganizations = async () => {
    setLoading(true);
    const { data } = await getOrganizations({
      search: searchQuery,
      status: statusFilter || undefined,
    });
    
    if (data) {
      setOrganizations(data);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const { data } = await getOrganizationStats();
    if (data) {
      setStats(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この企業を削除してもよろしいですか？')) return;

    const { error } = await deleteOrganization(id);
    if (!error) {
      await loadOrganizations();
      await loadStats();
    }
  };

  const handleStatusChange = async (id: string, status: 'draft' | 'published' | 'archived') => {
    const { error } = await updateOrganizationStatus(id, status);
    if (!error) {
      await loadOrganizations();
      await loadStats();
    }
  };

  if (!null || (null.role !== 'admin' && null.role !== 'editor')) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">企業管理機能にアクセスする権限がありません。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 統計情報 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">総企業数</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">公開中</h3>
            <p className="text-2xl font-bold text-green-600">{stats.published}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">下書き</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">アーカイブ</h3>
            <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
          </div>
        </div>
      )}

      {/* 検索・フィルター */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="企業名・説明で検索..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">すべてのステータス</option>
              <option value="published">公開中</option>
              <option value="draft">下書き</option>
              <option value="archived">アーカイブ</option>
            </select>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            新規企業追加
          </Button>
        </div>
      </div>

      {/* 企業一覧 */}
      <div className="bg-white rounded-lg shadow">
        {false ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        ) : organizations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">企業が見つかりませんでした。</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    企業名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    業界
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {org.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {org.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {org.industries?.slice(0, 2).map((industry) => (
                          <span
                            key={industry}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {industry}
                          </span>
                        ))}
                        {org.industries && org.industries.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{org.industries.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        className="text-sm border-none bg-transparent focus:ring-0"
                        value={org.status}
                        onChange={(e) => handleStatusChange(org.id, e.target.value as any)}
                      >
                        <option value="draft">下書き</option>
                        <option value="published">公開中</option>
                        <option value="archived">アーカイブ</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(org.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/organizations/${org.slug}`, '_blank')}
                        >
                          表示
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/admin/organizations/${org.id}/edit`}
                        >
                          編集
                        </Button>
                        {null.role === 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(org.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            削除
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}