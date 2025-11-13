'use client';

import TabbedDashboard from '@/app/dashboard/components/TabbedDashboard';

interface DashboardClientProps {
  organizationId: string;
  organizationSlug?: string | null;
  organizationName: string;
  isPublished: boolean;
}

export default function DashboardClient({ 
  organizationId, 
  organizationSlug, 
  organizationName, 
  isPublished 
}: DashboardClientProps) {
  return (
    <TabbedDashboard 
      organizationId={organizationId}
      organizationSlug={organizationSlug}
      organizationName={organizationName}
      isPublished={isPublished}
    />
  );
}