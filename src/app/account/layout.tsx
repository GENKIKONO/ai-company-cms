/**
 * Account Layout
 *
 * Layout Boundary: Account shell with sidebar.
 * - Public header/footer: NOT rendered
 * - AccountSidebar: ALWAYS rendered for all /account/** routes
 *
 * Auth Strategy:
 * - Middleware handles primary auth check and redirects
 * - Layout provides UI shell only (no redundant auth check)
 * - UserShell handles page-level auth state management
 *
 * NOTE: Account領域はuser主体（個人設定）
 * Dashboard領域（org主体）とは分離されている
 *
 * See: docs/core-architecture.md
 */

import { AccountLayoutContent } from '@/components/account/AccountLayoutContent';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccountLayoutContent>
      {children}
    </AccountLayoutContent>
  );
}
