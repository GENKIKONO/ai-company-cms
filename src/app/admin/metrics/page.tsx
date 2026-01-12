/**
 * P3-8: Admin Metrics Dashboard
 * 監査・可観測性 KPI の定義 & ダッシュボード
 *
 * NOTE: [CORE_ARCHITECTURE] AdminPageShell 経由で統一管理
 * - 認証・site_admin権限チェックは Shell が担当
 * - UTC週単位の集計データを可視化
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import MetricsFilters from './components/MetricsFilters';
import MetricsSummaryCards from './components/MetricsSummaryCards';
import MetricsCharts from './components/MetricsCharts';
import { LoadingSpinner } from '@/components/ui/loading';

export const metadata: Metadata = {
  title: 'KPI Metrics Dashboard - AIOHub Admin',
  description: 'Weekly KPI metrics and observability dashboard for system monitoring',
};

interface MetricsPageProps {
  searchParams: Promise<{
    range?: '1w' | '4w' | '12w';
    orgId?: string;
  }>;
}

export default async function AdminMetricsPage({ searchParams }: MetricsPageProps) {
  const resolvedSearchParams = await searchParams;
  const range = resolvedSearchParams.range || '4w';
  const orgId = resolvedSearchParams.orgId;

  return (
    <AdminPageShell pageTitle="KPI Metrics Dashboard">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">KPI Metrics Dashboard</h1>
        <p className="text-[var(--color-text-secondary)] mt-2">
          Weekly operational metrics and observability KPIs (UTC timezone)
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <MetricsFilters defaultRange={range} defaultOrgId={orgId} />
      </div>

      {/* Summary Cards */}
      <div className="mb-8">
        <Suspense fallback={<LoadingSpinner />}>
          <MetricsSummaryCards range={range} orgId={orgId} />
        </Suspense>
      </div>

      {/* Charts */}
      <div className="mb-8">
        <Suspense fallback={<LoadingSpinner />}>
          <MetricsCharts range={range} orgId={orgId} />
        </Suspense>
      </div>

      {/* Footer Note */}
      <div className="mt-12 text-center text-sm text-[var(--color-text-tertiary)]">
        <p>All metrics are calculated in UTC timezone. Data updates weekly.</p>
        <p>For real-time alerts, refer to the <a href="/admin/console" className="text-[var(--aio-primary)] hover:underline">Admin Console</a>.</p>
      </div>
    </AdminPageShell>
  );
}