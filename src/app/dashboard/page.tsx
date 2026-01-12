'use client';

/**
 * /dashboard ルートページ
 *
 * NOTE: [CORE_ARCHITECTURE] DashboardPageShell 経由で統一管理
 * - 認証・権限・組織チェックは Shell が担当
 * - 拡張ポイント（onEmptyOrganization, onPermissionError, onSystemError）でカスタムUIを提供
 *
 * NOTE: 'use client' が必要な理由
 * - onEmptyOrganization等のコールバック関数をDashboardPageShell（クライアントコンポーネント）に渡すため
 * - Next.js 13+ではサーバーコンポーネントからクライアントコンポーネントに関数を渡せない
 */

import {
  DashboardPageShell,
  type DashboardPageContext,
} from '@/components/dashboard/DashboardPageShell';
import DashboardMain from './components/DashboardMain';
import { EmptyOrganizationUI } from './components/EmptyOrganizationUI';
import { PermissionErrorUI } from './components/PermissionErrorUI';
import { SystemErrorUI } from './components/SystemErrorUI';

// NOTE: 'use client' コンポーネントではdynamic/fetchCache/revalidateは使用不可
// 認証チェックはDashboardPageShellとmiddlewareで担当

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
