import { fetchMetricsData } from '@/lib/admin/metrics';
import type { MetricsSummary } from '@/types/admin-metrics';

interface MetricsSummaryCardsProps {
  range: '1w' | '4w' | '12w';
  orgId?: string;
}

export default async function MetricsSummaryCards({ range, orgId }: MetricsSummaryCardsProps) {
  try {
    const metricsData = await fetchMetricsData(range, orgId);
    const summary = metricsData.summary;

    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">今週のサマリー</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* RLS拒否総数カード */}
          <SummaryCard
            title="RLS拒否総数"
            value={summary.rls_denied_count}
            description="今週のRLS拒否イベント数"
            status={getStatusColor(summary.rls_denied_count, 'rls_denied')}
            icon="🛡️"
          />

          {/* ジョブ失敗率TOP3カード */}
          <SummaryCard
            title="ジョブ失敗率"
            value={summary.job_fail_rate_top3.length > 0 ? `${summary.job_fail_rate_top3[0].fail_rate_pct.toFixed(1)}%` : '0%'}
            description={summary.job_fail_rate_top3.length > 0 ? `最高: ${summary.job_fail_rate_top3[0].job_name}` : 'データなし'}
            status={getStatusColor(summary.job_fail_rate_top3[0]?.fail_rate_pct || 0, 'job_fail_rate')}
            icon="⚡"
            subItems={summary.job_fail_rate_top3.slice(0, 3)}
          />

          {/* Edgeエラー率Worst3カード */}
          <SummaryCard
            title="Edge関数エラー率"
            value={summary.edge_error_rate_worst3.length > 0 ? `${summary.edge_error_rate_worst3[0].error_rate_pct.toFixed(1)}%` : '0%'}
            description={summary.edge_error_rate_worst3.length > 0 ? `最高: ${summary.edge_error_rate_worst3[0].function_name}` : 'データなし'}
            status={getStatusColor(summary.edge_error_rate_worst3[0]?.error_rate_pct || 0, 'edge_error_rate')}
            icon="🔧"
            subItems={summary.edge_error_rate_worst3.slice(0, 3)}
          />

          {/* セキュリティインシデントカード */}
          <SummaryCard
            title="セキュリティインシデント"
            value={summary.security_incidents_count}
            description="今週のセキュリティ関連イベント"
            status={getStatusColor(summary.security_incidents_count, 'security_incidents')}
            icon="🔒"
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching summary data:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-medium">データ取得エラー</h3>
        <p className="text-red-600 text-sm mt-1">
          サマリーデータを取得できませんでした。しばらくしてから再試行してください。
        </p>
      </div>
    );
  }
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  description: string;
  status: 'success' | 'warning' | 'error';
  icon: string;
  subItems?: Array<{
    job_name?: string;
    function_name?: string;
    fail_rate_pct?: number;
    error_rate_pct?: number;
  }>;
}

function SummaryCard({ title, value, description, status, icon, subItems }: SummaryCardProps) {
  const statusClasses = {
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200'
  };

  const statusIndicatorClasses = {
    success: 'bg-green-400',
    warning: 'bg-yellow-400',
    error: 'bg-red-400'
  };

  return (
    <div className={`bg-white border rounded-lg p-6 ${statusClasses[status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{icon}</span>
          <div>
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <div className="flex items-center mt-1">
              <div className={`w-2 h-2 rounded-full mr-2 ${statusIndicatorClasses[status]}`}></div>
              <p className="text-xs text-gray-600">{description}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>

      {/* サブアイテム表示（TOP3の詳細） */}
      {subItems && subItems.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-gray-700 mb-2">詳細:</p>
          {subItems.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-xs">
              <span className="text-gray-600 truncate">
                {item.job_name || item.function_name || 'Unknown'}
              </span>
              <span className="font-medium ml-2">
                {(item.fail_rate_pct || item.error_rate_pct || 0).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * KPIの値に基づいてステータス色を決定
 */
function getStatusColor(value: number, type: 'rls_denied' | 'job_fail_rate' | 'edge_error_rate' | 'security_incidents'): 'success' | 'warning' | 'error' {
  switch (type) {
    case 'rls_denied':
      if (value >= 50) return 'error';
      if (value >= 10) return 'warning';
      return 'success';
      
    case 'job_fail_rate':
      if (value >= 15) return 'error';
      if (value >= 5) return 'warning';
      return 'success';
      
    case 'edge_error_rate':
      if (value >= 10) return 'error';
      if (value >= 2) return 'warning';
      return 'success';
      
    case 'security_incidents':
      if (value >= 5) return 'error';
      if (value >= 1) return 'warning';
      return 'success';
      
    default:
      return 'success';
  }
}