/* eslint-disable no-console */
/**
 * P3-8: Admin Metrics Dashboard
 * 監査・可観測性 KPI の定義 & ダッシュボード
 * 
 * Super Admin限定のKPIダッシュボード
 * UTC週単位の集計データを可視化
 */

import { Metadata } from 'next';
import { requireSuperAdminUser } from '@/lib/auth/server';
import { Suspense } from 'react';
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
  try {
    // Super Admin 認証
    await requireSuperAdminUser();

    const range = resolvedSearchParams.range || '4w';
    const orgId = resolvedSearchParams.orgId;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">KPI Metrics Dashboard</h1>
            <p className="text-gray-600 mt-2">
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
          <div className="mt-12 text-center text-sm text-gray-500">
            <p>All metrics are calculated in UTC timezone. Data updates weekly.</p>
            <p>For real-time alerts, refer to the <a href="/admin/console" className="text-[var(--aio-primary)] hover:underline">Admin Console</a>.</p>
          </div>
        </div>
      </div>
    );

  } catch (error) {
    console.error('Admin metrics page error:', error);
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Super admin privileges required to view KPI metrics.</p>
        </div>
      </div>
    );
  }
}