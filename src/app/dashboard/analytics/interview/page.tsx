'use client';

/**
 * P2-7: AIインタビューアナリティクス ページ
 * DashboardPageShell統合版
 */

import { useSearchParams } from 'next/navigation';
import { DashboardPageShell, useDashboardPageContext } from '@/components/dashboard';
import { DashboardLoadingState } from '@/components/dashboard/ui';
import InterviewAnalyticsDashboard from './InterviewAnalyticsDashboard';
import type { InterviewAnalyticsPeriod } from '@/types/interview-analytics';

/**
 * ページコンポーネント
 */
export default function InterviewAnalyticsPage() {
  return (
    <DashboardPageShell
      title="AIインタビューアナリティクス"
      requiredRole="viewer"
      loadingSkeleton={<InterviewAnalyticsLoadingSkeleton />}
    >
      <InterviewAnalyticsContent />
    </DashboardPageShell>
  );
}

/**
 * コンテンツラッパー - contextからorgIdを取得
 */
function InterviewAnalyticsContent() {
  const { organizationId, isLoading } = useDashboardPageContext();
  const searchParams = useSearchParams();
  const period = (searchParams.get('period') || '30d') as InterviewAnalyticsPeriod;

  if (isLoading || !organizationId) {
    return <InterviewAnalyticsLoadingSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="hig-text-h1 hig-jp-heading">AIインタビューアナリティクス</h1>
            <p className="hig-text-body text-[var(--color-text-secondary)] mt-2">
              組織のAIインタビュー活動状況を分析・可視化
            </p>
          </div>
        </div>
      </div>

      {/* ダッシュボード */}
      <InterviewAnalyticsDashboard
        orgId={organizationId}
        initialPeriod={period}
        initialData={null}
        serverError={null}
      />
    </div>
  );
}

/**
 * ローディングスケルトン
 */
function InterviewAnalyticsLoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-[var(--dashboard-card-border)] rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-[var(--dashboard-card-border)] rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-[var(--dashboard-card-border)] rounded-lg"></div>
        <div className="h-64 bg-[var(--dashboard-card-border)] rounded-lg"></div>
      </div>
    </div>
  );
}
