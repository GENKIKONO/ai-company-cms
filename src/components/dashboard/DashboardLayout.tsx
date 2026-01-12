/**
 * Dashboard Layout Component
 * AI × SEO ダッシュボード共通レイアウト
 */

'use client';

import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] text-[var(--color-text-primary)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--dashboard-card-border)] px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
                AIO Hub Dashboard
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                AI × SEO 統合分析プラットフォーム
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* User info placeholder */}
              <div className="text-sm text-[var(--color-text-secondary)]">
                ダッシュボード
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[var(--dashboard-card-border)] mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-[var(--color-text-tertiary)]">
            © 2024 LuxuCare株式会社. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}