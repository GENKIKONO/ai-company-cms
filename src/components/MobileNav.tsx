'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import Link from 'next/link';

export function MobileNav() {
  // 開閉状態
  const [isOpen, setIsOpen] = useState(false);
  // CSR後にのみ portal を使う
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape で閉じる
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // 背景スクロールロック
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // フォーカス初期位置
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  const toggle = () => setIsOpen((v) => !v);
  const close = () => setIsOpen(false);

  // ハンバーガーボタン（モバイルのみ表示）
  const Button = (
    <button
      type="button"
      onClick={toggle}
      aria-controls="mobile-nav-panel"
      aria-expanded={isOpen}
      aria-label={isOpen ? 'ナビゲーションを閉じる' : 'ナビゲーションを開く'}
      className={clsx(
        // 右下固定。デザインシステムに沿って Tailwind で記述
        'fixed bottom-6 right-6 block lg:hidden',
        'z-50 h-14 w-14 rounded-full',
        'bg-blue-600 text-white shadow-lg',
        'flex items-center justify-center text-xl',
        'hover:bg-blue-700 transition-colors'
      )}
    >
      {/* シンプルなハンバーガーアイコン */}
      <span className="sr-only">{isOpen ? 'ナビゲーションを閉じる' : 'ナビゲーションを開く'}</span>
      {isOpen ? '×' : '☰'}
    </button>
  );

  // オーバーレイ＋パネル（Portalで body 直下）
  const PortalLayer =
    mounted && isOpen &&
    createPortal(
      <>
        {/* オーバーレイ */}
        <div
          onClick={close}
          aria-hidden="true"
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
        />
        {/* パネル */}
        <nav
          id="mobile-nav-panel"
          role="navigation"
          aria-label="モバイルナビゲーション"
          ref={panelRef}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          className={clsx(
            'fixed top-0 right-0 h-screen w-80 max-w-[88vw] bg-white shadow-xl z-50',
            'transition-transform duration-300 ease-out',
            isOpen ? 'translate-x-0' : 'translate-x-full',
            'focus:outline-none'
          )}
        >
          {/* メニュー内容 */}
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800">AIO Hub</h2>
            
            <div className="space-y-4">
              <Link 
                href="/" 
                onClick={close} 
                className="block py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
              >
                トップ
              </Link>
              <Link 
                href="/pricing" 
                onClick={close} 
                className="block py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
              >
                料金プラン
              </Link>
              <Link 
                href="/organizations" 
                onClick={close} 
                className="block py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
              >
                企業ディレクトリ
              </Link>
              <Link 
                href="/hearing-service" 
                onClick={close} 
                className="block py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
              >
                ヒアリング代行
              </Link>

              {/* ログインボタン */}
              <div className="pt-4 border-t border-gray-200">
                <Link
                  href="/auth/login"
                  onClick={close}
                  className="block w-full py-3 px-4 text-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                >
                  ログイン
                </Link>
              </div>
            </div>
            
            <div className="absolute bottom-6 left-6 right-6 text-center text-sm text-gray-500">
              © {new Date().getFullYear()} AIO Hub
            </div>
          </div>
        </nav>
      </>,
      document.body
    );

  return (
    <>
      {Button}
      {PortalLayer}
    </>
  );
}