// Server Component: 認証状態を毎回SSRで評価するヘッダー
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import SignOutButton from './SignOutButton';

interface AuthHeaderProps {
  currentPage?: 'dashboard' | 'billing';
  pathname?: string; // アクティブ判定強化のためのパス情報
}

export default async function AuthHeader({ currentPage, pathname }: AuthHeaderProps) {
  // サーバーサイドで認証状態を取得
  const supabase = await supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  const isAuthenticated = !error && !!user;

  // ✅ マイページ領域のアクティブ判定強化（組織編集も含む）
  const isMyPageActive = currentPage === 'dashboard' || 
    (pathname && (pathname.startsWith('/dashboard') || pathname.startsWith('/organizations')));

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="text-2xl font-bold text-gray-900 hover:text-blue-600"
            >
              AIO Hub AI企業CMS
            </Link>
            {isAuthenticated && (
              <nav className="ml-10 hidden md:flex space-x-8">
                <Link 
                  href="/dashboard" 
                  className={isMyPageActive ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}
                >
                  マイページ
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
                {/* PC表示: アイコン + メールアドレス + サインアウトボタン */}
                <div className="hidden md:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {(user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 truncate max-w-[120px]">
                    {user?.user_metadata?.full_name || user?.email}
                  </span>
                </div>
                <div className="hidden md:block">
                  <SignOutButton />
                </div>
                
                {/* モバイル表示: アバターメニュー */}
                <div className="md:hidden relative">
                  <details className="group">
                    <summary className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300">
                      <span className="text-sm font-medium text-gray-700">
                        {(user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </summary>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                          {user?.user_metadata?.full_name || user?.email}
                        </div>
                        <div className="px-4 py-2">
                          <SignOutButton />
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
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