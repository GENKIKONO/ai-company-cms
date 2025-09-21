'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface UserMenuProps {
  onAuthModalOpen: () => void;
}

export default function UserMenu({ onAuthModalOpen }: UserMenuProps) {
  const { user, userProfile, signOut, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className=\"w-8 h-8 bg-gray-200 rounded-full animate-pulse\"></div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={onAuthModalOpen}
        className=\"bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors\"
      >
        ログイン
      </button>
    );
  }

  const initials = userProfile?.full_name
    ? userProfile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className=\"relative\" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className=\"flex items-center space-x-2 bg-white border border-gray-300 rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500\"
      >
        {userProfile?.avatar_url ? (
          <img
            src={userProfile.avatar_url}
            alt=\"プロフィール画像\"
            className=\"w-6 h-6 rounded-full object-cover\"
          />
        ) : (
          <div className=\"w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold\">
            {initials}
          </div>
        )}
        <span className=\"hidden sm:block\">
          {userProfile?.full_name || user.email?.split('@')[0] || 'ユーザー'}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill=\"none\"
          stroke=\"currentColor\"
          viewBox=\"0 0 24 24\"
        >
          <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M19 9l-7 7-7-7\" />
        </svg>
      </button>

      {isOpen && (
        <div className=\"absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200\">
          <div className=\"px-4 py-2 border-b border-gray-100\">
            <p className=\"text-sm font-medium text-gray-900\">
              {userProfile?.full_name || 'ユーザー'}
            </p>
            <p className=\"text-sm text-gray-500 truncate\">
              {user.email}
            </p>
          </div>

          <Link
            href=\"/profile\"
            className=\"block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100\"
            onClick={() => setIsOpen(false)}
          >
            <div className=\"flex items-center space-x-2\">
              <svg className=\"w-4 h-4 text-gray-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z\" />
              </svg>
              <span>プロフィール</span>
            </div>
          </Link>

          <Link
            href=\"/saved-searches\"
            className=\"block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100\"
            onClick={() => setIsOpen(false)}
          >
            <div className=\"flex items-center space-x-2\">
              <svg className=\"w-4 h-4 text-gray-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z\" />
              </svg>
              <span>保存した検索</span>
            </div>
          </Link>

          <Link
            href=\"/favorites\"
            className=\"block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100\"
            onClick={() => setIsOpen(false)}
          >
            <div className=\"flex items-center space-x-2\">
              <svg className=\"w-4 h-4 text-gray-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z\" />
              </svg>
              <span>お気に入り</span>
            </div>
          </Link>

          <Link
            href=\"/settings\"
            className=\"block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100\"
            onClick={() => setIsOpen(false)}
          >
            <div className=\"flex items-center space-x-2\">
              <svg className=\"w-4 h-4 text-gray-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z\" />
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M15 12a3 3 0 11-6 0 3 3 0 016 0z\" />
              </svg>
              <span>設定</span>
            </div>
          </Link>

          <div className=\"border-t border-gray-100 mt-1\">
            <button
              onClick={handleSignOut}
              className=\"block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100\"
            >
              <div className=\"flex items-center space-x-2\">
                <svg className=\"w-4 h-4 text-gray-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1\" />
                </svg>
                <span>ログアウト</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}