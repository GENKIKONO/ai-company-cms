/**
 * Account Index Page
 *
 * Account領域のトップページ
 * 主体: user（個人）
 * 責務: 個人設定、プロフィール、通知設定等
 *
 * @note Dashboard（org主体）とは明確に分離
 */

import { UserShell } from '@/components/account';
import Link from 'next/link';
import {
  UserCircleIcon,
  ShieldCheckIcon,
  BellIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

export const metadata = {
  title: 'アカウント設定',
  description: '個人アカウントの設定を管理',
};

const menuItems = [
  {
    href: '/account/profile',
    title: 'プロフィール',
    description: '名前、メールアドレス、アバター等',
    icon: UserCircleIcon,
  },
  {
    href: '/account/security',
    title: 'セキュリティ',
    description: 'パスワード、二要素認証等',
    icon: ShieldCheckIcon,
  },
  {
    href: '/account/notifications',
    title: '通知設定',
    description: 'メール通知、プッシュ通知等',
    icon: BellIcon,
  },
  {
    href: '/dashboard',
    title: '組織ダッシュボード',
    description: '組織の管理画面へ移動',
    icon: BuildingOfficeIcon,
  },
];

export default async function AccountPage() {
  return (
    <UserShell title="アカウント設定">
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="border-b border-[var(--dashboard-card-border)] pb-4">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            アカウント設定
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            個人アカウントの設定を管理します
          </p>
        </div>

        {/* メニュー */}
        <div className="grid gap-4 md:grid-cols-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group block p-6 bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)] rounded-lg shadow-[var(--dashboard-card-shadow)] hover:border-[var(--aio-primary)] hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2 bg-[var(--aio-surface)] rounded-lg group-hover:bg-[var(--aio-primary)]/10 transition-colors">
                  <item.icon className="w-6 h-6 text-[var(--aio-primary)]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--aio-primary)] transition-colors">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </UserShell>
  );
}
