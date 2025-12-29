'use client';

/**
 * 管理コンソール レイアウトコンテンツ（クライアントコンポーネント）
 *
 * MobileDrawerLayoutを使用してモバイルナビゲーションを提供。
 * @see docs/architecture/boundaries.md
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MobileDrawerLayout } from '@/components/navigation/MobileDrawerLayout';

interface ManagementConsoleLayoutContentProps {
  children: React.ReactNode;
  userEmail: string | null;
}

const navigation = [
  { name: 'ダッシュボード', href: '/management-console' },
  { name: '設定', href: '/management-console/settings' },
  { name: '通報', href: '/management-console/reports' },
  { name: 'ヒアリング', href: '/management-console/hearings' },
  { name: 'ユーザー管理', href: '/management-console/users' },
  { name: 'お問合せ', href: '/management-console/contacts' },
  { name: '埋め込み監視', href: '/management-console/embed-dashboard' },
  { name: 'セキュリティ', href: '/management-console/security' },
];

export function ManagementConsoleLayoutContent({
  children,
  userEmail,
}: ManagementConsoleLayoutContentProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/management-console') {
      return pathname === '/management-console';
    }
    return pathname.startsWith(href);
  };

  // ドロワー内のナビゲーションコンテンツ
  const drawerContent = (
    <>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? 'bg-[var(--aio-primary)] text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="border-t border-gray-200 mt-4 pt-4 px-3">
          <Link
            href="/dashboard"
            className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          >
            ユーザー画面へ
          </Link>
          <Link
            href="/auth/signout"
            className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          >
            ログアウト
          </Link>
        </div>
      </nav>
    </>
  );

  // ドロワーフッター（ユーザー情報）
  const drawerFooter = userEmail ? (
    <div className="px-4 py-3">
      <p className="text-xs text-gray-500 truncate">{userEmail}</p>
    </div>
  ) : null;

  // ドロワーヘッダーのバッジ
  const drawerTitleBadge = (
    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
      Admin
    </span>
  );

  // カスタムヘッダー（render prop形式でopenMobileMenuを受け取る）
  const renderHeader = (openMobileMenu: () => void) => (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* ロゴ + モバイルメニューボタン */}
          <div className="flex items-center gap-3">
            {/* モバイルメニューボタン */}
            <button
              type="button"
              onClick={openMobileMenu}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              aria-label="メニューを開く"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <Link href="/management-console" className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">AIO Hub 管理コンソール</h1>
              <span className="ml-3 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                Admin
              </span>
            </Link>
          </div>

          {/* デスクトップナビ */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? 'bg-[var(--aio-primary)] text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm hover:bg-gray-100"
            >
              ユーザー画面
            </Link>
          </nav>

          {/* ユーザー情報（デスクトップのみ） */}
          <div className="hidden lg:flex items-center text-sm text-gray-600">
            {userEmail}
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <MobileDrawerLayout
      drawerTitle="管理コンソール"
      drawerTitleBadge={drawerTitleBadge}
      drawerContent={drawerContent}
      drawerFooter={drawerFooter}
      mobileHeader={renderHeader}
      containerClassName="min-h-screen bg-gray-50"
      drawerWidthClass="w-72"
    >
      <main>{children}</main>
    </MobileDrawerLayout>
  );
}
