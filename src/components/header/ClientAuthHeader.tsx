'use client';
import Link from 'next/link';
import MobileMenu from './MobileMenu';
import { useMemo, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

interface ClientAuthHeaderProps {
  initialUser?: User | null;
  initialHasOrganization?: boolean;
}

export default function ClientAuthHeader({ initialUser, initialHasOrganization }: ClientAuthHeaderProps) {
  const [mounted, setMounted] = useState(false);

  // クライアントサイドでのみレンダリング（ハイドレーション不整合回避）
  useEffect(() => {
    setMounted(true);
  }, []);

  const user = mounted ? initialUser : null;
  const hasOrganization = mounted ? initialHasOrganization : false;
  const isAuthenticated = mounted && !!user;

  const links = useMemo(
    () => [
      { href: '/aio', label: 'AIO Hubとは' },
      { href: '/pricing', label: '料金プラン' },
      { href: '/hearing-service', label: 'ヒアリング代行' },
    ],
    []
  );

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
            
            {/* デスクトップナビゲーション */}
            <nav className="ml-10 hidden md:flex space-x-6 lg:space-x-8">
              {links.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="text-gray-500 hover:text-gray-700 whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && (
                <Link 
                  href="/dashboard" 
                  className="text-gray-500 hover:text-gray-700 whitespace-nowrap"
                >
                  マイページ
                </Link>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {mounted && isAuthenticated ? (
              <>
                {/* デスクトップ: アイコン + メール表示 */}
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
                
                {/* デスクトップ: サインアウトリンク */}
                <div className="hidden md:block">
                  <Link
                    href="/auth/signout"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    ログアウト
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* 未認証時のデスクトップリンク */}
                <div className="hidden md:flex items-center space-x-4">
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
                </div>
              </>
            )}

            {/* モバイルメニュー */}
            <MobileMenu 
              links={links}
              auth={{ 
                loggedIn: isAuthenticated, 
                loginHref: '/auth/login', 
                logoutHref: '/auth/signout',
                dashboardHref: '/dashboard'
              }} 
            />
          </div>
        </div>
      </div>
    </header>
  );
}