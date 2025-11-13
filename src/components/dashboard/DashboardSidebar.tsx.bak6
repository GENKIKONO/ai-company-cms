'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200">
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
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}