import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/adminClient';
import { getUserWithClient } from '@/lib/core/auth-state';
import { requireAdminPermission } from '@/lib/auth/server';
import { logger } from '@/lib/log';
import { isUserAdminOfOrg } from '@/lib/utils/org-permissions';
import { z } from 'zod';

// Validation schema
const updateInviteSchema = z.object({
  revoke: z.boolean().optional(),
  note: z.string().max(500).optional().nullable()
});

// Helper function to check if user is group owner admin
async function isGroupOwnerAdmin(groupId: string, userId: string): Promise<boolean> {
  try {
    const { data: group, error } = await supabaseAdmin
      .from('org_groups')
      .select('owner_organization_id')
      .eq('id', groupId)
      .maybeSingle();

    if (error) {
      return false;
    }

    if (!group) {
      return false;
    }

    return await isUserAdminOfOrg((group as any).owner_organization_id, userId);
  } catch (error: any) {
    logger.error('Error checking group owner admin', {
      component: 'group-invite-manage-api',
      groupId,
      userId,
      error: error.message
    });
    return false;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; inviteId: string }> }
) {
  try {
    // Admin permission check
    await requireAdminPermission();

    const { groupId, inviteId } = await params;
    const body = await request.json();

    // Validate request body
    const validation = updateInviteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: validation.error.flatten()
      }, { status: 400 });
    }

    const { revoke, note } = validation.data;

    // Get current user
    const user = await getUserWithClient(supabaseAdmin);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is group owner admin
    const isAdmin = await isGroupOwnerAdmin(groupId, user.id);
    if (!isAdmin) {
      logger.warn('User attempted to update invite without ownership', {
        component: 'group-invite-manage-api',
        operation: 'update',
        groupId,
        inviteId,
        userId: user.id
      });
      return NextResponse.json({ 
        error: 'You must be an admin of the group owner organization' 
      }, { status: 403 });
    }

    // Verify invite exists and belongs to the group
    const { data: existingInvite, error: existingError } = await supabaseAdmin
      .from('org_group_invites')
      .select('id, group_id')
      .eq('id', inviteId)
      .eq('group_id', groupId)
      .maybeSingle();

    if (existingError) {
      logger.error('Error fetching invite for verification', {
        component: 'group-invite-manage-api',
        operation: 'verify-invite',
        groupId,
        inviteId,
        error: existingError.message
      });
      return NextResponse.json({ error: 'Failed to verify invite' }, { status: 500 });
    }

    if (!existingInvite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (revoke === true) {
      updateData.revoked_at = new Date().toISOString();
    }
    
    if (note !== undefined) {
      updateData.note = note;
    }

    // If no updates requested
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No updates specified' }, { status: 400 });
    }

    // Update invite
    // TODO: [SUPABASE_TYPE_FOLLOWUP] org_group_invites テーブルの型定義を Supabase client に追加
    const { data: invite, error } = await (supabaseAdmin as any)
      .from('org_group_invites')
      .update(updateData)
      .eq('id', inviteId)
      .eq('group_id', groupId)
      .select(`
        id,
        group_id,
        code,
        expires_at,
        max_uses,
        used_count,
        created_by,
        note,
        created_at,
        revoked_at
      `)
      .maybeSingle();

    if (error) {
      logger.error('Error updating group invite', {
        component: 'group-invite-manage-api',
        operation: 'update',
        groupId,
        inviteId,
        error: error.message
      });
      return NextResponse.json({ error: 'Failed to update invite' }, { status: 500 });
    }

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    logger.info('Group invite updated successfully', {
      component: 'group-invite-manage-api',
      operation: 'update',
      groupId,
      inviteId,
      revoked: !!revoke,
      userId: user.id
    });

    return NextResponse.json({ data: invite });

  } catch (error: any) {
    // Get groupId and inviteId from params for error logging
    const { groupId, inviteId } = await params.catch(() => ({ groupId: 'unknown', inviteId: 'unknown' }));
    logger.error('Unexpected error in PATCH group invite', {
      component: 'group-invite-manage-api',
      operation: 'update',
      groupId,
      inviteId,
      error: error.message
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}