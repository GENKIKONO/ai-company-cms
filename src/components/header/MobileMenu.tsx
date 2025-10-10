'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMenu } from '@/components/ui/MenuProvider';

export default function MobileMenu({
  links = [
    { href: '/aio', label: 'AIO Hubとは' },
    { href: '/pricing', label: '料金プラン' },
    { href: '/hearing-service', label: 'ヒアリング代行' },
  ],
  auth = { loggedIn: undefined, loginHref: '/auth/login', logoutHref: '/auth/signout', dashboardHref: '/dashboard' },
}: {
  links?: { href: string; label: string }[];
  auth?: { loggedIn?: boolean; loginHref: string; logoutHref: string; dashboardHref: string };
}) {
  const { open, close } = useMenu();
  const panelRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Focus trap (very light)
  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();
  }, [open]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      e.stopPropagation();
      close();
    }
  };

  const handleLinkClick = () => {
    close();
  };

  if (!open) return null;

  return (
    <div className="sm:hidden">
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={handleOverlayClick}
        role="presentation"
      >
        <nav
          id="primary-navigation"
          aria-label="メインナビゲーション"
          className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div ref={panelRef} className="flex flex-col h-full justify-between">
            <div className="px-6 pt-6 space-y-6">
              <div className="text-xl font-bold text-indigo-600">AIO Hub</div>
              
              {/* ログイン済みユーザー情報 */}
              {auth.loggedIn && (
                <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      U
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      ログイン中
                    </p>
                  </div>
                </div>
              )}
              
              <nav className="space-y-3">
                {links.map((l, i) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    ref={i === 0 ? firstLinkRef : undefined}
                    onClick={handleLinkClick}
                    className="focus-clean nav-link nav-item block text-gray-900 font-medium hover:text-indigo-600 transition-colors duration-200 text-lg py-2"
                  >
                    {l.label}
                  </Link>
                ))}
                {auth.loggedIn && (
                  <Link
                    href={auth.dashboardHref}
                    onClick={handleLinkClick}
                    className="focus-clean nav-link nav-item block text-gray-900 font-medium hover:text-indigo-600 transition-colors duration-200 text-lg py-2"
                  >
                    マイページ
                  </Link>
                )}
              </nav>
            </div>
            <div className="p-6 border-t border-gray-100 space-y-4">
              {auth.loggedIn ? (
                <Link
                  href={auth.logoutHref}
                  onClick={handleLinkClick}
                  className="focus-clean nav-link nav-item w-full block text-center bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  ログアウト
                </Link>
              ) : (
                <Link
                  href={auth.loginHref}
                  onClick={handleLinkClick}
                  className="focus-clean nav-link nav-item w-full block text-center bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200"
                >
                  ログイン
                </Link>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); close(); }}
                className="focus-clean nav-link nav-item w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg active:scale-[.98] transition-transform duration-200"
                aria-label="メニューを閉じる"
              >
                <span className="inline-flex items-center gap-2 justify-center">
                  <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  閉じる
                </span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}