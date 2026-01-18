'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserPlusIcon,
  TrashIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { DashboardPageShell } from '@/components/dashboard';

interface Organization {
  id: string;
  name: string;
  company_name?: string;
}

interface OrgGroup {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  owner_organization?: Organization;
  member_count?: [{ count: number }];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface JoinRequest {
  id: string;
  group_id: string;
  organization_id: string;
  status: string;
  requested_at: string;
  organization?: Organization;
}

export default function OrgGroupsPage() {
  return (
    <DashboardPageShell title="組織グループ" requiredRole="admin">
      <OrgGroupsContent />
    </DashboardPageShell>
  );
}

function OrgGroupsContent() {
  const [groups, setGroups] = useState<OrgGroup[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Join requests state
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    owner_organization_id: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) {
        params.set('search', search);
      }

      const response = await fetch(`/api/admin/org-groups?${params}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to fetch groups');
      }

      setGroups(json.data || []);
      if (json.pagination) {
        setPagination(json.pagination);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  const fetchJoinRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const response = await fetch('/api/admin/org-groups/join-requests?status=pending');
      const json = await response.json();
      if (response.ok && json.data) {
        setJoinRequests(json.data);
      }
    } catch {
      // Silent fail for join requests
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchJoinRequests();
  }, [fetchGroups, fetchJoinRequests]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.owner_organization_id) return;

    setCreating(true);
    try {
      const response = await fetch('/api/admin/org-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to create group');
      }

      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', owner_organization_id: '' });
      fetchGroups();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/org-groups/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Failed to approve request');
      }

      fetchJoinRequests();
      fetchGroups();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/org-groups/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Failed to reject request');
      }

      fetchJoinRequests();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to reject request');
    }
  };

  const getMemberCount = (group: OrgGroup) => {
    if (Array.isArray(group.member_count) && group.member_count[0]?.count !== undefined) {
      return group.member_count[0].count;
    }
    return 0;
  };

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href={ROUTES.dashboard} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
                ダッシュボード
              </Link>
            </li>
            <li><span className="text-[var(--color-text-tertiary)]">/</span></li>
            <li>
              <Link href={ROUTES.dashboardManage} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
                管理
              </Link>
            </li>
            <li><span className="text-[var(--color-text-tertiary)]">/</span></li>
            <li className="text-[var(--color-text-primary)] font-medium">組織グループ</li>
          </ol>
        </nav>

        {/* Pending Join Requests */}
        {joinRequests.length > 0 && (
          <div className="bg-[var(--aio-warning-muted)] border border-[var(--aio-warning)] rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <EnvelopeIcon className="h-5 w-5 text-[var(--aio-warning)]" />
              <h3 className="font-medium text-[var(--aio-warning)]">
                保留中の参加リクエスト ({joinRequests.length}件)
              </h3>
            </div>
            <div className="space-y-2">
              {joinRequests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between bg-white rounded p-3 border border-[var(--status-warning)]"
                >
                  <div>
                    <span className="font-medium">
                      {request.organization?.name || request.organization_id}
                    </span>
                    <span className="text-[var(--color-text-tertiary)] text-sm ml-2">
                      {new Date(request.requested_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveRequest(request.id)}
                      className="px-3 py-1 text-sm bg-[var(--aio-success)] text-white rounded hover:opacity-90"
                    >
                      承認
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="px-3 py-1 text-sm bg-[var(--aio-danger-muted)] text-[var(--aio-danger)] rounded hover:opacity-80"
                    >
                      拒否
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-[var(--dashboard-card-border)]">
          <div className="px-6 py-4 border-b border-[var(--dashboard-card-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-6 w-6 text-[var(--color-text-secondary)]" />
                <div>
                  <h1 className="text-xl font-bold text-[var(--color-text-primary)]">組織グループ管理</h1>
                  <p className="text-sm text-[var(--color-text-tertiary)]">組織グループの作成・管理・招待</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--aio-primary)] text-white rounded-lg hover:bg-[var(--aio-primary-hover)] transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                新規作成
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-4 border-b border-[var(--dashboard-card-border)]">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-icon-muted)]" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="グループ名で検索..."
                  className="w-full pl-10 pr-4 py-2 border border-[var(--input-border)] rounded-lg focus:ring-2 focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--aio-surface)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--dashboard-card-border)]"
              >
                検索
              </button>
            </form>
          </div>

          {/* Groups List */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
                <span className="ml-3 text-[var(--color-text-tertiary)]">読み込み中...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-[var(--aio-danger)]">{error}</p>
                <button
                  onClick={fetchGroups}
                  className="mt-4 px-4 py-2 bg-[var(--aio-primary)] text-white rounded-lg hover:bg-[var(--aio-primary-hover)]"
                >
                  再試行
                </button>
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12">
                <UserGroupIcon className="mx-auto h-12 w-12 text-[var(--color-icon-muted)]" />
                <p className="mt-4 text-[var(--color-text-tertiary)]">
                  {search ? '検索結果がありません' : '組織グループがありません'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="border border-[var(--dashboard-card-border)] rounded-lg p-4 hover:border-[var(--aio-primary)]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-[var(--color-text-primary)]">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">{group.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-[var(--color-text-tertiary)]">
                          <span>
                            オーナー: {group.owner_organization?.name || group.owner_organization?.company_name || '-'}
                          </span>
                          <span>メンバー: {getMemberCount(group)}組織</span>
                          <span>
                            作成: {new Date(group.created_at).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/manage/org-groups/${group.id}/invites`}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--aio-muted)] text-[var(--aio-primary)] rounded hover:bg-[var(--aio-muted)]"
                        >
                          <UserPlusIcon className="h-4 w-4" />
                          招待
                        </Link>
                        <Link
                          href={`/dashboard/manage/org-groups/${group.id}`}
                          className="px-3 py-1.5 text-sm bg-[var(--aio-surface)] text-[var(--color-text-secondary)] rounded hover:bg-[var(--dashboard-card-border)]"
                        >
                          詳細
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--dashboard-card-border)]">
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  全 {pagination.total} 件中 {(pagination.page - 1) * pagination.limit + 1} -{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} 件
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page <= 1}
                    className="p-2 rounded hover:bg-[var(--aio-surface)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <span className="px-3 py-1 text-sm">
                    {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page >= pagination.pages}
                    className="p-2 rounded hover:bg-[var(--aio-surface)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="px-6 py-4 border-b border-[var(--dashboard-card-border)]">
                <h2 className="text-lg font-semibold">新規グループ作成</h2>
              </div>
              <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    グループ名 <span className="text-[var(--aio-danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg focus:ring-2 focus:ring-[var(--aio-primary)]"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    説明
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg focus:ring-2 focus:ring-[var(--aio-primary)]"
                    rows={3}
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    オーナー組織ID <span className="text-[var(--aio-danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.owner_organization_id}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, owner_organization_id: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg focus:ring-2 focus:ring-[var(--aio-primary)]"
                    required
                    placeholder="UUID形式"
                  />
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    グループを所有する組織のIDを入力してください
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--aio-surface)] rounded-lg"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !createForm.name || !createForm.owner_organization_id}
                    className="px-4 py-2 bg-[var(--aio-primary)] text-white rounded-lg hover:bg-[var(--aio-primary-hover)] disabled:opacity-50"
                  >
                    {creating ? '作成中...' : '作成'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
