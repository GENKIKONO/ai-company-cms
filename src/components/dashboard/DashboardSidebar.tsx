'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import {
  dashboardNavGroups,
  conditionalNavItems,
  isNavItemActive,
  NavGroup,
  NavItem,
} from '@/lib/nav';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface DashboardSidebarProps {
  canSeeAdminNav?: boolean;
}

/**
 * ナビ項目コンポーネント
 */
function NavItemLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
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
  );
}

/**
 * ナビグループコンポーネント
 */
function NavGroupSection({ group, pathname }: { group: NavGroup; pathname: string }) {
  return (
    <li>
      {/* グループラベル */}
      <div className="text-xs font-semibold leading-6 text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
        {group.label}
      </div>
      {/* グループ内の項目 */}
      <ul role="list" className="-mx-2 space-y-1">
        {group.items.map((item) => {
          const isActive = isNavItemActive(item.href, pathname);
          return (
            <li key={item.name}>
              <NavItemLink item={item} isActive={isActive} />
            </li>
          );
        })}
      </ul>
    </li>
  );
}

export function DashboardSidebar({ canSeeAdminNav = false }: DashboardSidebarProps) {
  const pathname = usePathname();

  // 条件付きナビ項目（org manager用）
  const manageNavItem = conditionalNavItems.find((item) => item.condition === 'orgManager');

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-[var(--dashboard-card-border)]" data-testid="dashboard-sidenav">
      <div className="flex h-16 shrink-0 items-center">
        <Link href="/" className="text-xl font-bold text-[var(--aio-primary)]">
          AIO Hub
        </Link>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-6">
          {/* グループ化されたナビゲーション */}
          {dashboardNavGroups.map((group) => (
            <NavGroupSection key={group.id} group={group} pathname={pathname} />
          ))}

          {/* 条件付きナビ（org manager用） */}
          {canSeeAdminNav && manageNavItem && (
            <li>
              <div className="text-xs font-semibold leading-6 text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                Admin
              </div>
              <ul role="list" className="-mx-2 space-y-1">
                <li>
                  <NavItemLink
                    item={manageNavItem}
                    isActive={isNavItemActive(manageNavItem.href, pathname)}
                  />
                </li>
              </ul>
            </li>
          )}

          {/* ログアウトボタン（最下部） */}
          <li className="mt-auto">
            <Link
              href="/auth/signout"
              className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-[var(--color-text-secondary)] hover:text-[var(--btn-danger-bg)] hover:bg-[var(--aio-danger-muted)]"
            >
              <ArrowRightOnRectangleIcon
                className="h-6 w-6 shrink-0 text-[var(--color-text-tertiary)] group-hover:text-[var(--btn-danger-bg)]"
                aria-hidden="true"
              />
              ログアウト
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
