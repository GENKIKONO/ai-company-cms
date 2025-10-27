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
    // Overlay click no longer closes menu - ESC key only
    e.stopPropagation();
  };

  const handleLinkClick = () => {
    // Link click no longer closes menu - ESC key only
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
          className="fixed inset-0 z-50 bg-white/98 backdrop-blur-md shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* コンテンツラッパ - FABとの重なり防止 */}
          <div className="nav-panel overflow-y-auto pb-[calc(96px+env(safe-area-inset-bottom))] pr-16 h-full">
            <div className="px-6 pt-6 space-y-6">
              <div className="text-xl font-bold text-indigo-600 pl-4">AIO Hub</div>
              
              {/* いちばん上にログイン */}
              {!auth.loggedIn && (
                <Link
                  href={auth.loginHref}
                  ref={firstLinkRef}
                  onClick={handleLinkClick}
                  className="focus-clean nav-link nav-item w-full block text-center bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200"
                >
                  ログイン
                </Link>
              )}

              {/* ログイン済みユーザー情報 */}
              {auth.loggedIn && (
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-[var(--bg-primary)] rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      U
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary">
                      ログイン中
                    </p>
                  </div>
                </div>
              )}
              
              <nav className="flex flex-col items-start gap-2 pl-0">
                {links.map((l, i) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    ref={auth.loggedIn && i === 0 ? firstLinkRef : undefined}
                    onClick={handleLinkClick}
                    className="focus-clean text-primary font-medium hover:text-[var(--bg-primary)] transition-colors duration-200 py-2 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none"
                  >
                    {l.label}
                  </Link>
                ))}
                
                {auth.loggedIn && (
                  <>
                    <Link
                      href={auth.dashboardHref}
                      onClick={handleLinkClick}
                      className="focus-clean text-primary font-medium hover:text-[var(--bg-primary)] transition-colors duration-200 py-2 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none"
                    >
                      マイページ
                    </Link>
                    <Link
                      href={auth.logoutHref}
                      onClick={handleLinkClick}
                      className="focus-clean block text-center bg-[var(--color-blue-600)] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[var(--color-blue-700)] focus:ring-2 focus:ring-[var(--color-blue-300)] transition-colors duration-200 mt-6"
                    >
                      ログアウト
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}