'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardPageShell } from '@/components/dashboard';

interface MetricsSummary {
  rls_denied_count: number;
  job_fail_rate_top3: Array<{
    job_name: string;
    failed_count: number;
    total_runs: number;
    fail_rate_pct: number;
  }>;
  edge_error_rate_worst3: Array<{
    function_name: string;
    failed_count: number;
    total_runs: number;
    error_rate_pct: number;
  }>;
  security_incidents_count: number;
}

interface WeeklyData {
  week_start_utc: string;
  [key: string]: unknown;
}

interface AlertEvent {
  event_type: string;
  event_count: number;
}

interface MetricsCharts {
  rls_denied_weekly: WeeklyData[];
  job_fail_rate_weekly_by_job: WeeklyData[];
  edge_error_rate_latest_week: Array<{
    function_name: string;
    error_rate_pct: number;
  }>;
  alert_events_current_week: AlertEvent[];
  security_incidents_weekly_by_type_and_risk: WeeklyData[];
}

interface MetricsResponse {
  success: boolean;
  data: {
    summary: MetricsSummary;
    charts: MetricsCharts;
  };
  metadata: {
    range: string;
    generated_at: string;
  };
}

// Thresholds (can be configured via env or DB)
const THRESHOLDS = {
  error_rate_pct: 5, // Red if > 5%
  job_fail_rate_pct: 10, // Red if > 10%
  rls_denied_count: 5, // Red if > 5 per week
  security_incidents: 0, // Red if > 0
  auth_failures: 10, // Red if > 10 per week
};

export default function AlertsDashboardPage() {
  return (
    <DashboardPageShell title="アラート" requiredRole="admin">
      <AlertsContent />
    </DashboardPageShell>
  );
}

function AlertsContent() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<'1w' | '4w' | '12w'>('4w');

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/metrics?range=${range}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to fetch metrics');
        }
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, [range]);

  const getStatusColor = (value: number, threshold: number, reverse = false) => {
    if (reverse) {
      return value < threshold ? 'text-[var(--aio-danger)] bg-[var(--aio-danger-muted)] border-[var(--aio-danger)]' : 'text-[var(--aio-success)] bg-[var(--aio-success-muted)] border-[var(--aio-success)]';
    }
    return value > threshold ? 'text-[var(--aio-danger)] bg-[var(--aio-danger-muted)] border-[var(--aio-danger)]' : 'text-[var(--aio-success)] bg-[var(--aio-success-muted)] border-[var(--aio-success)]';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/dashboard" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
                ダッシュボード
              </Link>
            </li>
            <li><span className="text-[var(--color-text-tertiary)]">/</span></li>
            <li>
              <Link href="/dashboard/manage" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
                管理
              </Link>
            </li>
            <li><span className="text-[var(--color-text-tertiary)]">/</span></li>
            <li className="text-[var(--color-text-primary)] font-medium">アラート</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-sm border border-[var(--dashboard-card-border)]">
          <div className="px-6 py-4 border-b border-[var(--dashboard-card-border)] flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">アラートダッシュボード</h1>
              <p className="text-sm text-[var(--color-text-tertiary)] mt-1">システム指標の監視とアラート</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value as '1w' | '4w' | '12w')}
                className="px-3 py-2 border border-[var(--input-border)] rounded-md text-sm focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
              >
                <option value="1w">過去1週間</option>
                <option value="4w">過去4週間</option>
                <option value="12w">過去12週間</option>
              </select>
            </div>
          </div>

          <div className="p-6" data-testid="alerts-list">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-[var(--aio-primary)] border-t-transparent rounded-full mx-auto"></div>
                <p className="text-[var(--color-text-tertiary)] mt-4">読み込み中...</p>
              </div>
            ) : error ? (
              <div className="bg-[var(--aio-danger-muted)] border border-[var(--aio-danger)] rounded-md p-4">
                <p className="text-[var(--aio-danger)]">{error}</p>
              </div>
            ) : metrics?.data ? (
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* RLS Denied */}
                  <div className={`rounded-lg p-4 border ${getStatusColor(metrics.data.summary.rls_denied_count, THRESHOLDS.rls_denied_count)}`}>
                    <div className="text-sm font-medium opacity-80">RLS拒否数</div>
                    <div className="mt-1 text-3xl font-bold">
                      {metrics.data.summary.rls_denied_count}
                    </div>
                    <div className="mt-1 text-xs opacity-60">
                      閾値: {THRESHOLDS.rls_denied_count}件/週
                    </div>
                  </div>

                  {/* Security Incidents */}
                  <div className={`rounded-lg p-4 border ${getStatusColor(metrics.data.summary.security_incidents_count, THRESHOLDS.security_incidents)}`}>
                    <div className="text-sm font-medium opacity-80">セキュリティインシデント</div>
                    <div className="mt-1 text-3xl font-bold">
                      {metrics.data.summary.security_incidents_count}
                    </div>
                    <div className="mt-1 text-xs opacity-60">
                      閾値: {THRESHOLDS.security_incidents}件
                    </div>
                  </div>

                  {/* Top Job Fail Rate */}
                  {metrics.data.summary.job_fail_rate_top3[0] && (
                    <div className={`rounded-lg p-4 border ${getStatusColor(metrics.data.summary.job_fail_rate_top3[0].fail_rate_pct, THRESHOLDS.job_fail_rate_pct)}`}>
                      <div className="text-sm font-medium opacity-80">ジョブ失敗率（最大）</div>
                      <div className="mt-1 text-3xl font-bold">
                        {metrics.data.summary.job_fail_rate_top3[0].fail_rate_pct.toFixed(1)}%
                      </div>
                      <div className="mt-1 text-xs opacity-60 truncate">
                        {metrics.data.summary.job_fail_rate_top3[0].job_name}
                      </div>
                    </div>
                  )}

                  {/* Top Edge Error Rate */}
                  {metrics.data.summary.edge_error_rate_worst3[0] && (
                    <div className={`rounded-lg p-4 border ${getStatusColor(metrics.data.summary.edge_error_rate_worst3[0].error_rate_pct, THRESHOLDS.error_rate_pct)}`}>
                      <div className="text-sm font-medium opacity-80">Edge関数エラー率（最大）</div>
                      <div className="mt-1 text-3xl font-bold">
                        {metrics.data.summary.edge_error_rate_worst3[0].error_rate_pct.toFixed(1)}%
                      </div>
                      <div className="mt-1 text-xs opacity-60 truncate">
                        {metrics.data.summary.edge_error_rate_worst3[0].function_name}
                      </div>
                    </div>
                  )}
                </div>

                {/* Alert Events */}
                {metrics.data.charts.alert_events_current_week.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">今週のアラートイベント</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {metrics.data.charts.alert_events_current_week.map((event) => (
                        <div
                          key={event.event_type}
                          className={`rounded-lg p-3 border ${
                            event.event_count > 0
                              ? 'bg-[var(--aio-warning-muted)] border-[var(--aio-warning)] text-[var(--aio-warning)]'
                              : 'bg-[var(--aio-surface)] border-[var(--dashboard-card-border)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          <div className="text-xs font-medium truncate" title={event.event_type}>
                            {event.event_type.replace(/_/g, ' ')}
                          </div>
                          <div className="mt-1 text-xl font-bold">{event.event_count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job Fail Rate Table */}
                <div>
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">ジョブ失敗率 Top 3</h3>
                  <table className="min-w-full divide-y divide-[var(--dashboard-card-border)]">
                    <thead className="bg-[var(--aio-surface)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">ジョブ名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">失敗数</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">総実行数</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">失敗率</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[var(--dashboard-card-border)]">
                      {metrics.data.summary.job_fail_rate_top3.map((job, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-4 text-sm font-mono text-[var(--color-text-primary)]">
                            {job.job_name}
                          </td>
                          <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
                            {job.failed_count}
                          </td>
                          <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)]">
                            {job.total_runs}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                job.fail_rate_pct > THRESHOLDS.job_fail_rate_pct
                                  ? 'bg-[var(--aio-danger-muted)] text-[var(--aio-danger)]'
                                  : 'bg-[var(--aio-success-muted)] text-[var(--aio-success)]'
                              }`}
                            >
                              {job.fail_rate_pct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Edge Error Rate Table */}
                <div>
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">Edge関数エラー率 Worst 3</h3>
                  <table className="min-w-full divide-y divide-[var(--dashboard-card-border)]">
                    <thead className="bg-[var(--aio-surface)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">関数名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">エラー数</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">総実行数</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">エラー率</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[var(--dashboard-card-border)]">
                      {metrics.data.summary.edge_error_rate_worst3.map((func, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-4 text-sm font-mono text-[var(--color-text-primary)]">
                            {func.function_name}
                          </td>
                          <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
                            {func.failed_count}
                          </td>
                          <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)]">
                            {func.total_runs}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                func.error_rate_pct > THRESHOLDS.error_rate_pct
                                  ? 'bg-[var(--aio-danger-muted)] text-[var(--aio-danger)]'
                                  : 'bg-[var(--aio-success-muted)] text-[var(--aio-success)]'
                              }`}
                            >
                              {func.error_rate_pct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Weekly Trend - Simple Text-based Chart */}
                <div>
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">RLS拒否数 週次推移</h3>
                  <div className="bg-[var(--aio-surface)] rounded-lg p-4 border border-[var(--dashboard-card-border)]">
                    <div className="flex items-end gap-2 h-32">
                      {metrics.data.charts.rls_denied_weekly.map((week, idx) => {
                        const maxCount = Math.max(...metrics.data.charts.rls_denied_weekly.map(w => (w as { rls_denied_count?: number }).rls_denied_count ?? 0), 1);
                        const count = (week as { rls_denied_count?: number }).rls_denied_count ?? 0;
                        const heightPct = (count / maxCount) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center">
                            <div
                              className={`w-full rounded-t ${count > THRESHOLDS.rls_denied_count ? 'bg-[var(--aio-danger)]' : 'bg-[var(--aio-primary)]'}`}
                              style={{ height: `${Math.max(heightPct, 5)}%` }}
                            />
                            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">{formatDate(week.week_start_utc)}</div>
                            <div className="text-xs font-medium">{count}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="text-xs text-[var(--color-icon-muted)] text-right">
                  最終更新: {metrics.metadata.generated_at ? new Date(metrics.metadata.generated_at).toLocaleString('ja-JP') : '-'}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[var(--color-text-tertiary)]">
                データがありません
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
