'use client';

import { useMonthlyReportsViewModel } from './_hooks/useMonthlyReportsViewModel';
import { ReportHeader } from './_components/ReportHeader';
import { ReportSummary } from './_components/ReportSummary';
import { ReportJobsPanel } from './_components/ReportJobsPanel';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function MonthlyReportsPage() {
  const {
    // State
    viewState,
    error,
    selectedPeriod,
    selectedReport,
    comparison,
    jobs,
    hasActiveJob,
    realtimeConnected,
    isGenerating,
    isRegenerating,
    availableMonths,
    // Actions
    selectPeriod,
    generateReport,
    regenerateReport,
    refresh,
    refreshJobs
  } = useMonthlyReportsViewModel({ autoFetch: true });

  // Loading State
  if (viewState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">レポートを読み込み中...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (viewState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">エラーが発生しました</h2>
          <p className="text-gray-600">{error || 'レポートの取得に失敗しました'}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        {/* Header with Period & Actions */}
        <ReportHeader
          year={selectedPeriod.year}
          month={selectedPeriod.month}
          onPeriodChange={selectPeriod}
          availableMonths={availableMonths}
          selectedReport={selectedReport}
          hasActiveJob={hasActiveJob}
          realtimeConnected={realtimeConnected}
          onGenerate={generateReport}
          onRegenerate={regenerateReport}
          isGenerating={isGenerating}
          isRegenerating={isRegenerating}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Report Summary (2/3 width) */}
          <div className="lg:col-span-2">
            <ReportSummary
              report={selectedReport}
              comparison={comparison}
              loading={false}
            />
          </div>

          {/* Right: Jobs Panel (1/3 width) */}
          <div className="lg:col-span-1">
            <ReportJobsPanel
              jobs={jobs}
              isConnected={realtimeConnected}
              loading={false}
              onRefresh={refreshJobs}
            />
          </div>
        </div>

        {/* Report Details Section - Show when report exists */}
        {selectedReport && selectedReport.status === 'completed' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">レポート詳細</h2>

            {/* Bot Analysis */}
            {selectedReport.topBots && selectedReport.topBots.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  トップBot分析
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedReport.topBots.slice(0, 6).map((bot, index) => (
                    <div
                      key={bot.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">
                          #{index + 1}
                        </span>
                        <span className="text-sm text-gray-900 truncate max-w-[150px]" title={bot.name}>
                          {bot.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">
                        {bot.hits.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* URL Performance */}
            {selectedReport.topUrls && selectedReport.topUrls.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  トップURL
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          URL
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ヒット数
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          スコア
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedReport.topUrls.slice(0, 10).map((url) => (
                        <tr key={url.path}>
                          <td className="px-4 py-2 text-sm text-gray-900 truncate max-w-[300px]" title={url.path}>
                            {url.path}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-600">
                            {url.hits.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-right font-medium text-blue-600">
                            {url.score}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
