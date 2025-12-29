/**
 * 監視ダッシュボード レイアウト
 * 要件定義準拠: 管理者専用アクセス
 *
 * @see docs/architecture/boundaries.md
 */

export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { isSiteAdmin, getUserServerOptional } from '@/lib/core/auth-state';

interface MonitoringLayoutProps {
  children: React.ReactNode;
}

export default async function MonitoringLayout({ children }: MonitoringLayoutProps) {
  // 認証・管理者権限を正本(isSiteAdmin)で確認
  const [isAdmin, user] = await Promise.all([
    isSiteAdmin(),
    getUserServerOptional(),
  ]);

  if (!user || !isAdmin) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                システム監視
              </h1>
              <p className="text-sm text-gray-600">
                管理者専用ダッシュボード
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
              <div className="h-2 w-2 bg-green-500 rounded-full" title="オンライン" />
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}