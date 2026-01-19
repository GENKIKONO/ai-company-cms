import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { logger } from '@/lib/log';
import { handleApiError, handleDatabaseError, unauthorizedError } from '@/lib/api/error-responses';

type OrganizationData = {
  id: string;
  name: string | null;
  company_name: string | null;
};

type OrganizationMemberWithOrg = {
  organization_id: string;
  role: string;
  organization: OrganizationData;
};

type MyOrganization = {
  id: string;
  name: string;
  role: string;
};

export async function GET(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const userId = authResult.userId;

    // Get user's organizations where they have admin or owner role
    // Note: supabaseAdmin is already untyped (SupabaseClient<any>) so no cast needed
    const { data: organizations, error } = await supabaseAdmin
      .from('organization_members')
      .select(`
        organization_id,
        role,
        organization:organizations!organization_members_organization_id_fkey(
          id,
          name,
          company_name
        )
      `)
      .eq('user_id', userId)
      .in('role', ['admin', 'owner']);

    if (error) {
      logger.error('Error fetching user organizations', {
        component: 'my-organizations-api',
        userId,
        error: error.message
      });
      return handleDatabaseError(error);
    }

    // Transform data for response
    const userOrganizations: MyOrganization[] = (organizations || [])
      .filter(item => item && item.organization)
      .map(item => {
        // Handle case where organization might be an array (due to Supabase joins)
        const org = Array.isArray(item.organization) ? item.organization[0] : item.organization;

        if (!org) return null;

        return {
          id: org.id,
          name: org.name || org.company_name || org.id,
          role: item.role
        };
      })
      .filter((item): item is MyOrganization => item !== null);

    logger.info('User organizations retrieved successfully', {
      component: 'my-organizations-api',
      userId,
      organizationCount: userOrganizations.length
    });

    return NextResponse.json({ data: userOrganizations });

  } catch (error) {
    logger.error('Unexpected error in GET my organizations', {
      component: 'my-organizations-api',
      error: error instanceof Error ? error.message : String(error)
    });
    return handleApiError(error);
  }
}