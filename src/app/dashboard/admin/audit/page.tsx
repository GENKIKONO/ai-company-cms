'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
        .select('*')
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
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                ダッシュボード
              </Link>
            </li>
            <li><span className="text-gray-500">/</span></li>
            <li>
              <Link href="/dashboard/admin" className="text-gray-500 hover:text-gray-700">
                管理
              </Link>
            </li>
            <li><span className="text-gray-500">/</span></li>
            <li className="text-gray-900 font-medium">監査ログ</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">監査ログ</h1>
            <p className="text-sm text-gray-500 mt-1">システム操作の監査証跡を確認</p>
          </div>

          {/* タブ */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('ops')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'ops'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                運用操作
              </button>
              <button
                onClick={() => setActiveTab('service_role')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'service_role'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Service Role操作
              </button>
            </nav>
          </div>

          {/* ops_audit用フィルター */}
          {activeTab === 'ops' && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">開始日</label>
                  <input
                    type="date"
                    value={filters.from}
                    onChange={(e) => handleFilterChange('from', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">終了日</label>
                  <input
                    type="date"
                    value={filters.to}
                    onChange={(e) => handleFilterChange('to', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">アクション</label>
                  <select
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">全て</option>
                    {actionOptions.map((action) => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">実行者ID</label>
                  <input
                    type="text"
                    placeholder="部分一致"
                    value={filters.actor}
                    onChange={(e) => handleFilterChange('actor', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">対象</label>
                  <input
                    type="text"
                    placeholder="部分一致"
                    value={filters.target}
                    onChange={(e) => handleFilterChange('target', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    検索
                  </button>
                </div>
              </div>
              {totalCount > 0 && (
                <div className="mt-3 text-sm text-gray-600">
                  合計: {totalCount.toLocaleString()} 件
                </div>
              )}
            </div>
          )}

          <div className="p-6" data-testid="audit-logs-list">
            {loading && opsLogs.length === 0 && serviceRoleLogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-4">読み込み中...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-700">{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {activeTab === 'service_role' ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ジョブ名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">リクエストID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">予定/実行</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">エラー</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {serviceRoleLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            ログがありません
                          </td>
                        </tr>
                      ) : (
                        serviceRoleLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {formatDate(log.created_at)}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              {log.job_name}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                              {log.request_id?.slice(0, 8) || '-'}...
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {log.expected_row_count} / {log.affected_row_count}
                            </td>
                            <td className="px-4 py-4">
                              {log.error_code ? (
                                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                  {log.error_code}
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
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
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">アクション</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">対象タイプ</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">対象ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">実行者</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {opsLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              ログがありません
                            </td>
                          </tr>
                        ) : (
                          opsLogs.map((log) => (
                            <>
                              <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4">
                                  {log.details && Object.keys(log.details).length > 0 && (
                                    <button
                                      onClick={() => toggleRowExpand(log.id)}
                                      className="text-gray-400 hover:text-gray-600"
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
                                <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {formatDate(log.created_at)}
                                </td>
                                <td className="px-4 py-4">
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                    {log.action}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">
                                  {log.target_type || '-'}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                                  {log.target_id ? `${log.target_id.slice(0, 12)}...` : '-'}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                                  {log.actor_id ? `${log.actor_id.slice(0, 12)}...` : '-'}
                                </td>
                              </tr>
                              {expandedRows.has(log.id) && log.details && (
                                <tr key={`${log.id}-details`}>
                                  <td colSpan={6} className="px-4 py-4 bg-gray-50">
                                    <div className="text-sm">
                                      <p className="font-medium text-gray-700 mb-2">詳細 (details):</p>
                                      <pre className="bg-gray-800 text-green-400 p-4 rounded-md overflow-x-auto text-xs">
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
                          className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
