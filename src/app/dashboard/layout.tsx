'use client';

import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import { ToastProvider } from '@/components/ui/toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--aio-page-bg, #f3f4f6)]">
        {/* デスクトップ用サイドバー */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <DashboardSidebar />
        </div>

        {/* メインコンテンツエリア */}
        <div className="lg:pl-64">
          <main className="py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <AppErrorBoundary>
                {children}
              </AppErrorBoundary>
            </div>
          </main>
        </div>

      </div>
    </ToastProvider>
  );
}