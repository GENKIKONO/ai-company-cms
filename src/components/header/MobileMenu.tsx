'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

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
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Close on ESC and scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { 
      document.removeEventListener('keydown', onKey); 
      document.body.style.overflow = oldOverflow; 
    };
  }, [open]);

  // Focus trap (very light)
  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();
  }, [open]);

  const close = () => setOpen(false);
  const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) close();
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="メニューを開閉"
        aria-controls="primary-navigation"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="focus-clean inline-flex h-11 w-11 items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-50 active:scale-95 transition-all duration-200 min-h-[44px] min-w-[44px] tap-highlight-transparent gpu-hint"
      >
        <span className="sr-only">メニュー</span>
        <svg width="24" height="24" viewBox="0 0 24 24" className="text-gray-700">
          {open ? (
            <path fill="currentColor" d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <>
              <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={(e) => { e.stopPropagation(); close(); }}
          role="presentation"
        >
          <nav
            id="primary-navigation"
            aria-label="メインナビゲーション"
            className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm"
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
                      onClick={close}
                      className="focus-clean nav-link nav-item block text-gray-900 font-medium hover:text-indigo-600 transition-colors duration-200 text-lg py-2"
                    >
                      {l.label}
                    </Link>
                  ))}
                  {auth.loggedIn && (
                    <Link
                      href={auth.dashboardHref}
                      onClick={close}
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
                    onClick={close}
                    className="focus-clean nav-link nav-item w-full block text-center bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                  >
                    ログアウト
                  </Link>
                ) : (
                  <Link
                    href={auth.loginHref}
                    onClick={close}
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
      )}
    </div>
  );
}