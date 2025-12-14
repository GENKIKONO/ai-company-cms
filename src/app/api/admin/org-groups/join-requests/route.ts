import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { requireAdminPermission } from '@/lib/auth/server';
import { logger } from '@/lib/log';
import { isUserAdminOfOrg, getUserOrganizations } from '@/lib/utils/org-permissions';
import { z } from 'zod';

// Validation schemas
const createJoinRequestSchema = z.object({
  inviteCode: z.string().min(1),
  organizationId: z.string().uuid(),
  reason: z.string().max(1000).optional().nullable()
});

export async function GET(request: NextRequest) {
  try {
    // Admin permission check
    await requireAdminPermission();

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';
    const groupId = url.searchParams.get('groupId');

    // Get current user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Build query
    // TODO: [SUPABASE_TYPE_FOLLOWUP] org_group_join_requests テーブルの型定義を Supabase client に追加
    let query = (supabaseAdmin as any)
      .from('org_group_join_requests')
      .select(`
        id,
        group_id,
        organization_id,
        status,
        invite_code,
        requested_by,
        reason,
        decision_note,
        decided_by,
        decided_at,
        created_at,
        updated_at,
        group:organization_groups!org_group_join_requests_group_id_fkey(
          id,
          name,
          owner_organization_id,
          owner_organization:organizations!organization_groups_owner_org_id_fkey(
            id,
            name,
            company_name
          )
        ),
        organization:organizations!org_group_join_requests_organization_id_fkey(
          id,
          name,
          company_name
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data: allRequests, error } = await query;

    if (error) {
      logger.error('Error fetching join requests', {
        component: 'join-requests-api',
        operation: 'list',
        error: error.message
      });
      return NextResponse.json({ error: 'Failed to fetch join requests' }, { status: 500 });
    }

    // Filter requests based on user permissions
    const userOrganizations = await getUserOrganizations(user.id);
    const userAdminOrgIds = userOrganizations
      .filter(org => org.role === 'admin' || org.role === 'owner')
      .map(org => org.organization_id);

    // Check system admin role
    // TODO: [SUPABASE_TYPE_FOLLOWUP] profiles テーブルの型定義を Supabase client に追加
    const { data: profile, error: profileError } = await (supabaseAdmin as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      logger.error('Error fetching user profile', {
        component: 'join-requests-api',
        operation: 'list',
        error: profileError.message
      });
      return NextResponse.json({ error: 'Failed to check user permissions' }, { status: 500 });
    }

    const isSystemAdmin = profile?.role === 'admin';

    // Filter visible requests
    const visibleRequests = (allRequests || []).filter(request => {
      if (!request.group) return false;
      
      // Handle group data which might be array or object
      const group = Array.isArray(request.group) 
        ? request.group[0] 
        : request.group;
      
      if (!group) return false;
      
      // System admin can see all
      if (isSystemAdmin) return true;
      
      // Group owner admins can see requests for their groups
      return userAdminOrgIds.includes(group.owner_organization_id);
    });

    logger.info('Join requests retrieved successfully', {
      component: 'join-requests-api',
      operation: 'list',
      status,
      groupId,
      totalRequests: visibleRequests.length,
      userId: user.id,
      isSystemAdmin
    });

    return NextResponse.json({ data: visibleRequests });

  } catch (error: any) {
    logger.error('Unexpected error in GET join requests', {
      component: 'join-requests-api',
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
    const validation = createJoinRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: validation.error.flatten()
      }, { status: 400 });
    }

    const { inviteCode, organizationId, reason } = validation.data;

    // Get current user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is admin of the organization
    const isOrgAdmin = await isUserAdminOfOrg(organizationId, user.id);
    if (!isOrgAdmin) {
      logger.warn('User attempted to create join request for organization without admin access', {
        component: 'join-requests-api',
        operation: 'create',
        organizationId,
        userId: user.id
      });
      return NextResponse.json({ 
        error: 'You must be an admin of the organization to create a join request' 
      }, { status: 403 });
    }

    // Verify and validate invite code
    // TODO: [SUPABASE_TYPE_FOLLOWUP] org_group_invites テーブルの型定義を Supabase client に追加
    const { data: invite, error: inviteError } = await (supabaseAdmin as any)
      .from('org_group_invites')
      .select(`
        id,
        group_id,
        code,
        expires_at,
        max_uses,
        used_count,
        revoked_at
      `)
      .eq('code', inviteCode)
      .maybeSingle();

    if (inviteError) {
      logger.error('Error fetching invite code', {
        component: 'join-requests-api',
        operation: 'create',
        error: inviteError.message
      });
      return NextResponse.json({ error: 'Failed to validate invite code' }, { status: 500 });
    }

    if (!invite) {
      logger.warn('Invalid invite code used for join request', {
        component: 'join-requests-api',
        operation: 'create',
        inviteCode: inviteCode.substring(0, 4) + '...',
        userId: user.id
      });
      return NextResponse.json({ 
        error: 'Invalid invite code' 
      }, { status: 400 });
    }

    // Validate invite conditions
    if (invite.revoked_at) {
      return NextResponse.json({ 
        error: 'This invite code has been revoked' 
      }, { status: 400 });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'This invite code has expired' 
      }, { status: 400 });
    }

    if (invite.max_uses && invite.used_count >= invite.max_uses) {
      return NextResponse.json({ 
        error: 'This invite code has reached its usage limit' 
      }, { status: 400 });
    }

    // Check if organization is already a member
    const { data: existingMember, error: memberError } = await supabaseAdmin
      .from('org_group_members')
      .select('id')
      .eq('group_id', invite.group_id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (memberError) {
      logger.error('Error checking existing membership', {
        component: 'join-requests-api',
        operation: 'create',
        error: memberError.message
      });
      return NextResponse.json({ error: 'Failed to check membership' }, { status: 500 });
    }

    if (existingMember) {
      return NextResponse.json({ 
        error: 'Organization is already a member of this group' 
      }, { status: 409 });
    }

    // Check for existing pending request
    const { data: existingRequest, error: requestError } = await supabaseAdmin
      .from('org_group_join_requests')
      .select('id')
      .eq('group_id', invite.group_id)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .maybeSingle();

    if (requestError) {
      logger.error('Error checking existing request', {
        component: 'join-requests-api',
        operation: 'create',
        error: requestError.message
      });
      return NextResponse.json({ error: 'Failed to check existing request' }, { status: 500 });
    }

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'A pending join request already exists for this group' 
      }, { status: 409 });
    }

    // Create join request
    // TODO: [SUPABASE_TYPE_FOLLOWUP] org_group_join_requests テーブルの型定義を Supabase client に追加
    const { data: joinRequest, error } = await (supabaseAdmin as any)
      .from('org_group_join_requests')
      .insert({
        group_id: invite.group_id,
        organization_id: organizationId,
        status: 'pending',
        invite_code: inviteCode,
        requested_by: user.id,
        reason: reason || null
      })
      .select(`
        id,
        group_id,
        organization_id,
        status,
        invite_code,
        requested_by,
        reason,
        created_at,
        group:organization_groups!org_group_join_requests_group_id_fkey(
          id,
          name,
          owner_organization:organizations!organization_groups_owner_org_id_fkey(
            id,
            name,
            company_name
          )
        ),
        organization:organizations!org_group_join_requests_organization_id_fkey(
          id,
          name,
          company_name
        )
      `)
      .maybeSingle();

    if (error) {
      logger.error('Error creating join request', {
        component: 'join-requests-api',
        operation: 'create',
        groupId: invite.group_id,
        organizationId,
        error: error.message
      });
      return NextResponse.json({ error: 'Failed to create join request' }, { status: 500 });
    }

    if (!joinRequest) {
      logger.error('Join request creation succeeded but no data returned', {
        component: 'join-requests-api',
        operation: 'create',
        groupId: invite.group_id,
        organizationId
      });
      return NextResponse.json({ error: 'Failed to create join request' }, { status: 500 });
    }

    logger.info('Join request created successfully', {
      component: 'join-requests-api',
      operation: 'create',
      requestId: joinRequest.id,
      groupId: invite.group_id,
      organizationId,
      inviteCode: inviteCode.substring(0, 4) + '...',
      userId: user.id
    });

    return NextResponse.json({ data: joinRequest }, { status: 201 });

  } catch (error: any) {
    logger.error('Unexpected error in POST join request', {
      component: 'join-requests-api',
      operation: 'create',
      error: error.message
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}