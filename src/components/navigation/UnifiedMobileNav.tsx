'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { 
  HomeIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

// 公開ページナビゲーション
const publicNavigation = [
  { name: 'トップ', href: '/' },
  { name: '料金プラン', href: '/pricing' },
  { name: '企業ディレクトリ', href: '/organizations' },
  { name: 'ヒアリング代行', href: '/hearing-service' },
  { name: 'ログイン', href: '/auth/login', separator: true },
];

// ダッシュボードナビゲーション
const dashboardNavigation = [
  { name: 'ダッシュボード', href: '/dashboard', icon: HomeIcon },
  { name: '記事管理', href: '/dashboard/posts', icon: DocumentTextIcon },
  { name: 'サービス管理', href: '/dashboard/services', icon: BriefcaseIcon },
  { name: '事例管理', href: '/dashboard/case-studies', icon: UserGroupIcon },
  { name: 'FAQ管理', href: '/dashboard/faqs', icon: QuestionMarkCircleIcon },
  { name: 'Q&A統計', href: '/dashboard/qna-stats', icon: ChartBarIcon },
  { name: '分析レポート', href: '/dashboard/analytics/ai-seo-report', icon: ChartBarIcon },
  { name: 'ヘルプ', href: '/dashboard/help', icon: ChatBubbleLeftRightIcon },
  { name: '設定', href: '/dashboard/settings', icon: Cog6ToothIcon },
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

export function UnifiedMobileNav({ isOpen: externalIsOpen, onToggle: externalOnToggle }: UnifiedMobileNavProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isMobile = useIsMobile(1024);
  
  // スクロール位置保存用
  const scrollYRef = useRef(0);
  const prevPathnameRef = useRef(pathname);

  // 外部制御 vs 内部制御
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  // ダッシュボードページ判定
  const isDashboard = pathname.startsWith('/dashboard');

  // ナビゲーション決定
  const navigation = isDashboard ? dashboardNavigation : publicNavigation;

  // マウント状態管理
  useEffect(() => setMounted(true), []);

  // 改善1: 即座スクロールロック機能
  const handleImmediateScrollLock = useCallback((shouldLock: boolean) => {
    if (shouldLock) {
      // 開くとき: iOS Safari対応の即座スクロールロック
      scrollYRef.current = window.scrollY;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.width = '100%';
    } else {
      // 閉じるとき: スクロール復元
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollYRef.current > 0) {
        window.scrollTo(0, scrollYRef.current);
      }
    }
  }, []);

  // 改善1+4: 統合されたトグル関数
  const handleToggle = useCallback(() => {
    const newIsOpen = !isOpen;
    
    // 即座にスクロールロック適用
    handleImmediateScrollLock(newIsOpen);
    
    // State 更新
    if (externalOnToggle) {
      externalOnToggle();
    } else {
      setInternalIsOpen(newIsOpen);
    }
  }, [isOpen, externalOnToggle, handleImmediateScrollLock]);

  // 改善3: パスが変わったら自動でメニューを閉じる
  useEffect(() => {
    if (prevPathnameRef.current !== pathname && isOpen) {
      // ページが実際に変わったらメニューを閉じる
      handleImmediateScrollLock(false); // スクロールロック解除
      if (externalOnToggle) {
        externalOnToggle();
      } else {
        setInternalIsOpen(false);
      }
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

  // ナビゲーションハンドラー（リンククリック用）
  const handleNavigation = useCallback((href: string) => {
    // ハッシュリンクや同じページの場合は即座に閉じる
    if (href.startsWith('#') || href === pathname) {
      handleToggle();
      return;
    }
    
    // 通常のページ遷移の場合は pathname 変更で自動クローズされるため何もしない
  }, [handleToggle, pathname]);

  // モバイル以外では表示しない
  if (isMobile === null || !isMobile || !mounted) return null;

  // 改善4: FAB (Floating Action Button) - クラスベース制御
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
  const Overlay = isOpen ? createPortal(
    <div
      className="fixed inset-0 z-40 bg-black/40 opacity-100 pointer-events-auto"
      aria-hidden="true"
      onClick={handleToggle}
    />,
    document.body
  ) : null;

  // 改善2: メインドロワー（統一CSS変数使用）
  const Drawer = createPortal(
    <nav
      id="unified-mobile-drawer"
      role="navigation"
      aria-label={isDashboard ? "ダッシュボードメニュー" : "メインメニュー"}
      className={classNames(
        "fixed top-0 right-0 z-50 h-screen w-80 max-w-[85vw] glass-card backdrop-blur-xl border border-gray-200/60 shadow-xl mobile-nav-drawer",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex h-full flex-col">
        {/* ヘッダー */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200/60">
          <h2 className="text-lg font-semibold text-[var(--aio-primary)]">
            {isDashboard ? "AIO Hub" : "メニュー"}
          </h2>
          <button
            className="p-2 rounded-lg hover:bg-gray-100/60 transition-colors duration-200"
            onClick={handleToggle}
            aria-label="閉じる"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ナビゲーションメニュー */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <ul className={isDashboard ? "space-y-2" : "space-y-1"}>
            {navigation.map((item) => {
              if (!isDashboard) {
                // 公開ページナビゲーション
                const isActive = pathname === item.href;
                const hasSeparator = 'separator' in item && item.separator;
                
                return (
                  <li key={item.name} className={hasSeparator ? "mt-4 pt-2 border-t border-gray-200/60" : ""}>
                    <Link
                      className={classNames(
                        "block px-4 py-3 rounded-lg transition-all duration-200 spring-bounce",
                        isActive 
                          ? "bg-[var(--aio-primary)] text-[var(--text-on-primary)]" 
                          : "hover:bg-gray-50/60 text-gray-700"
                      )}
                      href={item.href}
                      onClick={() => handleNavigation(item.href)}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              } else {
                // ダッシュボードナビゲーション
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => handleNavigation(item.href)}
                      className={classNames(
                        isActive
                          ? 'bg-[var(--aio-primary)] text-[var(--text-on-primary)]'
                          : 'text-gray-700 hover:text-[var(--aio-primary)] hover:bg-gray-50/60',
                        'group flex gap-x-3 rounded-lg p-3 text-sm font-medium spring-bounce transition-all duration-200'
                      )}
                    >
                      <Icon
                        className={classNames(
                          isActive ? 'text-[var(--text-on-primary)]' : 'text-gray-400 group-hover:text-[var(--aio-primary)]',
                          'h-5 w-5 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              }
            })}
          </ul>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200/60">
          <p className="text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} AIO Hub
          </p>
        </div>
      </div>
    </nav>,
    document.body
  );

  return (
    <>
      {Overlay}
      {Drawer}
      {createPortal(Fab, document.body)}
    </>
  );
}

export default UnifiedMobileNav;