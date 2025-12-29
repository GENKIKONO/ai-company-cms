'use client';

/**
 * Analytics Page - 新アーキテクチャ版（準備中）
 */

import {
  DashboardPageShell,
} from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardCard,
  DashboardCardContent,
  DashboardAlert,
} from '@/components/dashboard/ui';

// =====================================================
// ICONS
// =====================================================

const BarChartIcon = () => (
  <svg className="w-8 h-8 text-[var(--aio-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

// =====================================================
// MAIN PAGE
// =====================================================

export default function AnalyticsPage() {
  return (
    <DashboardPageShell
      title="アナリティクス"
      requiredRole="viewer"
    >
      <AnalyticsContent />
    </DashboardPageShell>
  );
}

// =====================================================
// CONTENT
// =====================================================

function AnalyticsContent() {
  return (
    <>
      <DashboardPageHeader
        title="アナリティクス"
        description="アクセス解析・パフォーマンス分析"
        backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
      />

      <DashboardCard>
        <DashboardCardContent className="text-center py-12">
          <div className="w-16 h-16 bg-[var(--status-info-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChartIcon />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            アナリティクス
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] mb-6">
            この機能は現在準備中です
          </p>

          <div className="max-w-md mx-auto">
            <p className="text-[var(--color-text-secondary)] mb-6">
              アクセス解析・パフォーマンス分析機能を開発中です。
              近日中にリリース予定です。
            </p>

            <DashboardAlert variant="info">
              <h3 className="text-sm font-medium text-[var(--status-info)] mb-2">予定機能</h3>
              <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                <li>• ページビュー統計</li>
                <li>• ユーザー行動分析</li>
                <li>• 検索キーワード分析</li>
                <li>• パフォーマンス指標</li>
              </ul>
            </DashboardAlert>
          </div>
        </DashboardCardContent>
      </DashboardCard>
    </>
  );
}
