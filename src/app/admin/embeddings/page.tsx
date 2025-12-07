/**
 * Embedding Management Page
 * P4-4: Embedding ジョブ管理・監視画面
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  CubeIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { EmbeddingJob, EmbeddingMetrics } from '@/lib/embedding-client';

interface JobsResponse {
  success: boolean;
  data: EmbeddingJob[];
  total: number;
  message?: string;
}

interface MetricsResponse {
  success: boolean;
  data: EmbeddingMetrics;
  message?: string;
}

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

const STATUS_LABELS = {
  pending: '待機中',
  processing: '処理中',
  completed: '完了',
  failed: '失敗',
  cancelled: 'キャンセル'
};

export default function EmbeddingManagementPage() {
  const [jobs, setJobs] = useState<EmbeddingJob[]>([]);
  const [metrics, setMetrics] = useState<EmbeddingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [drainingJobs, setDrainingJobs] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // メトリクス取得
      const metricsResponse = await fetch('/api/admin/embeddings/metrics');
      const metricsData: MetricsResponse = await metricsResponse.json();
      
      if (metricsData.success) {
        setMetrics(metricsData.data);
      }

      // ジョブ一覧取得
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
      });

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (selectedTable !== 'all') {
        params.append('source_table', selectedTable);
      }

      const jobsResponse = await fetch(`/api/admin/embeddings/jobs?${params}`);
      const jobsData: JobsResponse = await jobsResponse.json();
      
      if (jobsData.success) {
        setJobs(jobsData.data);
        setTotalJobs(jobsData.total);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedStatus, selectedTable, pageSize]);

  const handleDrainJobs = async () => {
    const confirmed = confirm('Embedding ジョブのバッチ処理を実行しますか？');
    if (!confirmed) return;

    setDrainingJobs(true);
    try {
      const response = await fetch('/api/admin/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'drain' })
      });

      const result = await response.json();
      if (result.success) {
        alert(`${result.processed_count}件のジョブを処理しました`);
        fetchData(); // データを再取得
      } else {
        alert(`エラー: ${result.message}`);
      }
    } catch (error) {
      alert(`エラーが発生しました: ${error}`);
    } finally {
      setDrainingJobs(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 自動更新（30秒間隔）
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const hasActiveJobs = metrics && (metrics.pending_jobs + metrics.processing_jobs) > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Embedding 管理</h1>
              <p className="mt-2 text-gray-600">テキストEmbedding生成・管理システム</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                更新
              </button>
              <button
                onClick={handleDrainJobs}
                disabled={drainingJobs || !hasActiveJobs}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                {drainingJobs ? '処理中...' : 'バッチ処理実行'}
              </button>
              <Link
                href="/admin/embeddings/bulk"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                一括投入
              </Link>
            </div>
          </div>
        </div>

        {/* メトリクス表示 */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="w-8 h-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総ジョブ数</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {metrics.total_jobs.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">成功率</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {metrics.success_rate_percent}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="w-8 h-8 text-purple-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">待機中</p>
                  <p className="text-2xl font-semibold text-yellow-600">
                    {metrics.pending_jobs}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="w-8 h-8 text-indigo-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Embedding数</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {metrics.total_embeddings.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">すべて</option>
                  <option value="pending">待機中</option>
                  <option value="processing">処理中</option>
                  <option value="completed">完了</option>
                  <option value="failed">失敗</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">テーブル</label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">すべて</option>
                  {metrics && Object.keys(metrics.jobs_by_table).map(table => (
                    <option key={table} value={table}>{table}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ジョブ一覧 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Embedding ジョブ ({totalJobs.toLocaleString()}件)
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">読み込み中...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ジョブID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ソース
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        優先度
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        作成日時
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        チャンク数
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.map((job) => (
                      <tr key={job.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[job.status]}`}>
                            {STATUS_LABELS[job.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{job.source_table}</div>
                            <div className="text-gray-500">{job.source_field}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.priority}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(job.created_at).toLocaleString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.chunk_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ページネーション */}
              {totalJobs > pageSize && (
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalJobs)} 件 / {totalJobs} 件
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      前へ
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage >= Math.ceil(totalJobs / pageSize)}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      次へ
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}