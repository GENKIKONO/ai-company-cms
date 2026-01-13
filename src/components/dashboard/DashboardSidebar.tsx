'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  dashboardNavGroups,
  conditionalNavItems,
  isNavItemActive,
  getActiveCategoryId,
  getNavGroupById,
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
 * カテゴリボタンコンポーネント
 */
function CategoryButton({
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
          ? 'bg-[var(--aio-primary)] text-white'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--aio-primary)] hover:bg-[var(--aio-surface)]',
        'group flex w-full items-center justify-between gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
      )}
    >
      <span className="flex items-center gap-x-3">
        <Icon
          className={classNames(
            isActive ? 'text-white' : 'text-[var(--color-icon-muted)] group-hover:text-[var(--aio-primary)]',
            'h-6 w-6 shrink-0'
          )}
          aria-hidden="true"
        />
        {group.label}
      </span>
      <ChevronRightIcon
        className={classNames(
          isActive ? 'text-white' : 'text-[var(--color-icon-muted)]',
          'h-4 w-4 shrink-0'
        )}
        aria-hidden="true"
      />
    </button>
  );
}

/**
 * 子項目リストコンポーネント
 */
function SubItemsList({
  group,
  pathname,
  onBack,
}: {
  group: NavGroup;
  pathname: string;
  onBack: () => void;
}) {
  return (
    <div className="space-y-2">
      {/* 戻るボタン */}
      <button
        type="button"
        onClick={onBack}
        className="group flex w-full items-center gap-x-2 rounded-md p-2 text-sm leading-6 font-semibold text-[var(--color-text-tertiary)] hover:text-[var(--aio-primary)] hover:bg-[var(--aio-surface)]"
      >
        <ChevronLeftIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
        Categories
      </button>

      {/* カテゴリラベル */}
      <div className="text-xs font-semibold leading-6 text-[var(--color-text-tertiary)] uppercase tracking-wider px-2">
        {group.label}
      </div>

      {/* 子項目リスト */}
      <ul role="list" className="space-y-1">
        {group.items.map((item) => {
          const isActive = isNavItemActive(item.href, pathname);
          return (
            <li key={item.name}>
              <NavItemLink item={item} isActive={isActive} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DashboardSidebar({ canSeeAdminNav = false }: DashboardSidebarProps) {
  const pathname = usePathname();

  // 選択されたカテゴリID（null = カテゴリ一覧表示）
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // deep link時にカテゴリを自動判定
  useEffect(() => {
    const activeCategoryId = getActiveCategoryId(pathname);
    if (activeCategoryId) {
      setSelectedCategoryId(activeCategoryId);
    }
  }, [pathname]);

  // 条件付きナビ項目（org manager用）
  const manageNavItem = conditionalNavItems.find((item) => item.condition === 'orgManager');

  // 選択されたカテゴリのグループを取得
  const selectedGroup = selectedCategoryId ? getNavGroupById(selectedCategoryId) : null;

  // Admin カテゴリの特別処理
  const isAdminSelected = selectedCategoryId === 'admin';

  return (
    <div
      className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-[var(--dashboard-card-border)]"
      data-testid="dashboard-sidenav"
    >
      <div className="flex h-16 shrink-0 items-center">
        <Link href="/" className="text-xl font-bold text-[var(--aio-primary)]">
          AIO Hub
        </Link>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-2">
          {/* カテゴリ一覧 or 子項目表示 */}
          {selectedGroup || isAdminSelected ? (
            // 子項目表示
            <li>
              {isAdminSelected && manageNavItem ? (
                <div className="space-y-2">
                  {/* 戻るボタン */}
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(null)}
                    className="group flex w-full items-center gap-x-2 rounded-md p-2 text-sm leading-6 font-semibold text-[var(--color-text-tertiary)] hover:text-[var(--aio-primary)] hover:bg-[var(--aio-surface)]"
                  >
                    <ChevronLeftIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Categories
                  </button>
                  <div className="text-xs font-semibold leading-6 text-[var(--color-text-tertiary)] uppercase tracking-wider px-2">
                    Admin
                  </div>
                  <ul role="list" className="space-y-1">
                    <li>
                      <NavItemLink
                        item={manageNavItem}
                        isActive={isNavItemActive(manageNavItem.href, pathname)}
                      />
                    </li>
                  </ul>
                </div>
              ) : selectedGroup ? (
                <SubItemsList
                  group={selectedGroup}
                  pathname={pathname}
                  onBack={() => setSelectedCategoryId(null)}
                />
              ) : null}
            </li>
          ) : (
            // カテゴリ一覧表示
            <>
              {dashboardNavGroups.map((group) => {
                const isActive = getActiveCategoryId(pathname) === group.id;
                return (
                  <li key={group.id}>
                    <CategoryButton
                      group={group}
                      isActive={isActive}
                      onClick={() => setSelectedCategoryId(group.id)}
                    />
                  </li>
                );
              })}

              {/* 条件付きナビ（org manager用） */}
              {canSeeAdminNav && manageNavItem && (
                <li>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId('admin')}
                    className={classNames(
                      getActiveCategoryId(pathname) === 'admin'
                        ? 'bg-[var(--aio-primary)] text-white'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--aio-primary)] hover:bg-[var(--aio-surface)]',
                      'group flex w-full items-center justify-between gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <span className="flex items-center gap-x-3">
                      <manageNavItem.icon
                        className={classNames(
                          getActiveCategoryId(pathname) === 'admin'
                            ? 'text-white'
                            : 'text-[var(--color-icon-muted)] group-hover:text-[var(--aio-primary)]',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      Admin
                    </span>
                    <ChevronRightIcon
                      className={classNames(
                        getActiveCategoryId(pathname) === 'admin'
                          ? 'text-white'
                          : 'text-[var(--color-icon-muted)]',
                        'h-4 w-4 shrink-0'
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              )}
            </>
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
