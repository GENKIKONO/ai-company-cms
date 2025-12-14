import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { requireAdminPermission } from '@/lib/auth/server';
import { logger } from '@/lib/log';
import { isUserAdminOfOrg } from '@/lib/utils/org-permissions';
import { z } from 'zod';
import { randomBytes } from 'crypto';

// Validation schemas
const createInviteSchema = z.object({
  expiresAt: z.string().datetime().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  customCode: z.string().min(6).max(32).optional().nullable()
});

// Helper function to generate random invite code
function generateInviteCode(): string {
  return randomBytes(8).toString('hex');
}

// Helper function to check if user is group owner admin
async function isGroupOwnerAdmin(groupId: string, userId: string): Promise<{ isAdmin: boolean; ownerOrgId?: string }> {
  try {
    const { data: group, error } = await supabaseAdmin
      .from('organization_groups')
      .select('owner_organization_id')
      .eq('id', groupId)
      .maybeSingle();

    if (error) {
      return { isAdmin: false };
    }

    if (!group) {
      return { isAdmin: false };
    }

    // TODO: [SUPABASE_TYPE_FOLLOWUP] organization_groups テーブルの型定義を Supabase client に追加
    const ownerOrgId = (group as any).owner_organization_id;
    const isAdmin = await isUserAdminOfOrg(ownerOrgId, userId);
    return { isAdmin, ownerOrgId };
  } catch (error: any) {
    logger.error('Error checking group owner admin', {
      component: 'group-invites-api',
      groupId,
      userId,
      error: error.message
    });
    return { isAdmin: false };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    // Admin permission check
    await requireAdminPermission();

    const { groupId } = await params;

    // Get current user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is group owner admin
    const { isAdmin, ownerOrgId } = await isGroupOwnerAdmin(groupId, user.id);
    if (!isAdmin) {
      logger.warn('User attempted to access group invites without ownership', {
        component: 'group-invites-api',
        operation: 'list',
        groupId,
        userId: user.id
      });
      return NextResponse.json({ 
        error: 'You must be an admin of the group owner organization' 
      }, { status: 403 });
    }

    // Verify group exists
    const { data: group, error: groupError } = await supabaseAdmin
      .from('organization_groups')
      .select('id, name')
      .eq('id', groupId)
      .maybeSingle();

    if (groupError) {
      logger.error('Error fetching group', {
        component: 'group-invites-api',
        operation: 'list',
        groupId,
        error: groupError.message
      });
      return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
    }

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get group invites
    const { data: invites, error } = await supabaseAdmin
      .from('org_group_invites')
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
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching group invites', {
        component: 'group-invites-api',
        operation: 'list',
        groupId,
        error: error.message
      });
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
    }

    logger.info('Group invites retrieved successfully', {
      component: 'group-invites-api',
      operation: 'list',
      groupId,
      inviteCount: invites?.length || 0,
      userId: user.id
    });

    return NextResponse.json({ data: invites });

  } catch (error: any) {
    // Get groupId from params for error logging
    const { groupId } = await params.catch(() => ({ groupId: 'unknown' }));
    logger.error('Unexpected error in GET group invites', {
      component: 'group-invites-api',
      operation: 'list',
      groupId,
      error: error.message
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    // Admin permission check
    await requireAdminPermission();

    const { groupId } = await params;
    const body = await request.json();

    // Validate request body
    const validation = createInviteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: validation.error.flatten()
      }, { status: 400 });
    }

    const { expiresAt, maxUses, note, customCode } = validation.data;

    // Get current user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is group owner admin
    const { isAdmin, ownerOrgId } = await isGroupOwnerAdmin(groupId, user.id);
    if (!isAdmin) {
      logger.warn('User attempted to create invite without ownership', {
        component: 'group-invites-api',
        operation: 'create',
        groupId,
        userId: user.id
      });
      return NextResponse.json({ 
        error: 'You must be an admin of the group owner organization' 
      }, { status: 403 });
    }

    // Verify group exists
    const { data: group, error: groupError } = await supabaseAdmin
      .from('organization_groups')
      .select('id, name')
      .eq('id', groupId)
      .maybeSingle();

    if (groupError) {
      logger.error('Error fetching group', {
        component: 'group-invites-api',
        operation: 'create',
        groupId,
        error: groupError.message
      });
      return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
    }

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Generate code
    const inviteCode = customCode || generateInviteCode();

    // Check if code already exists
    if (customCode) {
      const { data: existingCode, error: codeError } = await supabaseAdmin
        .from('org_group_invites')
        .select('id')
        .eq('code', inviteCode)
        .maybeSingle();

      if (codeError) {
        logger.error('Error checking existing invite code', {
          component: 'group-invites-api',
          operation: 'create',
          groupId,
          error: codeError.message
        });
        return NextResponse.json({ error: 'Failed to check invite code' }, { status: 500 });
      }

      if (existingCode) {
        return NextResponse.json({ 
          error: 'Invite code already exists' 
        }, { status: 400 });
      }
    }

    // Create invite
    // TODO: [SUPABASE_TYPE_FOLLOWUP] org_group_invites テーブルの型定義を Supabase client に追加
    const { data: invite, error } = await supabaseAdmin
      .from('org_group_invites')
      .insert({
        group_id: groupId,
        code: inviteCode,
        expires_at: expiresAt || null,
        max_uses: maxUses || null,
        used_count: 0,
        created_by: user.id,
        note: note || null
      } as any)
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
      logger.error('Error creating group invite', {
        component: 'group-invites-api',
        operation: 'create',
        groupId,
        error: error.message
      });
      
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ 
          error: 'Invite code already exists' 
        }, { status: 400 });
      }
      
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }

    if (!invite) {
      logger.error('Invite creation succeeded but no data returned', {
        component: 'group-invites-api',
        operation: 'create',
        groupId
      });
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }

    logger.info('Group invite created successfully', {
      component: 'group-invites-api',
      operation: 'create',
      groupId,
      inviteId: (invite as any).id,
      code: inviteCode.substring(0, 4) + '...',
      userId: user.id
    });

    return NextResponse.json({ data: invite }, { status: 201 });

  } catch (error: any) {
    // Get groupId from params for error logging
    const { groupId } = await params.catch(() => ({ groupId: 'unknown' }));
    logger.error('Unexpected error in POST group invites', {
      component: 'group-invites-api',
      operation: 'create',
      groupId,
      error: error.message
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}