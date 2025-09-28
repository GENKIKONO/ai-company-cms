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
        className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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

            {/* Menu Items */}
            <Link
              href="/dashboard"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              📊 ダッシュボード
            </Link>

            {hasOrganization ? (
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                🏢 企業管理
              </Link>
            ) : (
              <Link
                href="/organizations/new"
                className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                onClick={() => setIsOpen(false)}
              >
                ➕ 企業を作成
              </Link>
            )}

            <Link
              href="/dashboard/billing"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              💳 サブスクリプション
            </Link>

            <div className="border-t border-gray-100 my-1"></div>

            {/* Signout */}
            <div className="px-4 py-2">
              <SignoutButton
                className="w-full text-left text-sm text-red-600 hover:text-red-700 bg-transparent hover:bg-red-50 px-0 py-1 border-none"
                onClick={() => setIsOpen(false)}
              >
                🚪 ログアウト
              </SignoutButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}