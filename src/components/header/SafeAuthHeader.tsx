// 安全なAuthHeader - Server Component
import FallbackHeader from './FallbackHeader';
import Link from 'next/link';

export default async function SafeAuthHeader() {
  try {
    // Supabaseクライアント作成を安全に実行
    const { supabaseServer } = await import('@/lib/supabase-server');
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
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ダッシュボード
                  </Link>
                  <Link 
                    href="/dashboard/billing" 
                    className="text-gray-500 hover:text-gray-700"
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
                  <Link
                    href="/auth/signout"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    ログアウト
                  </Link>
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
  } catch (e) {
    console.error('[SafeAuthHeader] AuthHeader render failed:', e);
    return <FallbackHeader />;
  }
}