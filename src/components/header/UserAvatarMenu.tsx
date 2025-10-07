'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SignoutButton from '@/components/auth/SignoutButton';
import { User } from '@supabase/supabase-js';

interface UserAvatarMenuProps {
  user: User;
  hasOrganization: boolean;
}

export default function UserAvatarMenu({ user, hasOrganization }: UserAvatarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ユーザー名取得
  const userName = user?.user_metadata?.full_name || user?.email || 'ユーザー';
  const userInitials = userName.substring(0, 2).toUpperCase();

  // メニュー外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 bg-gray-600 text-white text-sm font-medium rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {userInitials}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            {/* User Info */}
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>

            {/* Menu Items - ✅ FIXED: Replaced emojis with accessible SVG icons */}
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              マイページ
            </Link>

            {hasOrganization ? (
              <Link
                href="/dashboard"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                企業管理
              </Link>
            ) : (
              <Link
                href="/organizations/new"
                className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                企業を作成
              </Link>
            )}

            <Link
              href="/dashboard/billing"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              サブスクリプション
            </Link>

            <div className="border-t border-gray-100 my-1"></div>

            {/* Signout - ✅ FIXED: Replaced emoji with accessible SVG icon */}
            <div className="px-4 py-2">
              <SignoutButton
                className="flex items-center w-full text-left text-sm text-red-600 hover:text-red-700 bg-transparent hover:bg-red-50 px-0 py-1 border-none"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                ログアウト
              </SignoutButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}