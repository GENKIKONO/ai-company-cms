'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Eye, Check, X, Filter } from 'lucide-react';
import { HIGButton } from '@/design-system';

interface Report {
  id: string;
  organization_id: string;
  organization_name?: string;
  report_type: string;
  description: string;
  reported_url?: string;
  reporter_ip: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

const reportTypeLabels = {
  inappropriate_content: '不適切なコンテンツ',
  fake_information: '虚偽の情報',
  spam: 'スパム・宣伝',
  copyright_violation: '著作権侵害',
  harassment: 'ハラスメント',
  other: 'その他'
};

const statusLabels = {
  pending: '未対応',
  reviewing: '確認中',
  resolved: '解決済み',
  dismissed: '却下'
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-700',
  reviewing: 'bg-gray-100 text-gray-700',
  resolved: 'bg-gray-100 text-gray-700',
  dismissed: 'bg-gray-100 text-gray-700'
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/reports');
      if (!response.ok) {
        throw new Error('通報データの取得に失敗しました');
      }
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: string, notes?: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          admin_notes: notes,
        }),
      });

      if (!response.ok) {
        throw new Error('ステータスの更新に失敗しました');
      }

      await fetchReports();
      setSelectedReport(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setUpdating(false);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
          <span className="ml-3">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <nav className="flex mb-4">
          <Link href="/management-console" className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)]">
            管理コンソール
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-900">通報管理</span>
        </nav>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">通報管理</h1>
        <p className="text-gray-600">
          ユーザーからの通報を確認し、適切に対応してください
        </p>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">フィルター:</span>
          
          {['all', 'pending', 'reviewing', 'resolved', 'dismissed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === status
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'すべて' : statusLabels[status as keyof typeof statusLabels]}
              {status !== 'all' && (
                <span className="ml-1">
                  ({reports.filter(r => r.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 通報一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">通報がありません</h3>
            <p className="text-gray-500">
              {filter === 'all' ? '現在、通報はありません。' : `${statusLabels[filter as keyof typeof statusLabels]}の通報はありません。`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    通報日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    対象企業
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    理由
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(report.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {report.organization_name || '不明'}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {report.organization_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {reportTypeLabels[report.report_type as keyof typeof reportTypeLabels]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[report.status]}`}>
                        {statusLabels[report.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] mr-4"
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        詳細
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 詳細モーダル */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">通報詳細</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">対象企業</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedReport.organization_name || '不明'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">通報理由</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {reportTypeLabels[selectedReport.report_type as keyof typeof reportTypeLabels]}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">詳細説明</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedReport.description}
                  </p>
                </div>

                {selectedReport.reported_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">通報対象URL</label>
                    <a
                      href={selectedReport.reported_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)]"
                    >
                      {selectedReport.reported_url}
                    </a>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">通報日時</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedReport.created_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">現在のステータス</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[selectedReport.status]}`}>
                    {statusLabels[selectedReport.status]}
                  </span>
                </div>

                {/* アクションボタン */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">対応アクション</h4>
                  <div className="flex gap-2 flex-wrap">
                    <HIGButton
                      onClick={() => updateReportStatus(selectedReport.id, 'reviewing')}
                      disabled={updating || selectedReport.status === 'reviewing'}
                      variant="primary"
                      size="sm"
                    >
                      確認中にする
                    </HIGButton>
                    <button
                      onClick={() => updateReportStatus(selectedReport.id, 'resolved')}
                      disabled={updating || selectedReport.status === 'resolved'}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      解決済みにする
                    </button>
                    <button
                      onClick={() => updateReportStatus(selectedReport.id, 'dismissed')}
                      disabled={updating || selectedReport.status === 'dismissed'}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      却下する
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}