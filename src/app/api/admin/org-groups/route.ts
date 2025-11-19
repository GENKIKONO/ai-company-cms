import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { requireAdminPermission } from '@/lib/auth/server';
import { logger } from '@/lib/log';
import { isUserAdminOfOrg } from '@/lib/utils/org-permissions';
import { z } from 'zod';

// Validation schemas
const createGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  owner_organization_id: z.string().uuid()
});

export async function GET(request: NextRequest) {
  try {
    // Admin permission check (existing pattern)
    await requireAdminPermission();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const search = url.searchParams.get('search');

    let query = supabaseAdmin
      .from('organization_groups')
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        owner_organization:organizations!organization_groups_owner_org_id_fkey(
          id,
          name,
          company_name
        ),
        member_count:org_group_members(count)
      `);

    // Apply search filter if provided
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: groups, error, count } = await query;

    if (error) {
      logger.error('Error fetching organization groups', {
        component: 'org-groups-api',
        operation: 'list',
        error: error.message
      });
      return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
    }

    logger.info('Organization groups fetched successfully', {
      component: 'org-groups-api',
      operation: 'list',
      count: groups?.length || 0,
      page,
      search
    });

    return NextResponse.json({
      data: groups,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    logger.error('Unexpected error in GET org-groups', {
      component: 'org-groups-api',
      operation: 'list',
      error: error.message
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin permission check
    await requireAdminPermission();

    const body = await request.json();
    
    // Validate request body
    const validation = createGroupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: validation.error.flatten()
      }, { status: 400 });
    }

    const { name, description, owner_organization_id } = validation.data;

    // Get current user from auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is admin of the owner organization
    const isOwnerAdmin = await isUserAdminOfOrg(owner_organization_id, user.id);
    if (!isOwnerAdmin) {
      logger.warn('User attempted to create group for organization without admin access', {
        component: 'org-groups-api',
        operation: 'create',
        userId: user.id,
        ownerOrgId: owner_organization_id
      });
      return NextResponse.json({ 
        error: 'You must be an admin of the owner organization to create a group' 
      }, { status: 403 });
    }

    // Verify owner organization exists
    const { data: ownerOrg, error: ownerError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, company_name')
      .eq('id', owner_organization_id)
      .single();

    if (ownerError || !ownerOrg) {
      return NextResponse.json({ error: 'Owner organization not found' }, { status: 404 });
    }

    // Create the group
    const { data: group, error } = await supabaseAdmin
      .from('organization_groups')
      .insert({
        name,
        description,
        owner_organization_id: owner_organization_id
      })
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        owner_organization:organizations!organization_groups_owner_org_id_fkey(
          id,
          name,
          company_name
        )
      `)
      .single();

    if (error) {
      logger.error('Error creating organization group', {
        component: 'org-groups-api',
        operation: 'create',
        error: error.message,
        groupName: name,
        ownerOrgId: owner_organization_id
      });
      
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ 
          error: 'Group name already exists for this organization' 
        }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
    }

    // Add owner organization as admin member
    const { error: memberError } = await supabaseAdmin
      .from('org_group_members')
      .insert({
        group_id: group.id,
        organization_id: owner_organization_id,
        role: 'admin',
        added_by: owner_organization_id
      });

    if (memberError) {
      logger.error('Error adding owner as group member', {
        component: 'org-groups-api',
        operation: 'create',
        error: memberError.message,
        groupId: group.id,
        ownerOrgId: owner_organization_id
      });
      
      // Clean up - delete the group since we couldn't add the owner
      await supabaseAdmin
        .from('organization_groups')
        .delete()
        .eq('id', group.id);
        
      return NextResponse.json({ 
        error: 'Failed to add owner to group' 
      }, { status: 500 });
    }

    logger.info('Organization group created successfully', {
      component: 'org-groups-api',
      operation: 'create',
      groupId: group.id,
      groupName: name,
      ownerOrgId: owner_organization_id,
      userId: user.id
    });

    return NextResponse.json({ data: group }, { status: 201 });

  } catch (error: any) {
    logger.error('Unexpected error in POST org-groups', {
      component: 'org-groups-api',
      operation: 'create',
      error: error.message
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}