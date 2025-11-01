'use client';

import { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { MobileDashboardNav } from '@/components/dashboard/MobileDashboardNav';

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
    <div className="min-h-screen bg-gray-50">
      {/* デスクトップ用サイドバー */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <DashboardSidebar />
      </div>

      {/* メインコンテンツエリア */}
      <div className="lg:pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* モバイル用ナビゲーション */}
      <MobileDashboardNav
        isOpen={isMobileNavOpen}
        onToggle={() => setIsMobileNavOpen(!isMobileNavOpen)}
      />
    </div>
  );
}