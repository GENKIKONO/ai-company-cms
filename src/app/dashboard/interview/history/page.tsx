'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HIGButton } from '@/design-system';
import DashboardBackLink from '@/components/dashboard/DashboardBackLink';
import type { InterviewSession, SessionListResponse } from '@/types/interview-session';
import { logger } from '@/lib/utils/logger';

interface SessionTableProps {
  sessions: InterviewSession[];
  onResume: (sessionId: string) => void;
  onView: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  loading?: boolean;
}

function SessionTable({ sessions, onResume, onView, onDelete, loading }: SessionTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">下書き</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">進行中</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">完了</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getContentTypeLabel = (contentType: string) => {
    switch (contentType) {
      case 'service':
        return 'サービス';
      case 'product':
        return '製品';
      case 'faq':
        return 'FAQ';
      case 'case_study':
        return '導入事例';
      default:
        return contentType;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">セッション履歴</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">セッション履歴</h2>
      </div>
      
      {sessions.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500">セッションがありません</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作成日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  コンテンツタイプ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  アクション
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(session.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getContentTypeLabel(session.content_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(session.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    {session.status === 'completed' ? (
                      <button
                        onClick={() => onView(session.id)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        閲覧
                      </button>
                    ) : (
                      <button
                        onClick={() => onResume(session.id)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        再開
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(session.id)}
                      className="text-red-600 hover:text-red-900 font-medium ml-4"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function InterviewHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  
  // フィルター状態
  const [filters, setFilters] = useState({
    organizationId: '',
    status: '' as '' | 'draft' | 'in_progress' | 'completed'
  });

  // ページネーション状態
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        page_size: pagination.pageSize.toString()
      });

      if (filters.organizationId) {
        params.set('organization_id', filters.organizationId);
      }

      if (filters.status) {
        params.set('status', filters.status);
      }

      const response = await fetch(`/api/my/interview/sessions?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load sessions');
      }

      const result: SessionListResponse = await response.json();
      setSessions(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.total
      }));

    } catch (err) {
      logger.error('Failed to load sessions:', { data: err });
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleResume = useCallback((sessionId: string) => {
    router.push(`/dashboard/interview/${sessionId}`);
  }, [router]);

  const handleView = useCallback((sessionId: string) => {
    router.push(`/dashboard/interview/${sessionId}`);
  }, [router]);

  const handleDelete = useCallback(async (sessionId: string) => {
    if (!confirm('このセッションを削除してもよろしいですか？\nこの操作は元に戻せません。')) {
      return;
    }

    try {
      const response = await fetch(`/api/my/interview/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete session');
      }

      // セッション一覧を再読み込み
      await loadSessions();
      
    } catch (err) {
      logger.error('Failed to delete session:', { data: err });
      alert('セッションの削除に失敗しました。');
    }
  }, [loadSessions]);

  const handleStatusFilter = useCallback((status: '' | 'draft' | 'in_progress' | 'completed') => {
    setFilters(prev => ({ ...prev, status }));
    setPagination(prev => ({ ...prev, page: 1 })); // ページを1に戻す
  }, []);

  const handleNextPage = useCallback(() => {
    if (pagination.page * pagination.pageSize < pagination.total) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  }, [pagination]);

  const handlePrevPage = useCallback(() => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
    }
  }, [pagination]);

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AIインタビュー履歴</h1>
              <p className="text-lg text-gray-600 mt-2">
                過去のインタビューセッションを確認・管理できます
              </p>
            </div>
            <div className="flex space-x-4">
              <DashboardBackLink variant="button" className="mb-0" />
              <Link href="/dashboard/interview">
                <HIGButton variant="primary">
                  新しいインタビューを開始
                </HIGButton>
              </Link>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* フィルター */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">フィルター</h2>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleStatusFilter(e.target.value as typeof filters.status)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] text-sm"
              >
                <option value="">すべて</option>
                <option value="draft">下書き</option>
                <option value="in_progress">進行中</option>
                <option value="completed">完了</option>
              </select>
            </div>
          </div>
        </div>

        {/* セッション一覧 */}
        <SessionTable
          sessions={sessions}
          onResume={handleResume}
          onView={handleView}
          onDelete={handleDelete}
          loading={loading}
        />

        {/* ページネーション */}
        {pagination.total > pagination.pageSize && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} / {pagination.total} 件
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                前へ
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                {pagination.page} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={pagination.page >= totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}