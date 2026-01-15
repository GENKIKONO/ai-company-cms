/**
 * Dashboard Layout
 *
 * Layout Boundary: Dashboard shell with sidebar.
 * - Public header/footer: NOT rendered (handled by (public) route group)
 * - Sidebar: ALWAYS rendered for all /dashboard/** routes
 *
 * Auth Strategy:
 * - Middleware handles primary auth check and redirects
 * - Layout provides UI shell only (no redundant auth check)
 * - DashboardPageShell handles page-level auth state management
 *
 * NOTE: Server-side auth check removed to prevent redirect loops during
 * client-side navigation. Middleware is the single source of truth for auth.
 *
 * See: docs/architecture/boundaries.md
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { DashboardLayoutContent } from '@/components/dashboard/DashboardLayoutContent';
import type { AccountStatus } from '@/lib/auth/account-status-guard';
import { getUserWithClient } from '@/lib/core/auth-state';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get account status for UI display (non-blocking)
  // Auth enforcement is handled by middleware, not here
  let accountStatus: AccountStatus = 'active';
  let isAdmin = false;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Read-only in layout - cookies set by middleware
          },
        },
      }
    );

    const user = await getUserWithClient(supabase);

    if (user) {
      // Get account status (optional - for banner display)
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_status')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.account_status) {
        accountStatus = profile.account_status as AccountStatus;
      }

      // Check if user is site admin (optional - for admin nav)
      const { data: appUser } = await supabase
        .from('v_app_users_compat2')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      isAdmin = appUser?.role === 'admin';
    }
  } catch {
    // Silent fail - middleware handles auth, layout just renders UI
    // Default values (active, not admin) are safe fallbacks
  }

  return (
    <DashboardLayoutContent accountStatus={accountStatus} canSeeAdminNav={isAdmin}>
      {children}
    </DashboardLayoutContent>
  );
}