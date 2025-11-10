'use client';

import { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { UnifiedMobileNav } from '@/components/navigation/UnifiedMobileNav';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // モバイルナビが開いているときはスクロールを無効化
  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

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
            <AppErrorBoundary>
              {children}
            </AppErrorBoundary>
          </div>
        </main>
      </div>

      {/* 統合モバイルナビゲーション */}
      <UnifiedMobileNav
        isOpen={isMobileNavOpen}
        onToggle={() => setIsMobileNavOpen(!isMobileNavOpen)}
      />
    </div>
  );
}