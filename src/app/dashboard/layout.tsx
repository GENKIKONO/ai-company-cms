export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getServerUserWithStatus } from '@/lib/auth/server';
import { getUserOrganizations } from '@/lib/server/organizations';
import { isSiteAdmin } from '@/lib/core/auth-state';
import { DashboardLayoutContent } from '@/components/dashboard/DashboardLayoutContent';
import type { AccountStatus } from '@/lib/auth/account-status-guard';

/**
 * Dashboard Layout with Server Gate
 *
 * Layout Boundary: Dashboard shell with sidebar.
 * - Public header/footer: NOT rendered (handled by (public) route group)
 * - Sidebar: ALWAYS rendered for all /dashboard/** routes
 *
 * Auth Gates:
 * 1. User session exists
 * 2. Account status (not deleted)
 * 3. Organization membership (site_admin exempt)
 *
 * See: docs/architecture/boundaries.md
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate 1: Auth check
  const userProfile = await getServerUserWithStatus();

  if (!userProfile) {
    redirect('/auth/login');
  }

  // Gate 2: Account status check
  const accountStatus: AccountStatus = userProfile.accountStatus;

  if (accountStatus === 'deleted') {
    redirect('/auth/login');
  }

  // Gate 3: Organization membership (site_admin exempt)
  const isAdmin = await isSiteAdmin();

  if (!isAdmin) {
    const userOrgs = await getUserOrganizations(userProfile.id);

    if (userOrgs.length === 0) {
      redirect('/onboarding/organization');
    }
  }

  // Render: Dashboard layout with sidebar (no CSS hacks needed)
  return (
    <DashboardLayoutContent accountStatus={accountStatus} canSeeAdminNav={isAdmin}>
      {children}
    </DashboardLayoutContent>
  );
}