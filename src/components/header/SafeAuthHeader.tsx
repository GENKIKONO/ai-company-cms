// 安全なAuthHeader - Server Component
import FallbackHeader from './FallbackHeader';
import Link from 'next/link';
import SignoutButton from '@/components/auth/SignoutButton';
import UserAvatarMenu from './UserAvatarMenu';
import SmoothScrollLink from '@/components/ui/SmoothScrollLink';

export default async function SafeAuthHeader() {
  try {
    // Supabaseクライアント作成を安全に実行
    const { supabaseServer } = await import('@/lib/supabase-server');
    const supabase = await supabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    const isAuthenticated = !error && !!user;
    
    // 企業の存在確認（認証済みの場合のみ）
    let hasOrganization = false;
    if (isAuthenticated) {
      try {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id')
          .eq('created_by', user!.id)
          .single();
        hasOrganization = !!orgData;
      } catch {
        // 企業確認エラーは無視（安全なデフォルト）
        hasOrganization = false;
      }
    }

    // CTAのリンク先決定
    const getCtaHref = () => {
      if (!isAuthenticated) return '/auth/login';
      return hasOrganization ? '/dashboard' : '/organizations/new';
    };

    const getCtaText = () => {
      if (!isAuthenticated) return '無料で始める';
      return hasOrganization ? 'マイページ' : '企業を作成';
    };

    return (
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              {/* ロゴは常に / に遷移 */}
              <Link 
                href="/" 
                className="text-2xl font-bold text-gray-900 hover:text-blue-600"
              >
                AIO Hub AI企業CMS
              </Link>
              
              {/* 全ユーザー向けナビゲーション表示 */}
              <nav className="ml-10 hidden md:flex space-x-6 lg:space-x-8">
                <Link 
                  href="/about" 
                  className="text-gray-500 hover:text-gray-700 whitespace-nowrap"
                >
                  サービス概要
                </Link>
                <Link 
                  href="/pricing" 
                  className="text-gray-500 hover:text-gray-700 whitespace-nowrap"
                >
                  料金プラン
                </Link>
                <Link 
                  href="/aio" 
                  className="text-gray-500 hover:text-gray-700 whitespace-nowrap"
                >
                  AIOとは
                </Link>
                <Link 
                  href="/hearing-service" 
                  className="text-gray-500 hover:text-gray-700 whitespace-nowrap"
                >
                  ヒアリング代行
                </Link>
                {isAuthenticated && (
                  <>
                    <Link 
                      href="/dashboard" 
                      className="text-gray-500 hover:text-gray-700 whitespace-nowrap"
                    >
                      マイページ
                    </Link>
                  </>
                )}
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {/* デスクトップ: メール表示、モバイル: 非表示 */}
                  <div className="hidden sm:block text-sm text-gray-700 max-w-[200px] truncate">
                    こんにちは、{user?.user_metadata?.full_name || user?.email}さん
                  </div>
                  
                  {/* モバイル: Avatarメニュー、デスクトップ: サインアウトボタン */}
                  <div className="sm:hidden">
                    <UserAvatarMenu 
                      user={user} 
                      hasOrganization={hasOrganization}
                    />
                  </div>
                  <div className="hidden sm:block">
                    <SignoutButton
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    />
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
                    href={getCtaHref()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {getCtaText()}
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