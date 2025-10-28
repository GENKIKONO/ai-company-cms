'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Props = {
  hideAbove?: number;             // 表示をモバイル限定にする閾値(px)
};

export default function FloatingMenuButton({ hideAbove = 1024 }: Props) {
  const [visible, setVisible] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setVisible(window.innerWidth < hideAbove);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [hideAbove]);

  // bodyスクロール固定（メニュー展開時のみ）
  useEffect(() => {
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

  // Custom event listener for external toggle
  useEffect(() => {
    const handleToggle = () => setOpen(prev => !prev);
    document.addEventListener('side-menu:toggle', handleToggle);
    return () => document.removeEventListener('side-menu:toggle', handleToggle);
  }, []);

  const links = [
    { href: '/pricing', label: '料金プラン' },
    { href: '/organizations', label: '企業ディレクトリ' },
    { href: '/hearing-service', label: 'ヒアリング代行' },
  ];

  if (!visible) return null;

  return (
    <>
      <button
        aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
        onClick={() => setOpen(!open)}
        className="
          fixed z-[9999]
          rounded-full
          bg-[#1f6cff] text-white
          shadow-xl shadow-indigo-500/20
          active:scale-[0.98] transition-transform
        "
        style={{
          // "右下より少し左上"に：安全に親とは無関係な viewport 固定
          right: `calc(16px + env(safe-area-inset-right))`,
          bottom: `calc(24px + env(safe-area-inset-bottom))`,
          width: 64, height: 64,
        }}
      >
        {/* ハンバーガー/クローズ アイコン */}
        {open ? (
          <svg
            width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true"
            className="mx-auto"
          >
            <path d="M6 6l12 12M6 18L18 6"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg
            width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true"
            className="mx-auto"
          >
            <path d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* サイドメニュー */}
      {open && (
        <div
          className="fixed inset-0 z-[9998] bg-black/40"
          onClick={() => setOpen(false)}
        >
          <nav
            className="fixed top-0 right-0 h-full w-[min(84vw,360px)] bg-white shadow-xl transform transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
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
        </div>
      )}
    </>
  );
}