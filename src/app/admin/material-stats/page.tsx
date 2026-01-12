/**
 * 営業資料統計ダッシュボード
 *
 * NOTE: [CORE_ARCHITECTURE] AdminPageShell 経由で統一管理
 * - 認証・site_admin権限チェックは Shell が担当
 */

import { Metadata } from 'next';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import MaterialStatsContent from './MaterialStatsContent';

export const metadata: Metadata = {
  title: '営業資料統計 - AIOHub Admin',
  description: '営業資料の閲覧・ダウンロード統計ダッシュボード',
};

export default async function MaterialStatsPage() {
  return (
    <AdminPageShell pageTitle="営業資料統計">
      <MaterialStatsContent />
    </AdminPageShell>
  );
}
