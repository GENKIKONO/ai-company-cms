import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { requireAdminPermission } from '@/lib/auth/server';
import { logger } from '@/lib/log';

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
  try {
    // Admin permission check
    await requireAdminPermission();

    // Get current user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user's organizations where they have admin or owner role
    // TODO: [SUPABASE_TYPE_FOLLOWUP] organization_members テーブルの型定義を Supabase client に追加
    const { data: organizations, error } = await (supabaseAdmin as any)
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
      .eq('user_id', user.id)
      .in('role', ['admin', 'owner']);

    if (error) {
      logger.error('Error fetching user organizations', {
        component: 'my-organizations-api',
        userId: user.id,
        error: error.message
      });
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
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
      userId: user.id,
      organizationCount: userOrganizations.length
    });

    return NextResponse.json({ data: userOrganizations });

  } catch (error: any) {
    logger.error('Unexpected error in GET my organizations', {
      component: 'my-organizations-api',
      error: error.message
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}