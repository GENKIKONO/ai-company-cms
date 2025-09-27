// Server Component: 認証状態を毎回SSRで評価するヘッダー
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import SignOutButton from './SignOutButton';

interface AuthHeaderProps {
  currentPage?: 'dashboard' | 'billing';
}

export default async function AuthHeader({ currentPage }: AuthHeaderProps) {
  // サーバーサイドで認証状態を取得
  const supabase = await supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  const isAuthenticated = !error && !!user;

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link 
              href={isAuthenticated ? "/dashboard" : "/auth/signin"} 
              className="text-2xl font-bold text-gray-900 hover:text-blue-600"
            >
              AIO Hub AI企業CMS
            </Link>
            {isAuthenticated && (
              <nav className="ml-10 hidden md:flex space-x-8">
                <Link 
                  href="/dashboard" 
                  className={currentPage === 'dashboard' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}
                >
                  ダッシュボード
                </Link>
                <Link 
                  href="/dashboard/billing" 
                  className={currentPage === 'billing' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}
                >
                  サブスクリプション
                </Link>
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="text-sm text-gray-700">
                  こんにちは、{user?.user_metadata?.full_name || user?.email}さん
                </div>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  ログイン
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  新規登録
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}