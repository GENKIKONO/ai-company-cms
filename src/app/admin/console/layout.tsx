/**
 * AIOHub P3-1: Super Admin Console - Layout
 * 
 * Super Admin Console専用レイアウト
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s - Super Admin Console',
    default: 'Super Admin Console'
  },
  description: 'AIOHub Super Admin Console - System monitoring and administration',
  robots: 'noindex, nofollow', // 検索エンジンからの除外
};

export default function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Console Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Super Admin Console</h1>
                  <p className="text-xs text-gray-500">System Administration & Monitoring</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">System Online</span>
              </div>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center space-x-4">
                <a
                  href="/admin/console"
                  className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
                >
                  Dashboard
                </a>
                <a
                  href="/admin/console/alerts"
                  className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
                >
                  Alerts
                </a>
                <a
                  href="/admin/console/jobs"
                  className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
                >
                  Jobs
                </a>
                <a
                  href="/admin/console/health"
                  className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
                >
                  Health
                </a>
              </nav>

              {/* Back to Admin */}
              <a
                href="/admin"
                className="text-sm text-[var(--aio-primary)] hover:text-[var(--aio-primary)] font-medium"
              >
                ← Back to Admin
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Console Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Console Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>AIOHub Super Admin Console</span>
              <span>•</span>
              <span>P3-1 MVP</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Last Updated: {new Date().toLocaleString('ja-JP')}</span>
              <span>•</span>
              <span>VIEWs: admin_alerts_latest_v1, admin_jobs_recent_v1, admin_summary_today_v1</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}