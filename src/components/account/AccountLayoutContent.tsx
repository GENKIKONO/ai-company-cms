'use client';

/**
 * AccountLayoutContent - アカウント領域のレイアウトコンテンツ
 *
 * デスクトップ: サイドバーを常に表示
 * モバイル: FAB（右下）をクリックでドロワー表示
 *
 * NOTE: DashboardLayoutContentと同じUIパターンだが、
 * Account領域専用のサイドバー（AccountSidebar）を使用
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';

interface AccountLayoutContentProps {
  children: React.ReactNode;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// モバイル判定カスタムHook（lg=1024未満でモバイル）
function useIsMobile(lg = 1024) {
  const [mobile, setMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${lg - 1}px)`);
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [lg]);

  return mobile;
}

export function AccountLayoutContent({ children }: AccountLayoutContentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const isMobile = useIsMobile(1024);
  const scrollYRef = useRef(0);

  // マウント状態管理
  useEffect(() => {
    setMounted(true);
  }, []);

  // アニメーション制御: 開く処理
  useEffect(() => {
    if (isOpen && !isClosing) {
      setShouldRender(true);
    }
  }, [isOpen, isClosing]);

  // アニメーション制御: 閉じる処理
  useEffect(() => {
    if (!isOpen && shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsClosing(false);
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  // スクロールロック
  const handleScrollLock = useCallback((shouldLock: boolean) => {
    if (shouldLock) {
      scrollYRef.current = window.scrollY;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.width = '100%';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollYRef.current > 0) {
        window.scrollTo(0, scrollYRef.current);
      }
    }
  }, []);

  // トグル
  const handleToggle = useCallback(() => {
    const newIsOpen = !isOpen;
    handleScrollLock(newIsOpen);
    setIsOpen(newIsOpen);
  }, [isOpen, handleScrollLock]);

  // Escキーで閉じる
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleToggle();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleToggle]);

  // FABボタン（モバイルのみ）
  const Fab = mounted && isMobile ? createPortal(
    <button
      type="button"
      aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
      aria-expanded={isOpen}
      aria-controls="account-mobile-drawer"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle();
      }}
      className={classNames(
        "fixed bottom-4 right-4 z-[9999] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--aio-primary)] text-white shadow-lg hover:bg-[var(--aio-primary-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--aio-primary)] transition-transform duration-200",
        isOpen ? "rotate-90" : "rotate-0"
      )}
    >
      {isOpen ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
    </button>,
    document.body
  ) : null;

  // オーバーレイ
  const Overlay = mounted && shouldRender ? createPortal(
    <div
      className={classNames(
        "fixed inset-0 z-40 bg-black/40 pointer-events-auto transition-opacity duration-300 lg:hidden",
        isClosing ? "opacity-0" : "opacity-100"
      )}
      aria-hidden="true"
      onClick={handleToggle}
    />,
    document.body
  ) : null;

  // モバイルドロワー（右側から展開）
  const Drawer = mounted && shouldRender ? createPortal(
    <div
      id="account-mobile-drawer"
      role="navigation"
      aria-label="アカウントメニュー"
      className={classNames(
        "fixed top-0 right-0 z-50 h-screen w-64 bg-[var(--dashboard-card-bg)] shadow-xl lg:hidden transition-transform duration-300 ease-out",
        isClosing ? "translate-x-full" : "translate-x-0"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <AccountSidebar />
    </div>,
    document.body
  ) : null;

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      {/* デスクトップサイドバー（lg以上で常に表示） */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col lg:flex">
        <AccountSidebar />
      </aside>

      {/* モバイルナビゲーション */}
      {Overlay}
      {Drawer}
      {Fab}

      {/* メインコンテンツ */}
      <main className="lg:pl-64 min-h-screen overflow-y-auto">
        <div className="py-10 pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AppErrorBoundary>
              {children}
            </AppErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
}
