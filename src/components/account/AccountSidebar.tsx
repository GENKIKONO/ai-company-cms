'use client';

/**
 * AccountSidebar - Account領域のサイドバーナビゲーション
 *
 * Dashboard領域と視覚的に統一感を持たせつつ、
 * Account（user主体）用のナビゲーションを提供
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import {
  UserCircleIcon,
  ShieldCheckIcon,
  BellIcon,
  ArrowLeftIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'アカウント', href: '/account', icon: Cog6ToothIcon },
  { name: 'プロフィール', href: '/account/profile', icon: UserCircleIcon },
  { name: 'セキュリティ', href: '/account/security', icon: ShieldCheckIcon },
  { name: '通知設定', href: '/account/notifications', icon: BellIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-[var(--dashboard-card-border)]">
      <div className="flex h-16 shrink-0 items-center">
        <Link href="/" className="text-xl font-bold text-[var(--aio-primary)]">
          AIOHub
        </Link>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          {/* ダッシュボードへ戻る */}
          <li>
            <Link
              href={ROUTES.dashboard}
              className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-[var(--color-text-secondary)] hover:text-[var(--aio-primary)] hover:bg-[var(--aio-surface)]"
            >
              <ArrowLeftIcon
                className="h-6 w-6 shrink-0 text-[var(--color-icon-muted)] group-hover:text-[var(--aio-primary)]"
                aria-hidden="true"
              />
              ダッシュボードに戻る
            </Link>
          </li>

          {/* アカウントメニュー */}
          <li>
            <div className="text-xs font-semibold leading-6 text-[var(--color-text-tertiary)] mb-2">
              アカウント設定
            </div>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={classNames(
                        isActive
                          ? 'bg-[var(--aio-primary)] text-white'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--aio-primary)] hover:bg-[var(--aio-surface)]',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                      )}
                    >
                      <item.icon
                        className={classNames(
                          isActive ? 'text-white' : 'text-[var(--color-icon-muted)] group-hover:text-[var(--aio-primary)]',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}
