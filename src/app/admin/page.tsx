/**
 * Admin Index Page
 * /admin のランディングページ
 *
 * 認証チェックはAdminPageShellで行い、
 * site_admin以外はアクセス拒否される
 */

import { AdminPageShell } from '@/components/admin/AdminPageShell';
import Link from 'next/link';

// Admin管理メニュー
const ADMIN_MENUS = [
  {
    title: 'CMS管理',
    description: 'サイトコンテンツの編集・管理',
    href: '/admin/cms',
    icon: '📝',
  },
  {
    title: 'コンソール',
    description: 'システム管理コンソール',
    href: '/admin/console',
    icon: '🖥️',
  },
  {
    title: 'AI可視性',
    description: 'AI関連の可視性設定',
    href: '/admin/ai-visibility',
    icon: '🤖',
  },
  {
    title: '課金管理',
    description: 'プランと課金の管理',
    href: '/admin/billing',
    icon: '💳',
  },
];

export default async function AdminIndexPage() {
  return (
    <AdminPageShell pageTitle="Admin Index">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--aio-text)]">
            管理者ダッシュボード
          </h1>
          <p className="mt-2 text-[var(--aio-text-muted)]">
            サイト全体の管理機能にアクセスできます
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ADMIN_MENUS.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="block p-6 bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg hover:border-[var(--aio-primary)] transition-colors"
            >
              <div className="text-3xl mb-3">{menu.icon}</div>
              <h2 className="text-lg font-semibold text-[var(--aio-text)]">
                {menu.title}
              </h2>
              <p className="mt-1 text-sm text-[var(--aio-text-muted)]">
                {menu.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </AdminPageShell>
  );
}
