'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardPageShell } from '@/components/dashboard';

interface StorageAccessLog {
  id: string;
  bucket_id: string;
  object_path: string;
  action: string;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status_code: number;
  created_at: string;
}

export default function StorageLogsPage() {
  return (
    <DashboardPageShell title="ストレージログ" requiredRole="admin">
      <StorageLogsContent />
    </DashboardPageShell>
  );
}

function StorageLogsContent() {
  const [logs, setLogs] = useState<StorageAccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBucket, setFilterBucket] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        let query = supabase
          .from('storage_access_logs')
          .select('id, bucket_id, object_path, action, user_id, ip_address, user_agent, status_code, created_at')
          .order('created_at', { ascending: false })
          .limit(200);

        if (filterBucket) {
          query = query.eq('bucket_id', filterBucket);
        }
        if (filterAction) {
          query = query.eq('action', filterAction);
        }

        const { data, error } = await query;
        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データ取得エラー');
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [filterBucket, filterAction]);

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return 'bg-green-100 text-green-800';
    } else if (statusCode >= 400 && statusCode < 500) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (statusCode >= 500) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      read: 'bg-[var(--aio-muted)] text-[var(--aio-primary)]',
      write: 'bg-green-100 text-green-800',
      delete: 'bg-red-100 text-red-800',
      list: 'bg-purple-100 text-purple-800',
    };
    return styles[action?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <li className="text-gray-900 font-medium">ストレージログ</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">ストレージアクセスログ</h1>
            <p className="text-sm text-gray-500 mt-1">ファイルストレージへのアクセス履歴</p>
          </div>

          {/* フィルター */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">バケット</label>
                <select
                  value={filterBucket}
                  onChange={(e) => setFilterBucket(e.target.value)}
                  className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-[var(--aio-primary)] focus:ring-[var(--aio-primary)] text-sm"
                >
                  <option value="">全て</option>
                  <option value="assets">assets</option>
                  <option value="org-docs">org-docs</option>
                  <option value="avatars">avatars</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">アクション</label>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-[var(--aio-primary)] focus:ring-[var(--aio-primary)] text-sm"
                >
                  <option value="">全て</option>
                  <option value="read">read</option>
                  <option value="write">write</option>
                  <option value="delete">delete</option>
                  <option value="list">list</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6" data-testid="storage-logs-list">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-[var(--aio-primary)] border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-4">読み込み中...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-700">{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">バケット</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">パス</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">アクション</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          ログがありません
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {new Date(log.created_at).toLocaleString('ja-JP')}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {log.bucket_id}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate font-mono">
                            {log.object_path}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${getActionBadge(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(log.status_code)}`}>
                              {log.status_code}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                            {log.ip_address || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
