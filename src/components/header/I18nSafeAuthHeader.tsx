'use client';

import { useI18n } from '@/components/layout/I18nProvider';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

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

  // 認証状態はサーバーから渡されたものを信頼
  useEffect(() => {
    setActualAuthState(isAuthenticated);
    setAuthStateChecked(true);
  }, [isAuthenticated]);

  // 認証状態チェック前は何も表示しない（フラッシュ防止）
  if (!authStateChecked) {
    return null;
  }

  // 実際の認証状態を使用
  const effectiveAuthState = actualAuthState;

  const getCtaHref = () => {
    if (!effectiveAuthState) return '/auth/login';
    return hasOrganization ? ROUTES.dashboard : '/organizations/new';
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
              className="text-2xl font-bold text-slate-900 hover:text-[var(--aio-primary)] transition-colors"
            >
              {t('ui.header.title')}
            </Link>
            
            {effectiveAuthState && (
              <nav className="ml-10 hidden md:flex space-x-8">
                <button
                  onClick={() => window.location.href = ROUTES.dashboard}
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {t('ui.header.dashboard')}
                </button>
                <Link
                  href={ROUTES.dashboardBilling}
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
                  className="bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
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