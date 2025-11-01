'use client';

import { useState, useEffect } from 'react';
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
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const navigation = [
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

interface MobileDashboardNavProps {
  isOpen: boolean;
  onToggle: () => void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function MobileDashboardNav({ isOpen, onToggle }: MobileDashboardNavProps) {
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // デスクトップでは表示しない
  if (!isMobile) return null;

  return typeof window !== 'undefined' ? createPortal(
    <>
      {/* ハンバーガーボタン - 固定位置 */}
      <button
        onClick={onToggle}
        aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
        className="fixed bottom-4 right-4 z-50 lg:hidden
          w-14 h-14 bg-[var(--aio-primary)] text-white rounded-full
          shadow-lg hover:bg-[var(--aio-primary-hover)]
          transition-all duration-200 ease-out
          flex items-center justify-center
          border-2 border-white"
        style={{
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
        }}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* オーバーレイとサイドメニュー */}
      {isOpen && (
        <>
          {/* 背景オーバーレイ */}
          <div 
            onClick={onToggle}
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          />
          
          {/* サイドメニュー - 右からスライドイン */}
          <nav 
            className={classNames(
              'fixed top-0 right-0 z-50 h-full w-80 bg-white shadow-xl lg:hidden',
              'transform transition-transform duration-200 ease-out',
              isOpen ? 'translate-x-0' : 'translate-x-full'
            )}
          >
            <div className="flex h-full flex-col">
              {/* ヘッダー */}
              <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-[var(--aio-primary)]">
                  AIO Hub
                </h2>
                <button
                  onClick={onToggle}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  aria-label="メニューを閉じる"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* ナビゲーションメニュー */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <ul className="space-y-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={onToggle} // メニューを閉じる
                          className={classNames(
                            isActive
                              ? 'bg-[var(--aio-primary)] text-white'
                              : 'text-gray-700 hover:text-[var(--aio-primary)] hover:bg-gray-50',
                            'group flex gap-x-3 rounded-lg p-3 text-sm font-medium'
                          )}
                        >
                          <item.icon
                            className={classNames(
                              isActive ? 'text-white' : 'text-gray-400 group-hover:text-[var(--aio-primary)]',
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

              {/* フッター */}
              <div className="px-6 py-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  © {new Date().getFullYear()} AIO Hub
                </p>
              </div>
            </div>
          </nav>
        </>
      )}
    </>,
    document.body
  ) : null;
}