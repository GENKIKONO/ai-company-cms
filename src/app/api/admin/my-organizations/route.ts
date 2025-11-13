import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { requireAdminPermission } from '@/lib/auth/server';
import { logger } from '@/lib/log';

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
    const userOrganizations = (organizations || [])
      .filter(item => item.organization) // Ensure organization data exists
      .map(item => ({
        id: item.organization.id,
        name: item.organization.name || item.organization.company_name || item.organization.id,
        role: item.role
      }));

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