/**
 * 管理コンソール レイアウト
 *
 * Admin領域として、site_admin権限チェックと共通ナビゲーションを提供。
 * モバイル対応のハンバーガーメニュー付き。
 *
 * @see docs/architecture/boundaries.md
 */

export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { isSiteAdmin, getUserServerOptional } from '@/lib/core/auth-state';
import { ManagementConsoleLayoutContent } from './ManagementConsoleLayoutContent';

export default async function ManagementConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 認証・管理者権限をCore正本(isSiteAdmin)で確認
  const [isAdmin, user] = await Promise.all([
    isSiteAdmin(),
    getUserServerOptional(),
  ]);

  if (!user) {
    redirect('/auth/login?redirect=/management-console');
  }

  if (!isAdmin) {
    redirect('/dashboard');
  }

  return (
    <ManagementConsoleLayoutContent userEmail={user.email}>
      {children}
    </ManagementConsoleLayoutContent>
  );
}