/**
 * /dashboard ルートページ
 *
 * NOTE: [CORE_ARCHITECTURE] DashboardPageShell 経由で統一管理
 * - 認証・権限・組織チェックは Shell が担当
 * - 拡張ポイント（onEmptyOrganization, onPermissionError, onSystemError）でカスタムUIを提供
 */

import {
  DashboardPageShell,
  type DashboardPageContext,
} from '@/components/dashboard/DashboardPageShell';
import DashboardMain from './components/DashboardMain';
import { EmptyOrganizationUI } from './components/EmptyOrganizationUI';
import { PermissionErrorUI } from './components/PermissionErrorUI';
import { SystemErrorUI } from './components/SystemErrorUI';

// 強制的に動的SSRにして、認証状態を毎回評価
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default function DashboardPage() {
  return (
    <DashboardPageShell
      title="ダッシュボード"
      onEmptyOrganization={(ctx: DashboardPageContext) => (
        <EmptyOrganizationUI user={ctx.user} />
      )}
      onPermissionError={(ctx: DashboardPageContext) => (
        <PermissionErrorUI user={ctx.user} />
      )}
      onSystemError={(ctx: DashboardPageContext) => (
        <SystemErrorUI user={ctx.user} requestId={ctx.requestId} />
      )}
    >
      <DashboardMain />
    </DashboardPageShell>
  );
}
