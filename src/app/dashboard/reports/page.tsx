'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  CalendarIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import type { MonthlyReport } from '@/types/domain/reports';;

import { logger } from '@/lib/log';
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

export default function ReportsPage() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    has_more: false
  });

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/my/reports');
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data: ReportsResponse = await response.json();
      setReports(data.data || []);
      setPagination(data.pagination);
    } catch (error) {
      logger.error('Error fetching reports:', { data: error });
      toast.error('レポートの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

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
      
      const data = await response.json();
      
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
    if (report.file_url) {
      window.open(report.file_url, '_blank');
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

  useEffect(() => {
    fetchReports();
  }, []);

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
      </div>

      {/* Quick Generate Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">新規レポート生成</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {generateQuickReports().map(({ year, month, label }) => {
            const reportKey = `${year}-${month}`;
            const isGenerating = generating === reportKey;
            const existingReport = reports.find(r => r.year === year && r.month === month);
            
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
          <h2 className="text-lg font-medium text-gray-900">レポート一覧</h2>
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
            {reports.map((report) => (
              <div key={report.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <CalendarIcon className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {formatMonthYear(report.year, report.month)}のレポート
                      </p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        <span className="ml-1">{getStatusText(report.status)}</span>
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span>
                        AI可視性スコア: {report.data_summary.ai_visibility_score}点
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        分析URL数: {report.data_summary.analyzed_urls}
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        Bot アクセス: {report.data_summary.total_bot_hits}回
                      </span>
                      {report.file_size && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{formatFileSize(report.file_size)}</span>
                        </>
                      )}
                    </div>
                    {report.generated_at && (
                      <p className="mt-1 text-xs text-gray-500">
                        生成日時: {new Date(report.generated_at).toLocaleString('ja-JP')}
                      </p>
                    )}
                    {report.error_message && (
                      <p className="mt-1 text-xs text-red-600">
                        エラー: {report.error_message}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {report.status === 'completed' && report.file_url ? (
                      <button
                        onClick={() => downloadReport(report)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                        ダウンロード
                      </button>
                    ) : report.status === 'failed' ? (
                      <button
                        onClick={() => generateReport(report.year, report.month)}
                        disabled={generating === `${report.year}-${report.month}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowPathIcon className={`h-4 w-4 mr-2 ${generating === `${report.year}-${report.month}` ? 'animate-spin' : ''}`} />
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
            ))}
          </div>
        )}

        {pagination.has_more && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => {
                // TODO: Implement pagination
              }}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              さらに読み込む
            </button>
          </div>
        )}
      </div>
    </div>
  );
}