import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { requireAdminPermission } from '@/lib/auth/server';
import { logger } from '@/lib/log';
import { isUserAdminOfOrg } from '@/lib/utils/org-permissions';
import { z } from 'zod';

// Validation schemas
const addMemberSchema = z.object({
  organization_id: z.string().uuid(),
  role: z.enum(['member', 'admin']).default('member')
});

const removeMemberSchema = z.object({
  organization_id: z.string().uuid()
});

// Helper function to check if user is owner of the group
async function isGroupOwner(groupId: string, userId: string): Promise<boolean> {
  try {
    const { data: group, error } = await supabaseAdmin
      .from('organization_groups')
      .select('owner_org_id')
      .eq('id', groupId)
      .single();

    if (error || !group) {
      return false;
    }

    return await isUserAdminOfOrg(group.owner_org_id, userId);
  } catch (error: any) {
    logger.error('Error checking group ownership', {
      component: 'org-group-members-api',
      groupId,
      userId,
      error: error.message
    });
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    // Admin permission check
    await requireAdminPermission();

    const { groupId } = params;
    const body = await request.json();

    // Validate request body
    const validation = addMemberSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: validation.error.flatten()
      }, { status: 400 });
    }

    const { organization_id, role } = validation.data;

    // Get current user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is owner of the group (only owner can add members)
    const isOwner = await isGroupOwner(groupId, user.id);
    if (!isOwner) {
      logger.warn('User attempted to add member without ownership', {
        component: 'org-group-members-api',
        operation: 'add',
        groupId,
        orgId: organization_id,
        userId: user.id
      });
      return NextResponse.json({ 
        error: 'Only the owner organization admin can add members' 
      }, { status: 403 });
    }

    // Verify group exists
    const { data: group, error: groupError } = await supabaseAdmin
      .from('organization_groups')
      .select('id, name, owner_org_id')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Verify organization exists
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, company_name')
      .eq('id', organization_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if organization is already a member
    const { data: existingMember } = await supabaseAdmin
      .from('org_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('org_id', organization_id)
      .single();

    if (existingMember) {
      return NextResponse.json({ 
        error: 'Organization is already a member of this group' 
      }, { status: 409 });
    }

    // Add member
    const { data: member, error } = await supabaseAdmin
      .from('org_group_members')
      .insert({
        group_id: groupId,
        org_id: organization_id,
        role,
        added_by: group.owner_org_id
      })
      .select(`
        id,
        role,
        added_at,
        organization:organizations!org_group_members_org_id_fkey(
          id,
          name,
          company_name
        ),
        added_by_org:organizations!org_group_members_added_by_fkey(
          id,
          name,
          company_name
        )
      `)
      .single();

    if (error) {
      logger.error('Error adding member to organization group', {
        component: 'org-group-members-api',
        operation: 'add',
        groupId,
        orgId: organization_id,
        error: error.message
      });
      return NextResponse.json({ error: 'Failed to add organization to group' }, { status: 500 });
    }

    logger.info('Member added to organization group successfully', {
      component: 'org-group-members-api',
      operation: 'add',
      groupId,
      groupName: group.name,
      orgId: organization_id,
      orgName: org.name || org.company_name,
      role,
      userId: user.id
    });

    return NextResponse.json({ data: member }, { status: 201 });

  } catch (error: any) {
    logger.error('Unexpected error in POST org-group members', {
      component: 'org-group-members-api',
      operation: 'add',
      groupId: params.groupId,
      error: error.message
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    // Admin permission check
    await requireAdminPermission();

    const { groupId } = params;
    const body = await request.json();

    // Validate request body
    const validation = removeMemberSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: validation.error.flatten()
      }, { status: 400 });
    }

    const { organization_id } = validation.data;

    // Get current user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is owner of the group OR admin of the organization being removed
    const isOwner = await isGroupOwner(groupId, user.id);
    const isOrgAdmin = await isUserAdminOfOrg(organization_id, user.id);
    
    if (!isOwner && !isOrgAdmin) {
      logger.warn('User attempted to remove member without permission', {
        component: 'org-group-members-api',
        operation: 'remove',
        groupId,
        orgId: organization_id,
        userId: user.id
      });
      return NextResponse.json({ 
        error: 'You must be the group owner or admin of the organization to remove it' 
      }, { status: 403 });
    }

    // Get group info
    const { data: group, error: groupError } = await supabaseAdmin
      .from('organization_groups')
      .select('name, owner_org_id')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Prevent removing the owner organization
    if (organization_id === group.owner_org_id) {
      return NextResponse.json({ 
        error: 'Cannot remove the owner organization from the group' 
      }, { status: 403 });
    }

    // Get member info before deletion
    const { data: member } = await supabaseAdmin
      .from('org_group_members')
      .select(`
        id,
        role,
        organization:organizations!org_group_members_org_id_fkey(
          id,
          name,
          company_name
        )
      `)
      .eq('group_id', groupId)
      .eq('org_id', organization_id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Remove member
    const { error } = await supabaseAdmin
      .from('org_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('org_id', organization_id);

    if (error) {
      logger.error('Error removing member from organization group', {
        component: 'org-group-members-api',
        operation: 'remove',
        groupId,
        orgId: organization_id,
        error: error.message
      });
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
    }

    logger.info('Member removed from organization group successfully', {
      component: 'org-group-members-api',
      operation: 'remove',
      groupId,
      groupName: group.name,
      orgId: organization_id,
      orgName: member.organization?.name || member.organization?.company_name,
      role: member.role,
      userId: user.id
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Member removed successfully' 
    });

  } catch (error: any) {
    logger.error('Unexpected error in DELETE org-group member', {
      component: 'org-group-members-api',
      operation: 'remove',
      groupId: params.groupId,
      error: error.message
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}