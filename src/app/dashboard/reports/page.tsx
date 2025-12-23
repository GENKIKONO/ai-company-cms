'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  CalendarIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import type { MonthlyReport, MonthlyReportMetrics, ReportStatus } from '@/types/domain/reports';
import { toPeriodStart, fromPeriodStart } from '@/types/domain/reports';
import { useOrganization } from '@/lib/hooks/useOrganization';
import { useMonthlyReportRealtime } from '@/hooks/useMonthlyReportRealtime';

import { logger } from '@/lib/log';

// Filter presets for period selection
type PeriodPreset = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months';

interface FilterState {
  periodPreset: PeriodPreset;
  status: ReportStatus | 'all';
  sortOrder: 'desc' | 'asc';
}

interface ReportsResponse {
  success: boolean;
  data: MonthlyReport[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

// Helper to safely get metrics
function getMetrics(report: MonthlyReport): MonthlyReportMetrics {
  const defaultMetrics: MonthlyReportMetrics = {
    ai_visibility_score: 0,
    total_bot_hits: 0,
    unique_bots: 0,
    analyzed_urls: 0,
    top_performing_urls: 0,
    improvement_needed_urls: 0
  };
  if (!report.metrics) return defaultMetrics;
  if (typeof report.metrics === 'object') {
    return { ...defaultMetrics, ...(report.metrics as object) } as MonthlyReportMetrics;
  }
  return defaultMetrics;
}

// Helper to get year/month from report
function getReportYearMonth(report: MonthlyReport): { year: number; month: number } {
  return fromPeriodStart(report.period_start);
}

// Helper to get period range from preset
function getPeriodRange(preset: PeriodPreset): { from?: string; to?: string } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  switch (preset) {
    case 'this_month':
      return { from: toPeriodStart(currentYear, currentMonth) };
    case 'last_month': {
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      return { from: toPeriodStart(lastYear, lastMonth), to: toPeriodStart(lastYear, lastMonth) };
    }
    case 'last_3_months': {
      let m = currentMonth - 2;
      let y = currentYear;
      if (m <= 0) { m += 12; y -= 1; }
      return { from: toPeriodStart(y, m) };
    }
    case 'last_6_months': {
      let m = currentMonth - 5;
      let y = currentYear;
      if (m <= 0) { m += 12; y -= 1; }
      return { from: toPeriodStart(y, m) };
    }
    default:
      return {};
  }
}

export default function ReportsPage() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    periodPreset: 'all',
    status: 'all',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    has_more: false
  });

  // Get organization for Realtime subscription
  const { organization } = useOrganization();

  // Realtime subscription for report updates
  const { isConnected: realtimeConnected } = useMonthlyReportRealtime({
    organizationId: organization?.id ?? null,
    autoConnect: true,
    showToast: true,
    onReportUpdate: useCallback((updatedReport) => {
      // Update local state when a report changes
      setReports(prev => {
        const index = prev.findIndex(r => r.id === updatedReport.id);
        if (index >= 0) {
          const newReports = [...prev];
          newReports[index] = {
            ...newReports[index],
            status: updatedReport.status,
            metrics: updatedReport.metrics as unknown as MonthlyReportMetrics,
            updated_at: updatedReport.updated_at
          };
          return newReports;
        }
        // If not found and it's a new report, add to beginning
        return [updatedReport as unknown as MonthlyReport, ...prev];
      });
    }, [])
  });

  const fetchReports = useCallback(async (append = false, currentOffset = 0) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      // Build query params
      const params = new URLSearchParams();
      const { from, to } = getPeriodRange(filters.periodPreset);
      if (from) params.set('period_from', from);
      if (to) params.set('period_to', to);
      if (filters.status !== 'all') params.set('status', filters.status);
      params.set('sort', filters.sortOrder);
      params.set('limit', '20');
      params.set('offset', String(currentOffset));

      const response = await fetch(`/api/my/reports?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data: ReportsResponse = await response.json().catch(() => ({
        success: false,
        data: [],
        pagination: { total: 0, limit: 20, offset: 0, has_more: false }
      }));

      if (append) {
        setReports(prev => [...prev, ...(data.data || [])]);
      } else {
        setReports(data.data || []);
      }
      setPagination(data.pagination);
    } catch (error) {
      logger.error('Error fetching reports:', { data: error });
      toast.error('レポートの取得に失敗しました');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  const generateReport = async (year: number, month: number) => {
    const reportKey = `${year}-${month}`;
    setGenerating(reportKey);
    
    try {
      const response = await fetch('/api/my/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ year, month }),
      });
      
      const data = await response.json().catch(() => ({ success: false, error: 'Failed to parse response' }));
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }
      
      toast.success('レポート生成を開始しました');
      
      // Refresh reports list
      await fetchReports();
      
    } catch (error) {
      logger.error('Error generating report:', { data: error });
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('レポートの生成に失敗しました');
      }
    } finally {
      setGenerating(null);
    }
  };

  const downloadReport = (report: MonthlyReport) => {
    const metrics = getMetrics(report);
    if (metrics.file_url) {
      window.open(metrics.file_url, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatMonthYear = (year: number, month: number) => {
    return new Date(year, month - 1).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'generating':
        return <ArrowPathIcon className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '完了';
      case 'generating':
        return '生成中';
      case 'failed':
        return '失敗';
      default:
        return '不明';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'generating':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const generateQuickReports = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const options = [];
    
    // Previous month
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    options.push({ year: prevYear, month: prevMonth, label: '先月' });
    
    // Current month (if past the 5th)
    if (now.getDate() > 5) {
      options.push({ year: currentYear, month: currentMonth, label: '今月' });
    }
    
    return options;
  };

  // Fetch reports when filters change
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Load more reports
  const loadMore = () => {
    const nextOffset = pagination.offset + pagination.limit;
    fetchReports(true, nextOffset);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-6 text-gray-900">月次レポート</h1>
          <p className="mt-2 text-sm text-gray-700">
            AI可視性データの月次分析レポートを生成・ダウンロードできます
          </p>
        </div>
        {/* Realtime connection indicator */}
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              realtimeConnected
                ? 'bg-green-50 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
            title={realtimeConnected ? 'リアルタイム更新中' : '接続中...'}
          >
            <SignalIcon className={`h-3.5 w-3.5 mr-1 ${realtimeConnected ? 'text-green-500' : 'text-gray-400'}`} />
            {realtimeConnected ? 'Live' : '...'}
          </span>
        </div>
      </div>

      {/* Quick Generate Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">新規レポート生成</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {generateQuickReports().map(({ year, month, label }) => {
            const reportKey = `${year}-${month}`;
            const isGenerating = generating === reportKey;
            const periodStart = toPeriodStart(year, month);
            const existingReport = reports.find(r => r.period_start === periodStart);
            
            return (
              <div key={reportKey} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{label}</h3>
                  {existingReport && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(existingReport.status)}`}>
                      {getStatusIcon(existingReport.status)}
                      <span className="ml-1">{getStatusText(existingReport.status)}</span>
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {formatMonthYear(year, month)}
                </p>
                <button
                  onClick={() => generateReport(year, month)}
                  disabled={isGenerating || existingReport?.status === 'generating'}
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      生成中...
                    </>
                  ) : existingReport?.status === 'completed' ? (
                    '再生成'
                  ) : (
                    '生成'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">レポート一覧</h2>
            <div className="flex items-center gap-2">
              {/* Sort toggle */}
              <button
                onClick={toggleSortOrder}
                className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                title={filters.sortOrder === 'desc' ? '新しい順' : '古い順'}
              >
                {filters.sortOrder === 'desc' ? (
                  <ChevronDownIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronUpIcon className="h-4 w-4 mr-1" />
                )}
                {filters.sortOrder === 'desc' ? '新しい順' : '古い順'}
              </button>
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-3 py-1.5 text-sm rounded-md ${
                  showFilters || filters.periodPreset !== 'all' || filters.status !== 'all'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <FunnelIcon className="h-4 w-4 mr-1" />
                フィルタ
              </button>
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">期間</label>
                <select
                  value={filters.periodPreset}
                  onChange={(e) => handleFilterChange('periodPreset', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="all">すべて</option>
                  <option value="this_month">今月</option>
                  <option value="last_month">先月</option>
                  <option value="last_3_months">過去3ヶ月</option>
                  <option value="last_6_months">過去6ヶ月</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="all">すべて</option>
                  <option value="completed">完了</option>
                  <option value="generating">生成中</option>
                  <option value="pending">保留中</option>
                  <option value="failed">失敗</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <DocumentArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">レポートがありません</h3>
            <p className="mt-1 text-sm text-gray-500">
              上記から新しいレポートを生成してください
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reports.map((report) => {
              const { year, month } = getReportYearMonth(report);
              const metrics = getMetrics(report);
              const reportKey = `${year}-${month}`;

              return (
                <div key={report.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <CalendarIcon className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {formatMonthYear(year, month)}のレポート
                        </p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          <span className="ml-1">{getStatusText(report.status)}</span>
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span>
                          AI可視性スコア: {metrics.ai_visibility_score}点
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          分析URL数: {metrics.analyzed_urls}
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          Bot アクセス: {metrics.total_bot_hits}回
                        </span>
                        {metrics.file_size && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{formatFileSize(metrics.file_size)}</span>
                          </>
                        )}
                      </div>
                      {report.updated_at && (
                        <p className="mt-1 text-xs text-gray-500">
                          更新日時: {new Date(report.updated_at).toLocaleString('ja-JP')}
                        </p>
                      )}
                      {report.status === 'failed' && (
                        <p className="mt-1 text-xs text-red-600">
                          生成に失敗しました。再実行してください。
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      {report.status === 'completed' && metrics.file_url ? (
                        <button
                          onClick={() => downloadReport(report)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                          ダウンロード
                        </button>
                      ) : report.status === 'failed' ? (
                        <button
                          onClick={() => generateReport(year, month)}
                          disabled={generating === reportKey}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowPathIcon className={`h-4 w-4 mr-2 ${generating === reportKey ? 'animate-spin' : ''}`} />
                          再実行
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {report.status === 'generating' ? '処理中...' : '準備中'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pagination.has_more && (
          <div className="px-6 py-4 border-t border-gray-200 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                  読み込み中...
                </>
              ) : (
                `さらに読み込む（残り ${pagination.total - pagination.offset - reports.length} 件）`
              )}
            </button>
          </div>
        )}

        {/* Total count */}
        {reports.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
            {pagination.total} 件中 {reports.length} 件を表示
          </div>
        )}
      </div>
    </div>
  );
}