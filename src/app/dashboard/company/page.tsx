'use client';

/**
 * Company Management Page - 新アーキテクチャ版
 */

import {
  DashboardPageShell,
  useDashboardPageContext,
} from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardCard,
  DashboardCardHeader,
  DashboardCardContent,
  DashboardEmptyState,
  DashboardLoadingCard,
  DashboardAlert,
} from '@/components/dashboard/ui';

// =====================================================
// ICONS
// =====================================================

const BuildingIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

// =====================================================
// MAIN PAGE
// =====================================================

export default function CompanyManagementPage() {
  return (
    <DashboardPageShell
      title="企業情報管理"
      requiredRole="viewer"
      loadingSkeleton={<CompanyLoadingSkeleton />}
    >
      <CompanyContent />
    </DashboardPageShell>
  );
}

// =====================================================
// CONTENT
// =====================================================

function CompanyContent() {
  const { organization } = useDashboardPageContext();

  return (
    <>
      <DashboardPageHeader
        title="企業情報管理"
        description="企業情報を編集・管理します"
        backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
      />

      <DashboardCard>
        <DashboardCardHeader>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">企業情報</h2>
        </DashboardCardHeader>
        <DashboardCardContent>
          {organization ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">組織名</label>
                <p className="text-sm text-[var(--color-text-primary)] mt-1">{organization.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">プラン</label>
                <p className="text-sm text-[var(--color-text-primary)] mt-1">{organization.plan || 'trial'}</p>
              </div>
              <DashboardAlert variant="info" className="mt-6">
                企業情報の詳細編集機能は今後実装予定です。現在は基本情報のみ表示しています。
              </DashboardAlert>
            </div>
          ) : (
            <DashboardEmptyState
              icon={<BuildingIcon />}
              title="企業情報が見つかりません"
              description="組織への参加が必要です。"
            />
          )}
        </DashboardCardContent>
      </DashboardCard>
    </>
  );
}

// =====================================================
// LOADING SKELETON
// =====================================================

function CompanyLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <DashboardLoadingCard lines={3} showHeader />
    </div>
  );
}
