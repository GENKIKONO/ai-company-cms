'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/routes';
import { DashboardPageShell } from '@/components/dashboard';

interface AuditLog {
  id: string;
  job_name: string;
  request_id: string;
  expected_row_count: number;
  affected_row_count: number;
  error_code: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

interface OpsAuditLog {
  id: string;
  action: string;
  actor_id: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

type TabType = 'service_role' | 'ops';

interface Filters {
  from: string;
  to: string;
  action: string;
  actor: string;
  target: string;
}

export default function AuditLogPage() {
  return (
    <DashboardPageShell title="監査ログ" requiredRole="admin">
      <AuditLogContent />
    </DashboardPageShell>
  );
}

function AuditLogContent() {
  const [activeTab, setActiveTab] = useState<TabType>('ops');
  const [serviceRoleLogs, setServiceRoleLogs] = useState<AuditLog[]>([]);
  const [opsLogs, setOpsLogs] = useState<OpsAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ops_audit用フィルター
  const [filters, setFilters] = useState<Filters>({
    from: '',
    to: '',
    action: '',
    actor: '',
    target: '',
  });
  const [actionOptions, setActionOptions] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // アクション一覧を取得
  useEffect(() => {
    async function fetchActions() {
      try {
        const res = await fetch('/api/admin/audit/actions');
        const data = await res.json();
        if (res.ok && data.success) {
          setActionOptions(data.data?.actions || []);
        }
      } catch {
        // エラーは無視（フィルターなしでも使用可能）
      }
    }
    fetchActions();
  }, []);

  // ops_auditのフェッチ（API経由）
  const fetchOpsLogs = useCallback(async (resetCursor = true) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.action) params.set('action', filters.action);
      if (filters.actor) params.set('actor', filters.actor);
      if (filters.target) params.set('target', filters.target);
      if (!resetCursor && cursor) params.set('cursor', cursor);
      params.set('limit', '50');

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'API Error');
      }

      if (resetCursor) {
        setOpsLogs(data.data);
      } else {
        setOpsLogs(prev => [...prev, ...data.data]);
      }
      setTotalCount(data.meta?.count || 0);
      setCursor(data.meta?.nextCursor || null);
      setHasMore(!!data.meta?.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データ取得エラー');
    } finally {
      setLoading(false);
    }
  }, [filters, cursor]);

  // service_role_auditのフェッチ（直接クエリ）
  const fetchServiceRoleLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('service_role_audit')
        .select('id, action, target_type, target_id, user_id, job_name, request_id, expected_row_count, affected_row_count, duration_ms, status, error_code, meta, metadata, ip_address, user_agent, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setServiceRoleLogs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データ取得エラー');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'ops') {
      fetchOpsLogs(true);
    } else {
      fetchServiceRoleLogs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setCursor(null);
    fetchOpsLogs(true);
  };

  const handleLoadMore = () => {
    fetchOpsLogs(false);
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <li className="text-[var(--color-text-primary)] font-medium">監査ログ</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-sm border border-[var(--dashboard-card-border)]">
          <div className="px-6 py-4 border-b border-[var(--dashboard-card-border)]">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">監査ログ</h1>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-1">システム操作の監査証跡を確認</p>
          </div>

          {/* タブ */}
          <div className="border-b border-[var(--dashboard-card-border)]">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('ops')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'ops'
                    ? 'border-[var(--aio-primary)] text-[var(--aio-primary)]'
                    : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                運用操作
              </button>
              <button
                onClick={() => setActiveTab('service_role')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'service_role'
                    ? 'border-[var(--aio-primary)] text-[var(--aio-primary)]'
                    : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                Service Role操作
              </button>
            </nav>
          </div>

          {/* ops_audit用フィルター */}
          {activeTab === 'ops' && (
            <div className="p-4 bg-[var(--aio-surface)] border-b border-[var(--dashboard-card-border)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">開始日</label>
                  <input
                    type="date"
                    value={filters.from}
                    onChange={(e) => handleFilterChange('from', e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md text-sm focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">終了日</label>
                  <input
                    type="date"
                    value={filters.to}
                    onChange={(e) => handleFilterChange('to', e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md text-sm focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">アクション</label>
                  <select
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md text-sm focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
                  >
                    <option value="">全て</option>
                    {actionOptions.map((action) => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">実行者ID</label>
                  <input
                    type="text"
                    placeholder="部分一致"
                    value={filters.actor}
                    onChange={(e) => handleFilterChange('actor', e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md text-sm focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">対象</label>
                  <input
                    type="text"
                    placeholder="部分一致"
                    value={filters.target}
                    onChange={(e) => handleFilterChange('target', e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md text-sm focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-[var(--aio-primary)] text-white text-sm font-medium rounded-md hover:bg-[var(--aio-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    検索
                  </button>
                </div>
              </div>
              {totalCount > 0 && (
                <div className="mt-3 text-sm text-[var(--color-text-secondary)]">
                  合計: {totalCount.toLocaleString()} 件
                </div>
              )}
            </div>
          )}

          <div className="p-6" data-testid="audit-logs-list">
            {loading && opsLogs.length === 0 && serviceRoleLogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-[var(--aio-primary)] border-t-transparent rounded-full mx-auto"></div>
                <p className="text-[var(--color-text-tertiary)] mt-4">読み込み中...</p>
              </div>
            ) : error ? (
              <div className="bg-[var(--aio-danger-muted)] border border-[var(--aio-danger)] rounded-md p-4">
                <p className="text-[var(--aio-danger)]">{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {activeTab === 'service_role' ? (
                  <table className="min-w-full divide-y divide-[var(--dashboard-card-border)]">
                    <thead className="bg-[var(--aio-surface)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">日時</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">ジョブ名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">リクエストID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">予定/実行</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">エラー</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[var(--dashboard-card-border)]">
                      {serviceRoleLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-tertiary)]">
                            ログがありません
                          </td>
                        </tr>
                      ) : (
                        serviceRoleLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)]">
                              {formatDate(log.created_at)}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-[var(--color-text-primary)]">
                              {log.job_name}
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)] font-mono">
                              {log.request_id?.slice(0, 8) || '-'}...
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
                              {log.expected_row_count} / {log.affected_row_count}
                            </td>
                            <td className="px-4 py-4">
                              {log.error_code ? (
                                <span className="px-2 py-1 text-xs rounded-full bg-[var(--aio-danger-muted)] text-[var(--aio-danger)]">
                                  {log.error_code}
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs rounded-full bg-[var(--aio-success-muted)] text-[var(--aio-success)]">
                                  OK
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <>
                    <table className="min-w-full divide-y divide-[var(--dashboard-card-border)]">
                      <thead className="bg-[var(--aio-surface)]">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase w-8"></th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">日時</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">アクション</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">対象タイプ</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">対象ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">実行者</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-[var(--dashboard-card-border)]">
                        {opsLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-tertiary)]">
                              ログがありません
                            </td>
                          </tr>
                        ) : (
                          opsLogs.map((log) => (
                            <>
                              <tr key={log.id} className="hover:bg-[var(--aio-surface)]">
                                <td className="px-4 py-4">
                                  {log.details && Object.keys(log.details).length > 0 && (
                                    <button
                                      onClick={() => toggleRowExpand(log.id)}
                                      className="text-[var(--color-icon-muted)] hover:text-[var(--color-text-secondary)]"
                                      aria-label="詳細を展開"
                                    >
                                      <svg
                                        className={`h-5 w-5 transform transition-transform ${expandedRows.has(log.id) ? 'rotate-90' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </button>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)] whitespace-nowrap">
                                  {formatDate(log.created_at)}
                                </td>
                                <td className="px-4 py-4">
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-[var(--aio-muted)] text-[var(--aio-primary)]">
                                    {log.action}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
                                  {log.target_type || '-'}
                                </td>
                                <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)] font-mono">
                                  {log.target_id ? `${log.target_id.slice(0, 12)}...` : '-'}
                                </td>
                                <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)] font-mono">
                                  {log.actor_id ? `${log.actor_id.slice(0, 12)}...` : '-'}
                                </td>
                              </tr>
                              {expandedRows.has(log.id) && log.details && (
                                <tr key={`${log.id}-details`}>
                                  <td colSpan={6} className="px-4 py-4 bg-[var(--aio-surface)]">
                                    <div className="text-sm">
                                      <p className="font-medium text-[var(--color-text-secondary)] mb-2">詳細 (details):</p>
                                      <pre className="bg-[var(--code-block-bg)] text-[var(--code-block-text)] p-4 rounded-md overflow-x-auto text-xs">
                                        {JSON.stringify(log.details, null, 2)}
                                      </pre>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          ))
                        )}
                      </tbody>
                    </table>

                    {/* ページネーション */}
                    {hasMore && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={handleLoadMore}
                          disabled={loading}
                          className="px-6 py-2 bg-[var(--aio-surface)] text-[var(--color-text-secondary)] text-sm font-medium rounded-md hover:bg-[var(--dashboard-card-border)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? '読み込み中...' : 'さらに読み込む'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
