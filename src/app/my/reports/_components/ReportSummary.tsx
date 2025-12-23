'use client';

import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChartBarIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  type ReportViewModel,
  type MonthComparison,
  formatPeriodLabel
} from '../_types';

interface ReportSummaryProps {
  report: ReportViewModel | null;
  comparison: MonthComparison | null;
  loading?: boolean;
}

interface StatCardProps {
  label: string;
  value: number | string;
  change?: number | null;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ label, value, change, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
    orange: 'bg-orange-100'
  };

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${iconBgClasses[color]}`}>
          {icon}
        </div>
        {change !== null && change !== undefined && (
          <div className={`flex items-center text-sm ${
            change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {change > 0 ? (
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            ) : change < 0 ? (
              <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
            ) : (
              <MinusIcon className="h-4 w-4 mr-1" />
            )}
            <span>{change > 0 ? '+' : ''}{change}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

export function ReportSummary({ report, comparison, loading }: ReportSummaryProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8 text-gray-500">
          <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>この期間のレポートはまだありません</p>
          <p className="text-sm mt-2">「レポート生成」ボタンで作成できます</p>
        </div>
      </div>
    );
  }

  const { metrics } = report;
  const changes = comparison?.changes;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <SparklesIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            {formatPeriodLabel(report.year, report.month)} サマリー
          </h2>
        </div>
        {comparison?.previous && (
          <span className="text-sm text-gray-500">
            前月比較: {formatPeriodLabel(
              report.month === 1 ? report.year - 1 : report.year,
              report.month === 1 ? 12 : report.month - 1
            )}
          </span>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="AI可視性スコア"
          value={metrics.aiVisibilityScore}
          change={changes?.aiVisibilityScore}
          icon={<ChartBarIcon className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          label="Bot アクセス数"
          value={metrics.totalBotHits}
          change={changes?.totalBotHits}
          icon={<GlobeAltIcon className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          label="分析URL数"
          value={metrics.analyzedUrls}
          change={changes?.analyzedUrls}
          icon={<DocumentTextIcon className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          label="ユニークBot数"
          value={metrics.uniqueBots}
          change={null}
          icon={<SparklesIcon className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Summary Text */}
      {report.summaryText && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">AIサマリー</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{report.summaryText}</p>
        </div>
      )}

      {/* URL Performance Breakdown */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <span className="text-sm text-green-700">高パフォーマンスURL</span>
          <span className="text-lg font-semibold text-green-600">{metrics.topPerformingUrls}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
          <span className="text-sm text-amber-700">改善が必要なURL</span>
          <span className="text-lg font-semibold text-amber-600">{metrics.improvementNeededUrls}</span>
        </div>
      </div>
    </div>
  );
}
