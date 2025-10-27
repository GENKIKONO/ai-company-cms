'use client';
import Link from 'next/link';
import MobileMenu from './MobileMenu';
import { useMemo, useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';

interface ClientAuthHeaderProps {
  initialUser?: User | null;
  initialHasOrganization?: boolean;
  initialIsAdmin?: boolean;
}

export default function ClientAuthHeader({ initialUser, initialHasOrganization, initialIsAdmin }: ClientAuthHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // クライアントサイドでのみレンダリング（ハイドレーション不整合回避）
  useEffect(() => {
    setMounted(true);
  }, []);

  // ドロップダウンの外側クリック・ESCキーで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [dropdownOpen]);

  const user = mounted ? initialUser : null;
  const hasOrganization = mounted ? initialHasOrganization : false;
  const isAuthenticated = mounted && !!user;
  const isAdmin = mounted ? initialIsAdmin : false;

  const links = useMemo(
    () => [
      { href: '/pricing', label: '料金プラン' },
      { href: '/organizations', label: '企業ディレクトリ' },
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
        <div className="flex justify-between items-center py-3 sm:py-4 lg:py-6">
          <div className="flex items-center">
            {/* ロゴは常に / に遷移 */}
            <Link 
              href="/" 
              className="focus-clean logo-no-select text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 hover:text-blue-600 min-h-[44px] flex items-center"
            >
              AIO Hub AI企業CMS
            </Link>
            
            {/* デスクトップナビゲーション */}
            <nav className="ml-6 sm:ml-8 lg:ml-10 hidden md:flex space-x-4 lg:space-x-6 xl:space-x-8">
              {links.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="nav-link text-gray-500 hover:text-gray-700 whitespace-nowrap min-h-[44px] flex items-center px-2 py-2 rounded-md transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {mounted && isAuthenticated ? (
              <>
                {/* デスクトップ: アバター + ドロップダウン */}
                <div className="hidden md:block relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="focus-clean flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    aria-label="ユーザーメニューを開く"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {(user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <svg 
                      className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* ドロップダウンメニュー */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        {/* ユーザー情報 */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.user_metadata?.full_name || 'ユーザー'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {user?.email}
                          </p>
                        </div>
                        
                        {/* メニュー項目 */}
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                          onClick={() => setDropdownOpen(false)}
                        >
                          マイページ
                        </Link>
                        <Link
                          href="/organizations"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                          onClick={() => setDropdownOpen(false)}
                        >
                          企業情報
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/management-console"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                            onClick={() => setDropdownOpen(false)}
                          >
                            管理コンソール
                          </Link>
                        )}
                        
                        {/* ログアウト */}
                        <div className="border-t border-gray-100">
                          <Link
                            href="/auth/signout"
                            className="block px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900 transition-colors duration-200"
                            onClick={() => setDropdownOpen(false)}
                          >
                            ログアウト
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* 未認証時のデスクトップリンク */}
                <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
                  <Link
                    href="/auth/login"
                    className="focus-clean bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-4 py-2 rounded-md text-sm font-medium min-h-[44px] flex items-center transition-colors duration-200 whitespace-nowrap"
                    aria-label="ログイン"
                  >
                    ログイン
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