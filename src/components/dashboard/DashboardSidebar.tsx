'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOrganization } from '@/lib/hooks/useOrganization';
import {
  HomeIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  DocumentPlusIcon,
  BuildingOfficeIcon,
  ChatBubbleBottomCenterTextIcon,
  CodeBracketIcon,
  CreditCardIcon,
  FolderIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  ClockIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

const getNavigation = (organization: any) => {
  const baseNavigation = [
    { name: 'ダッシュボード', href: '/dashboard', icon: HomeIcon },
    { name: 'アクティビティ', href: '/dashboard/activity', icon: ClockIcon },
    { name: '記事管理', href: '/dashboard/posts', icon: DocumentTextIcon },
    { name: 'サービス管理', href: '/dashboard/services', icon: BriefcaseIcon },
    { name: '事例管理', href: '/dashboard/case-studies', icon: UserGroupIcon },
    { name: 'FAQ管理', href: '/dashboard/faqs', icon: QuestionMarkCircleIcon },
    { name: '営業資料', href: '/dashboard/materials', icon: FolderIcon },
    { name: '企業専用AIチャット', href: '/dashboard/org-ai-chat', icon: DocumentPlusIcon },
    { name: 'AIインタビュー', href: '/dashboard/interview', icon: ChatBubbleBottomCenterTextIcon },
    { name: 'Q&A統計', href: '/dashboard/qna-stats', icon: ChartBarIcon },
    { name: '分析レポート', href: '/dashboard/analytics/ai-seo-report', icon: ChartBarIcon },
    { name: 'AIレポート', href: '/dashboard/ai-reports', icon: DocumentChartBarIcon },
    { name: 'AI引用', href: '/dashboard/ai-citations', icon: LinkIcon },
    { name: '埋め込み設定', href: '/dashboard/embed', icon: CodeBracketIcon },
    { name: '請求管理', href: '/dashboard/billing', icon: CreditCardIcon },
    { name: 'ヘルプ', href: '/dashboard/help', icon: ChatBubbleLeftRightIcon },
    { name: '設定', href: '/dashboard/settings', icon: Cog6ToothIcon },
    { name: 'アカウント', href: '/account', icon: UserCircleIcon },
  ];

  // Add organization management link if organization exists
  if (organization) {
    const orgNavigation = [
      { name: 'ダッシュボード', href: '/dashboard', icon: HomeIcon },
      { name: 'アクティビティ', href: '/dashboard/activity', icon: ClockIcon },
      { name: '組織設定', href: `/organizations/${organization.id}`, icon: BuildingOfficeIcon },
      { name: '記事管理', href: '/dashboard/posts', icon: DocumentTextIcon },
      { name: 'サービス管理', href: '/dashboard/services', icon: BriefcaseIcon },
      { name: '事例管理', href: '/dashboard/case-studies', icon: UserGroupIcon },
      { name: 'FAQ管理', href: '/dashboard/faqs', icon: QuestionMarkCircleIcon },
      { name: '営業資料', href: '/dashboard/materials', icon: FolderIcon },
      { name: '企業専用AIチャット', href: '/dashboard/org-ai-chat', icon: DocumentPlusIcon },
      { name: 'AIインタビュー', href: '/dashboard/interview', icon: ChatBubbleBottomCenterTextIcon },
      { name: 'Q&A統計', href: '/dashboard/qna-stats', icon: ChartBarIcon },
      { name: '分析レポート', href: '/dashboard/analytics/ai-seo-report', icon: ChartBarIcon },
      { name: 'AIレポート', href: '/dashboard/ai-reports', icon: DocumentChartBarIcon },
      { name: 'AI引用', href: '/dashboard/ai-citations', icon: LinkIcon },
      { name: '埋め込み設定', href: '/dashboard/embed', icon: CodeBracketIcon },
      { name: '請求管理', href: '/dashboard/billing', icon: CreditCardIcon },
      { name: 'ヘルプ', href: '/dashboard/help', icon: ChatBubbleLeftRightIcon },
      { name: '設定', href: '/dashboard/settings', icon: Cog6ToothIcon },
      { name: 'アカウント', href: '/account', icon: UserCircleIcon },
    ];
    return orgNavigation;
  }

  return baseNavigation;
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface DashboardSidebarProps {
  canSeeAdminNav?: boolean;
}

export function DashboardSidebar({ canSeeAdminNav = false }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { organization } = useOrganization();
  const navigation = getNavigation(organization);

  // Admin navigation item (only visible to site admins)
  const adminNavItem = { name: '管理', href: '/dashboard/admin', icon: ShieldCheckIcon };

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200" data-testid="dashboard-sidenav">
      <div className="flex h-16 shrink-0 items-center">
        <Link href="/dashboard" className="text-xl font-bold text-[var(--aio-primary)]">
          AIO Hub
        </Link>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={classNames(
                        isActive
                          ? 'bg-[var(--aio-primary)] text-white'
                          : 'text-gray-700 hover:text-[var(--aio-primary)] hover:bg-gray-50',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                      )}
                    >
                      <item.icon
                        className={classNames(
                          isActive ? 'text-white' : 'text-gray-400 group-hover:text-[var(--aio-primary)]',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
              {/* Admin navigation - only rendered for site admins */}
              {canSeeAdminNav && (() => {
                const isActive = pathname === adminNavItem.href || pathname.startsWith(adminNavItem.href + '/');
                return (
                  <li key={adminNavItem.name}>
                    <Link
                      href={adminNavItem.href}
                      className={classNames(
                        isActive
                          ? 'bg-[var(--aio-primary)] text-white'
                          : 'text-gray-700 hover:text-[var(--aio-primary)] hover:bg-gray-50',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                      )}
                    >
                      <adminNavItem.icon
                        className={classNames(
                          isActive ? 'text-white' : 'text-gray-400 group-hover:text-[var(--aio-primary)]',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {adminNavItem.name}
                    </Link>
                  </li>
                );
              })()}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}