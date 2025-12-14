export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getServerUserWithStatus } from '@/lib/auth/server';
import { DashboardLayoutContent } from '@/components/dashboard/DashboardLayoutContent';
import type { AccountStatus } from '@/lib/auth/account-status-guard';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  // Get user profile with account status
  const userProfile = await getServerUserWithStatus();
  
  // If no user session, redirect to login
  if (!userProfile) {
    redirect('/auth/login');
  }

  const accountStatus: AccountStatus = userProfile.accountStatus;

  // If account is deleted, redirect to login (session should be invalid)
  if (accountStatus === 'deleted') {
    redirect('/auth/login');
  }

  // Render dashboard with account status awareness
  return (
    <DashboardLayoutContent accountStatus={accountStatus}>
      {children}
    </DashboardLayoutContent>
  );
}