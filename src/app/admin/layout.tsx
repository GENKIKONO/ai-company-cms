export const dynamic = 'force-dynamic';

/**
 * Admin Layout with Server Gate
 *
 * Layout Boundary: Admin領域の入場ガード
 * - 認証チェック
 * - site_admin権限チェック
 *
 * NOTE: [CORE_ARCHITECTURE] Admin領域は site_admin のみアクセス可能
 * See: docs/core-architecture.md §3.2
 */

import { redirect } from 'next/navigation';
import { requireUserServer, isSiteAdmin } from '@/lib/core';
import { AdminLayoutContent } from '@/components/admin/AdminLayoutContent';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate 1: Auth check
  try {
    await requireUserServer();
  } catch {
    redirect('/auth/login?redirect=/admin');
  }

  // Gate 2: site_admin check
  const isAdmin = await isSiteAdmin();

  if (!isAdmin) {
    // site_admin でない場合はダッシュボードにリダイレクト
    redirect('/dashboard?error=admin_required');
  }

  // Render: Admin layout with client-side providers
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
