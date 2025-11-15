'use client';

import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
// ToastProvider は root layout で提供されるため不要
// import { ToastProvider } from '@/components/ui/toast';
import { AccountStatusBanner } from '@/components/account/AccountStatusBanner';
import { AccountRestrictedMessage } from '@/components/account/AccountRestrictedMessage';
import type { AccountStatus } from '@/lib/auth/account-status-guard';

interface DashboardLayoutContentProps {
  children: React.ReactNode;
  accountStatus: AccountStatus;
}

export function DashboardLayoutContent({ children, accountStatus }: DashboardLayoutContentProps) {
  // frozen users see only restriction message
  if (accountStatus === 'frozen') {
    return <AccountRestrictedMessage status="frozen" />;
  }

  // active/warned/suspended users see normal dashboard
  return (
    <div className="min-h-screen bg-[var(--aio-page-bg, #f3f4f6)]">
      {/* デスクトップ用サイドバー */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <DashboardSidebar />
      </div>

      {/* メインコンテンツエリア */}
      <div className="lg:pl-64">
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
      </div>
    </div>
  );
}