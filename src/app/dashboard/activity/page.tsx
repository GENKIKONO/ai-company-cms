'use client';

/**
 * Activity Page - 新アーキテクチャ版
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

const ClockIcon = () => (
  <svg className="w-12 h-12 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// =====================================================
// MAIN PAGE
// =====================================================

export default function ActivityPage() {
  return (
    <DashboardPageShell
      title="アクティビティ"
      requiredRole="viewer"
    >
      <ActivityContent />
    </DashboardPageShell>
  );
}

// =====================================================
// CONTENT
// =====================================================

function ActivityContent() {
  return (
    <>
      <DashboardPageHeader
        title="アクティビティログ"
        description="最近の活動履歴を確認"
        backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
      />

      <DashboardCard>
        <DashboardCardContent className="text-center py-12">
          <div className="mx-auto mb-4 flex justify-center">
            <ClockIcon />
          </div>
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
            アクティビティ追跡機能
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            このページでは組織の活動履歴を確認できます。<br />
            現在、アクティビティログ機能の実装を進めています。
          </p>

          <div className="max-w-md mx-auto">
            <DashboardAlert variant="info">
              <h4 className="text-sm font-medium text-[var(--status-info)] mb-2">計画中の機能</h4>
              <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                <li>• コンテンツの作成・編集履歴</li>
                <li>• 公開・非公開の切り替え履歴</li>
                <li>• ユーザーアクセス履歴</li>
                <li>• システム通知履歴</li>
              </ul>
            </DashboardAlert>
          </div>
        </DashboardCardContent>
      </DashboardCard>
    </>
  );
}
