'use client';

/**
 * DashboardLayoutContent - ダッシュボードのレイアウトコンテンツ
 *
 * MobileDrawerLayoutを使用してモバイルナビゲーションを提供。
 * @see docs/architecture/boundaries.md
 */

import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import { AccountStatusBanner } from '@/components/account/AccountStatusBanner';
import { AccountRestrictedMessage } from '@/components/account/AccountRestrictedMessage';
import { MobileDrawerLayout } from '@/components/navigation/MobileDrawerLayout';
import type { AccountStatus } from '@/lib/auth/account-status-guard';

interface DashboardLayoutContentProps {
  children: React.ReactNode;
  accountStatus: AccountStatus;
  canSeeAdminNav?: boolean;
}

export function DashboardLayoutContent({ children, accountStatus, canSeeAdminNav = false }: DashboardLayoutContentProps) {
  // frozen users see only restriction message
  if (accountStatus === 'frozen') {
    return <AccountRestrictedMessage status="frozen" />;
  }

  // active/warned/suspended users see normal dashboard
  return (
    <MobileDrawerLayout
      drawerTitle="メニュー"
      drawerContent={<DashboardSidebar canSeeAdminNav={canSeeAdminNav} />}
      mobileHeaderTitle="AIO Hub"
      desktopSidebar={<DashboardSidebar canSeeAdminNav={canSeeAdminNav} />}
      mainClassName="lg:pl-64 min-h-screen pt-14 lg:pt-0"
    >
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Account status banner for warned/suspended users */}
          {(accountStatus === 'warned' || accountStatus === 'suspended') && (
            <AccountStatusBanner status={accountStatus} />
          )}

          <AppErrorBoundary>
            {children}
          </AppErrorBoundary>
        </div>
      </main>
    </MobileDrawerLayout>
  );
}
