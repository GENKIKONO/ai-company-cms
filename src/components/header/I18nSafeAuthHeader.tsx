'use client';

import { useI18n } from '@/components/layout/I18nProvider';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-client';
import { auth } from '@/lib/auth';

interface I18nSafeAuthHeaderProps {
  user?: User | null;
  hasOrganization?: boolean;
  isAuthenticated: boolean;
}

export default function I18nSafeAuthHeader({ 
  user, 
  hasOrganization = false, 
  isAuthenticated 
}: I18nSafeAuthHeaderProps) {
  const { t } = useI18n();
  const [actualAuthState, setActualAuthState] = useState<boolean>(isAuthenticated);
  const [authStateChecked, setAuthStateChecked] = useState(false);

  // 認証状態の整合性チェック
  useEffect(() => {
    let mounted = true;
    
    const checkAuthState = async () => {
      try {
        console.log('[I18nSafeAuthHeader] Checking auth state...');
        
        // クライアント側の実際の認証状態を確認
        const { data: { user: currentUser } } = await supabaseBrowser.auth.getUser();
        const actuallyAuthenticated = !!currentUser;
        
        console.log('[I18nSafeAuthHeader] Auth state check:', {
          propsIsAuthenticated: isAuthenticated,
          actuallyAuthenticated,
          hasUser: !!currentUser,
          propsUser: !!user
        });
        
        if (mounted) {
          setActualAuthState(actuallyAuthenticated);
          setAuthStateChecked(true);
          
          // 不整合検出時の自動修正
          if (isAuthenticated && !actuallyAuthenticated) {
            console.warn('[I18nSafeAuthHeader] Auth state mismatch detected - forcing full logout');
            try {
              // 認証Cookieも明示的にクリア
              document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
              });
              
              await auth.signOut();
              
              // ローカルストレージもクリア
              localStorage.clear();
              sessionStorage.clear();
              
              // 少し待機してからリダイレクト
              setTimeout(() => {
                window.location.href = '/';
              }, 100);
            } catch (error) {
              console.error('[I18nSafeAuthHeader] Auto logout failed:', error);
              
              // 強制的にCookieクリア + リロード
              document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
              });
              
              setTimeout(() => {
                window.location.reload();
              }, 100);
            }
          }
        }
      } catch (error) {
        console.error('[I18nSafeAuthHeader] Auth state check failed:', error);
        if (mounted) {
          setActualAuthState(false);
          setAuthStateChecked(true);
        }
      }
    };
    
    // 初回チェック
    checkAuthState();
    
    // 認証状態変更のリスナー
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((event, session) => {
      console.log('[I18nSafeAuthHeader] Auth state changed:', event, !!session);
      if (mounted) {
        setActualAuthState(!!session);
      }
    });
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isAuthenticated, user]);

  // 認証状態チェック前は何も表示しない（フラッシュ防止）
  if (!authStateChecked) {
    return null;
  }

  // 実際の認証状態を使用
  const effectiveAuthState = actualAuthState;

  const getCtaHref = () => {
    if (!effectiveAuthState) return '/auth/login';
    return hasOrganization ? '/dashboard' : '/organizations/new';
  };

  const getCtaText = () => {
    if (!effectiveAuthState) return t('ui.header.getStarted');
    return hasOrganization ? t('ui.header.dashboard') : t('ui.header.createOrganization');
  };

  return (
    <header className="bg-white shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="text-2xl font-bold text-slate-900 hover:text-blue-600 transition-colors"
            >
              {t('ui.header.title')}
            </Link>
            
            {effectiveAuthState && (
              <nav className="ml-10 hidden md:flex space-x-8">
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {t('ui.header.dashboard')}
                </button>
                <Link 
                  href="/dashboard/billing" 
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {t('ui.header.subscription')}
                </Link>
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {effectiveAuthState ? (
              <>
                <div 
                  className="hidden sm:block text-sm text-slate-700 max-w-[200px] truncate"
                  data-testid="user-menu"
                >
                  {t('ui.header.greeting', { 
                    name: user?.user_metadata?.full_name || user?.email || t('ui.common.user')
                  })}
                </div>
                
                <Link
                  href="/auth/signout"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  data-testid="logout-button"
                >
                  {t('ui.header.signOut')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {t('ui.header.login')}
                </Link>
                <Link
                  href={getCtaHref()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
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
}