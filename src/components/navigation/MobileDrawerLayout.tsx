'use client';

/**
 * MobileDrawerLayout - モバイルドロワーナビゲーションの正本コンポーネント
 *
 * Dashboard / ManagementConsole など複数領域で共通のモバイルドロワー動作を提供。
 * このコンポーネントを通じて以下を統一:
 * - open/close state管理
 * - ルート遷移時の自動クローズ
 * - ESCキーでクローズ
 * - 背景スクロールロック
 * - オーバーレイクリックでクローズ
 *
 * @see docs/architecture/boundaries.md
 */

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export interface MobileDrawerLayoutProps {
  /** メインコンテンツ */
  children: ReactNode;
  /** ドロワー内のナビゲーションコンテンツ */
  drawerContent: ReactNode;
  /** ドロワーヘッダーのタイトル */
  drawerTitle: string;
  /** ドロワーヘッダーの右側（バッジ等） */
  drawerTitleBadge?: ReactNode;
  /** ドロワーフッター（ユーザー情報等） */
  drawerFooter?: ReactNode;
  /** モバイルヘッダー（lg未満で表示）- 指定しない場合はデフォルトのハンバーガー+タイトル
   * ReactNode: lg:hidden で自動ラップ
   * Function: render prop形式でopenMobileMenuを受け取り、呼び出し元がvisibility制御
   */
  mobileHeader?: ReactNode | ((openMobileMenu: () => void) => ReactNode);
  /** モバイルヘッダーのタイトル（mobileHeaderを指定しない場合に使用） */
  mobileHeaderTitle?: string;
  /** デスクトップ用サイドバー（lg以上で表示、固定配置） */
  desktopSidebar?: ReactNode;
  /** メインコンテンツのラッパークラス */
  mainClassName?: string;
  /** ルートコンテナのクラス */
  containerClassName?: string;
  /** ドロワーの幅クラス（デフォルト: w-64） */
  drawerWidthClass?: string;
}

export function MobileDrawerLayout({
  children,
  drawerContent,
  drawerTitle,
  drawerTitleBadge,
  drawerFooter,
  mobileHeader,
  mobileHeaderTitle = 'Menu',
  desktopSidebar,
  mainClassName = '',
  containerClassName = 'min-h-screen bg-[var(--aio-page-bg,#f3f4f6)]',
  drawerWidthClass = 'w-64',
}: MobileDrawerLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // ルート遷移時にモバイルメニューを閉じる
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // ESCキーでメニューを閉じる + 背景スクロール防止
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const openMobileMenu = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className={containerClassName}>
      {/* モバイル用ヘッダー（lg未満で表示） */}
      {mobileHeader ? (
        // render prop形式（関数）の場合は呼び出し元がvisibility制御を行う
        // ReactNode形式の場合はlg:hiddenで自動的にモバイル専用となる
        typeof mobileHeader === 'function' ? (
          (mobileHeader as (openMenu: () => void) => ReactNode)(openMobileMenu)
        ) : (
          <div className="lg:hidden">
            {mobileHeader}
          </div>
        )
      ) : (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-[90] bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={openMobileMenu}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            aria-label="メニューを開く"
          >
            <HamburgerIcon />
          </button>
          <span className="text-lg font-bold text-[var(--aio-primary)]">{mobileHeaderTitle}</span>
        </div>
      )}

      {/* モバイル用ドロワーメニュー */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[200]">
          {/* オーバーレイ */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          {/* ドロワー */}
          <aside className={`fixed left-0 top-0 bottom-0 ${drawerWidthClass} bg-white shadow-xl flex flex-col animate-in slide-in-from-left duration-200`}>
            {/* ドロワーヘッダー */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[var(--aio-primary)]">{drawerTitle}</span>
                {drawerTitleBadge}
              </div>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                aria-label="メニューを閉じる"
              >
                <CloseIcon />
              </button>
            </div>
            {/* ドロワーコンテンツ */}
            <div className="flex-1 overflow-y-auto">
              {drawerContent}
            </div>
            {/* ドロワーフッター */}
            {drawerFooter && (
              <div className="border-t border-gray-200">
                {drawerFooter}
              </div>
            )}
          </aside>
        </div>
      )}

      {/* デスクトップ用サイドバー（lg以上で常時表示） */}
      {desktopSidebar && (
        <aside className="hidden lg:block fixed left-0 top-0 bottom-0 z-[100] w-64">
          {desktopSidebar}
        </aside>
      )}

      {/* メインコンテンツエリア */}
      <div className={mainClassName}>
        {children}
      </div>
    </div>
  );
}

// アイコンコンポーネント
function HamburgerIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// エクスポート用のヘルパー関数: カスタムヘッダーでハンバーガーボタンを使う場合
export function MobileMenuButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] ${className}`}
      aria-label="メニューを開く"
    >
      <HamburgerIcon />
    </button>
  );
}
