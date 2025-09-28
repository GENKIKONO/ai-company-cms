'use client';

import { useI18n } from '@/components/layout/I18nProvider';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

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

  const getCtaHref = () => {
    if (!isAuthenticated) return '/auth/login';
    return hasOrganization ? '/dashboard' : '/organizations/new';
  };

  const getCtaText = () => {
    if (!isAuthenticated) return t('ui.header.getStarted');
    return hasOrganization ? t('ui.header.dashboard') : t('ui.header.createOrganization');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="text-2xl font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {t('ui.header.title')}
            </Link>
            
            {isAuthenticated && (
              <nav className="ml-10 hidden md:flex space-x-8">
                <Link 
                  href="/dashboard" 
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {t('ui.header.dashboard')}
                </Link>
                <Link 
                  href="/dashboard/billing" 
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {t('ui.header.subscription')}
                </Link>
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            
            {isAuthenticated ? (
              <>
                <div className="hidden sm:block text-sm text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                  {t('ui.header.greeting', { 
                    name: user?.user_metadata?.full_name || user?.email || t('ui.common.user')
                  })}
                </div>
                
                <Link
                  href="/auth/signout"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
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