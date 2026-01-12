/**
 * Q&A統計ダッシュボード
 *
 * NOTE: [CORE_ARCHITECTURE] AdminPageShell 経由で統一管理
 * - 認証・site_admin権限チェックは Shell が担当
 */

import { Metadata } from 'next';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import QAStatsContent from './QAStatsContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Q&A統計 - AIOHub Admin',
  description: 'Q&Aの閲覧・注目度統計ダッシュボード',
};

export default async function QAStatsPage() {
  return (
    <AdminPageShell pageTitle="Q&A統計">
      <QAStatsContent />
    </AdminPageShell>
  );
}
