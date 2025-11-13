/**
 * 管理者レイアウト
 * 管理者権限チェックと共通レイアウト
 */

import { redirect } from 'next/navigation';
import { getServerUser, isAdmin } from '@/lib/auth/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 認証と管理者権限の統合チェック
  const user = await getServerUser();
  
  if (!user) {
    redirect('/auth/login?redirect=/management-console');
  }
  
  if (!isAdmin(user)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 管理者ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">AIO Hub 管理コンソール</h1>
              <span className="ml-3 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                Admin
              </span>
            </div>
            <nav className="flex space-x-2">
              <a href="/management-console" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm">
                ダッシュボード
              </a>
              <a href="/management-console/settings" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm">
                設定
              </a>
              <a href="/management-console/reports" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm">
                通報
              </a>
              <a href="/management-console/hearings" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm">
                ヒアリング
              </a>
              <a href="/management-console/users" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm">
                ユーザー管理
              </a>
              <a href="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm">
                ユーザー画面
              </a>
              <a href="/auth/signout" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm">
                ログアウト
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main>
        {children}
      </main>
    </div>
  );
}