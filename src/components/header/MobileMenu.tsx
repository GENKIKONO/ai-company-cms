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

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
        className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-50 active:scale-95 transition-all duration-200 min-h-[44px] min-w-[44px]"
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
          className="fixed inset-0 z-50 bg-black/30"
          onClick={onOverlayClick}
          role="presentation"
        >
          <nav
            id="primary-navigation"
            aria-label="メインナビゲーション"
            className="fixed inset-x-4 top-16 z-50 origin-top rounded-xl border bg-white shadow-lg max-w-sm mx-auto"
          >
            <div ref={panelRef} className="py-2">
              {links.map((l, i) => (
                <Link
                  key={l.href}
                  href={l.href}
                  ref={i === 0 ? firstLinkRef : undefined}
                  onClick={close}
                  className="block px-5 py-4 text-base font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[44px] flex items-center transition-colors duration-200"
                >
                  {l.label}
                </Link>
              ))}
              {auth.loggedIn && (
                <Link
                  href={auth.dashboardHref}
                  onClick={close}
                  className="block px-5 py-4 text-base font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[44px] flex items-center transition-colors duration-200"
                >
                  マイページ
                </Link>
              )}
              <div className="my-2 border-t border-gray-200" />
              {auth.loggedIn ? (
                <Link
                  href={auth.logoutHref}
                  onClick={close}
                  className="block px-5 py-4 text-base font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 min-h-[44px] flex items-center transition-colors duration-200"
                >
                  ログアウト
                </Link>
              ) : (
                <Link
                  href={auth.loginHref}
                  onClick={close}
                  className="block px-5 py-4 text-base font-medium text-indigo-600 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[44px] flex items-center transition-colors duration-200"
                >
                  ログイン
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}