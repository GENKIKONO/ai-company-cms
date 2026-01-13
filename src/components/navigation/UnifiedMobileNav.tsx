'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  dashboardNavGroups,
  isNavItemActive,
  getActiveCategoryId,
  getNavGroupById,
  NavGroup,
} from '@/lib/nav';

// 公開ページナビゲーション
const publicNavigation = [
  { name: 'トップ', href: '/' },
  { name: '料金プラン', href: '/pricing' },
  { name: '企業ディレクトリ', href: '/organizations' },
  { name: 'ヒアリング代行', href: '/hearing-service' },
  { name: 'ログイン', href: '/auth/login', separator: true },
];

interface UnifiedMobileNavProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// モバイル判定カスタムHook
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

/**
 * カテゴリ表示用アイコンマッピング
 */
const categoryIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  home: dashboardNavGroups.find(g => g.id === 'home')?.items[0]?.icon || ChevronRightIcon,
  overview: dashboardNavGroups.find(g => g.id === 'overview')?.items[0]?.icon || ChevronRightIcon,
  mypage: dashboardNavGroups.find(g => g.id === 'mypage')?.items[0]?.icon || ChevronRightIcon,
  aistudio: dashboardNavGroups.find(g => g.id === 'aistudio')?.items[0]?.icon || ChevronRightIcon,
  insights: dashboardNavGroups.find(g => g.id === 'insights')?.items[0]?.icon || ChevronRightIcon,
  settings: dashboardNavGroups.find(g => g.id === 'settings')?.items[0]?.icon || ChevronRightIcon,
};

/**
 * モバイル用カテゴリボタン
 */
function MobileCategoryButton({
  group,
  isActive,
  onClick,
}: {
  group: NavGroup;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = categoryIcons[group.id] || ChevronRightIcon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        isActive
          ? 'bg-[var(--aio-primary)] text-[var(--text-on-primary)]'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--aio-primary)] hover:bg-[var(--aio-surface)]',
        'group flex w-full items-center justify-between gap-x-3 rounded-lg p-3 text-sm font-medium transition-all duration-200'
      )}
    >
      <span className="flex items-center gap-x-3">
        <Icon
          className={classNames(
            isActive ? 'text-[var(--text-on-primary)]' : 'text-[var(--color-icon-muted)] group-hover:text-[var(--aio-primary)]',
            'h-5 w-5 shrink-0'
          )}
          aria-hidden="true"
        />
        {group.label}
      </span>
      <ChevronRightIcon
        className={classNames(
          isActive ? 'text-[var(--text-on-primary)]' : 'text-[var(--color-icon-muted)]',
          'h-4 w-4 shrink-0'
        )}
        aria-hidden="true"
      />
    </button>
  );
}

/**
 * モバイル用子項目リスト
 */
function MobileSubItemsList({
  group,
  pathname,
  onNavigation,
  onBack,
}: {
  group: NavGroup;
  pathname: string;
  onNavigation: (href: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-2">
      {/* 戻るボタン */}
      <button
        type="button"
        onClick={onBack}
        className="group flex w-full items-center gap-x-2 rounded-lg p-3 text-sm font-medium text-[var(--color-text-tertiary)] hover:text-[var(--aio-primary)] hover:bg-[var(--aio-surface)] transition-all duration-200"
      >
        <ChevronLeftIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
        Categories
      </button>

      {/* カテゴリラベル */}
      <div className="text-xs font-semibold leading-6 text-[var(--color-text-tertiary)] uppercase tracking-wider px-3">
        {group.label}
      </div>

      {/* 子項目リスト */}
      <ul className="space-y-1">
        {group.items.map((item) => {
          const isActive = isNavItemActive(item.href, pathname);
          const Icon = item.icon;
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={() => onNavigation(item.href)}
                className={classNames(
                  isActive
                    ? 'bg-[var(--aio-primary)] text-[var(--text-on-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--aio-primary)] hover:bg-[var(--aio-surface)]',
                  'group flex gap-x-3 rounded-lg p-3 text-sm font-medium transition-all duration-200'
                )}
              >
                <Icon
                  className={classNames(
                    isActive ? 'text-[var(--text-on-primary)]' : 'text-[var(--color-icon-muted)] group-hover:text-[var(--aio-primary)]',
                    'h-5 w-5 shrink-0'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function UnifiedMobileNav({ isOpen: externalIsOpen, onToggle: externalOnToggle }: UnifiedMobileNavProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // アニメーション制御用state
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  // カテゴリ選択state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const pathname = usePathname();
  const isMobile = useIsMobile(1024);

  // スクロール位置保存用
  const scrollYRef = useRef(0);
  const prevPathnameRef = useRef(pathname);
  // 二重クローズ防止フラグ
  const navigationTriggeredRef = useRef(false);

  // 外部制御 vs 内部制御
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  // ダッシュボードページ判定
  const isDashboard = pathname.startsWith('/dashboard');

  // 選択されたカテゴリのグループを取得
  const selectedGroup = selectedCategoryId ? getNavGroupById(selectedCategoryId) : null;

  // マウント状態管理
  useEffect(() => {
    setMounted(true);
  }, []);

  // deep link時にカテゴリを自動判定（ドロワーが開いたとき）
  useEffect(() => {
    if (isOpen && isDashboard) {
      const activeCategoryId = getActiveCategoryId(pathname);
      if (activeCategoryId) {
        setSelectedCategoryId(activeCategoryId);
      }
    }
  }, [isOpen, isDashboard, pathname]);

  // ドロワーが閉じたときにカテゴリ選択をリセット
  useEffect(() => {
    if (!isOpen) {
      setSelectedCategoryId(null);
    }
  }, [isOpen]);

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

  // 即座スクロールロック機能
  const handleImmediateScrollLock = useCallback((shouldLock: boolean) => {
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

  // 統合されたトグル関数
  const handleToggle = useCallback(() => {
    const newIsOpen = !isOpen;
    handleImmediateScrollLock(newIsOpen);

    if (externalOnToggle) {
      externalOnToggle();
    } else {
      setInternalIsOpen(newIsOpen);
    }
  }, [isOpen, externalOnToggle, handleImmediateScrollLock]);

  // パスが変わったら自動でメニューを閉じる
  useEffect(() => {
    if (prevPathnameRef.current !== pathname && isOpen) {
      if (!navigationTriggeredRef.current) {
        handleImmediateScrollLock(false);
        if (externalOnToggle) {
          externalOnToggle();
        } else {
          setInternalIsOpen(false);
        }
      }
      navigationTriggeredRef.current = false;
    }
    prevPathnameRef.current = pathname;
  }, [pathname, isOpen, externalOnToggle, handleImmediateScrollLock]);

  // Escキーで閉じる
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleToggle();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleToggle]);

  // ナビゲーションハンドラー
  const handleNavigation = useCallback((href: string) => {
    handleImmediateScrollLock(false);

    if (externalOnToggle) {
      externalOnToggle();
    } else {
      setInternalIsOpen(false);
    }

    navigationTriggeredRef.current = true;
  }, [externalOnToggle, handleImmediateScrollLock]);

  // モバイル以外では表示しない
  if (isMobile === null || !isMobile || !mounted) return null;

  // FAB
  const Fab = (
    <button
      type="button"
      aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
      aria-expanded={isOpen}
      aria-controls="unified-mobile-drawer"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle();
      }}
      className={classNames(
        "fixed bottom-4 right-4 z-[9999] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--aio-primary)] text-[var(--text-on-primary)] shadow-lg hover:bg-[var(--aio-primary-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--aio-primary)] spring-bounce",
        isOpen ? "nav-fab-open" : "nav-fab-closed"
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
    </button>
  );

  // オーバーレイ
  const Overlay = shouldRender ? createPortal(
    <div
      className={classNames(
        "fixed inset-0 z-40 bg-black/40 pointer-events-auto transition-opacity duration-300",
        isClosing ? "opacity-0" : "opacity-100"
      )}
      aria-hidden="true"
      onClick={handleToggle}
    />,
    document.body
  ) : null;

  // メインドロワー
  const Drawer = shouldRender ? createPortal(
    <nav
      id="unified-mobile-drawer"
      role="navigation"
      aria-label={isDashboard ? "ダッシュボードメニュー" : "メインメニュー"}
      className={classNames(
        "fixed top-0 right-0 z-50 h-screen w-80 max-w-[85vw] glass-card backdrop-blur-xl border border-[var(--dashboard-card-border)] shadow-xl",
        "mobile-nav-drawer",
        isClosing ? "mobile-nav-drawer--exit" : "mobile-nav-drawer--enter"
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex h-full flex-col">
        {/* ヘッダー */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-[var(--dashboard-card-border)]">
          <h2 className="text-lg font-semibold text-[var(--aio-primary)]">
            {isDashboard ? "AIOHub" : "メニュー"}
          </h2>
          <button
            className="p-2 rounded-lg hover:bg-[var(--table-row-hover)] transition-colors duration-200"
            onClick={handleToggle}
            aria-label="閉じる"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ナビゲーションメニュー */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!isDashboard ? (
            // 公開ページナビゲーション
            <ul className="space-y-1">
              {publicNavigation.map((item) => {
                const isActive = pathname === item.href;
                const hasSeparator = 'separator' in item && item.separator;

                return (
                  <li key={item.name} className={hasSeparator ? "mt-4 pt-2 border-t border-[var(--dashboard-card-border)]" : ""}>
                    <Link
                      className={classNames(
                        "block px-4 py-3 rounded-lg transition-all duration-200 spring-bounce",
                        isActive
                          ? "bg-[var(--aio-primary)] text-[var(--text-on-primary)]"
                          : "hover:bg-[var(--aio-surface)] text-[var(--color-text-secondary)]"
                      )}
                      href={item.href}
                      onClick={() => handleNavigation(item.href)}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : selectedGroup ? (
            // ダッシュボード：子項目表示
            <MobileSubItemsList
              group={selectedGroup}
              pathname={pathname}
              onNavigation={handleNavigation}
              onBack={() => setSelectedCategoryId(null)}
            />
          ) : (
            // ダッシュボード：カテゴリ一覧
            <ul className="space-y-2">
              {dashboardNavGroups.map((group) => {
                const isActive = getActiveCategoryId(pathname) === group.id;
                return (
                  <li key={group.id}>
                    <MobileCategoryButton
                      group={group}
                      isActive={isActive}
                      onClick={() => setSelectedCategoryId(group.id)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-[var(--dashboard-card-border)]">
          <p className="text-xs text-[var(--color-text-tertiary)] text-center">
            © {new Date().getFullYear()} AIOHub
          </p>
        </div>
      </div>
    </nav>,
    document.body
  ) : null;

  return (
    <>
      {Overlay}
      {Drawer}
      {createPortal(Fab, document.body)}
    </>
  );
}

export default UnifiedMobileNav;
