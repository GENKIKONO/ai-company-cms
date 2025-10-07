/**
 * 管理者レイアウト
 * 管理者権限チェックと共通レイアウト
 */

import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await supabaseServer();
  
  // 認証チェック
  const { data: authData, error: authError } = await supabase.auth.getUser();
  
  if (authError || !authData.user) {
    redirect('/auth/login?redirect=/admin');
  }

  // 管理者権限チェック
  const userRole = authData.user.user_metadata?.role;
  if (userRole !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 管理者ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">LuxuCare CMS 管理者</h1>
              <span className="ml-3 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                Admin
              </span>
            </div>
            <nav className="flex space-x-4">
              <a href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm">
                ダッシュボード
              </a>
              <a href="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm">
                ユーザー画面
              </a>
              <a href="/auth/signout" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm">
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