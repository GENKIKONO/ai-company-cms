'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function FloatingHamburger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // bodyスクロール固定（メニュー展開時のみ）
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // ESC キーでメニューを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    
    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open]);

  const links = [
    { href: '/pricing', label: '料金プラン' },
    { href: '/organizations', label: '企業ディレクトリ' },
    { href: '/hearing-service', label: 'ヒアリング代行' },
  ];

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
        aria-expanded={open}
        aria-controls="mobile-drawer"
        className="fh-btn"
        onClick={() => setOpen(!open)}
      >
        <span className={`fh-icon ${open ? 'is-open' : ''}`} aria-hidden="true" />
      </button>

      {/* サイドメニュー */}
      <aside
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        className={`fh-drawer ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
      >
        <nav className="fh-panel" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col h-full">
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="text-xl font-bold text-indigo-600">AIO Hub</div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="メニューを閉じる"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* メニュー項目 */}
            <div className="flex-1 p-6 space-y-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 px-4 text-lg font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              
              {/* ログインボタン */}
              <div className="pt-4 border-t border-gray-100">
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  ログイン
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}