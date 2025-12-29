'use client';

/**
 * Settings Page - 新アーキテクチャ版
 */

import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { GhostwriterInput } from '@/components/cms/GhostwriterInput';
import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm';
import {
  DashboardPageShell,
  useDashboardPageContext,
} from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardCard,
  DashboardCardHeader,
  DashboardCardContent,
  DashboardLoadingCard,
  DashboardAlert,
} from '@/components/dashboard/ui';

// =====================================================
// ICONS
// =====================================================

const InfoIcon = () => (
  <svg className="h-5 w-5 text-[var(--status-info)]" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

// =====================================================
// MAIN PAGE
// =====================================================

export default function SettingsPage() {
  return (
    <DashboardPageShell
      title="設定"
      requiredRole="viewer"
      loadingSkeleton={<SettingsLoadingSkeleton />}
    >
      <SettingsContent />
    </DashboardPageShell>
  );
}

// =====================================================
// CONTENT
// =====================================================

function SettingsContent() {
  const { organizationId, organization } = useDashboardPageContext();

  return (
    <>
      <DashboardPageHeader
        title="設定"
        description="アカウント設定とセキュリティ設定を管理"
        backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
      />

      <div className="space-y-8">
        {/* サイト設定管理 */}
        <div>
          <h2 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">
            サイト設定管理
          </h2>
          <SiteSettingsForm organizationId={organizationId || ''} />
        </div>

        {/* AI Ghostwriter */}
        <div>
          <h2 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">
            AI企業情報自動生成
          </h2>
          <GhostwriterInput
            organizationId={organizationId || ''}
            organizationSlug={organization?.slug || ''}
          />
        </div>

        {/* セキュリティ設定 */}
        <div>
          <h2 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">
            セキュリティ設定
          </h2>
          <ChangePasswordForm />
        </div>

        {/* 今後実装予定の機能 */}
        <DashboardCard>
          <DashboardCardHeader>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
              今後実装予定の機能
            </h3>
          </DashboardCardHeader>
          <DashboardCardContent>
            <DashboardAlert variant="info">
              <div className="flex">
                <div className="flex-shrink-0">
                  <InfoIcon />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-[var(--status-info)]">開発中の機能</h4>
                  <div className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    <ul className="list-disc list-inside space-y-1">
                      <li>プロフィール設定</li>
                      <li>企業情報設定</li>
                      <li>通知設定</li>
                      <li>二要素認証設定</li>
                    </ul>
                  </div>
                </div>
              </div>
            </DashboardAlert>
          </DashboardCardContent>
        </DashboardCard>
      </div>
    </>
  );
}

// =====================================================
// LOADING SKELETON
// =====================================================

function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <DashboardLoadingCard lines={4} showHeader />
      <DashboardLoadingCard lines={3} showHeader />
      <DashboardLoadingCard lines={2} showHeader />
    </div>
  );
}
