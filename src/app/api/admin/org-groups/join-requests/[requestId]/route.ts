import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/adminClient';
import { supabaseAdmin as supabaseAdminUntyped } from '@/lib/supabase-admin-client';
import { getUserWithClient } from '@/lib/core/auth-state';
import { requireAdminPermission } from '@/lib/auth/server';
import { logger } from '@/lib/log';
import { isUserAdminOfOrg } from '@/lib/utils/org-permissions';
import { z } from 'zod';

// Validation schema
const decisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  note: z.string().max(1000).optional().nullable()
});

// Helper function to check if user can manage join request
async function canManageJoinRequest(requestId: string, userId: string): Promise<boolean> {
  try {
    // Get join request with group info (uses untyped client for complex JOIN)
    const { data: request, error } = await supabaseAdminUntyped
      .from('org_group_join_requests')
      .select(`
        id,
        group_id,
        group:organization_groups!org_group_join_requests_group_id_fkey(
          id,
          owner_organization_id
        )
      `)
      .eq('id', requestId)
      .maybeSingle();

    if (error) {
      return false;
    }

    if (!request || !request.group) {
      return false;
    }

    // Handle group data which might be array or object
    const group = Array.isArray(request.group) 
      ? request.group[0] 
      : request.group;

    if (!group) {
      return false;
    }

    // Check system admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      return false;
    }

    if (profile?.role === 'admin') {
      return true;
    }

    // Check if user is admin of group owner organization
    return await isUserAdminOfOrg(group.owner_organization_id, userId);
  } catch (error: any) {
    logger.error('Error checking join request management permission', {
      component: 'join-request-decision-api',
      requestId,
      userId,
      error: error.message
    });
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    // Check if this is the decide endpoint
    const url = new URL(request.url);
    if (!url.pathname.endsWith('/decide')) {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });
    }

    // Admin permission check
    await requireAdminPermission();

    const { requestId } = await params;
    const body = await request.json();

    // Validate request body
    const validation = decisionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: validation.error.flatten()
      }, { status: 400 });
    }

    const { decision, note } = validation.data;

    // Get current user
    const user = await getUserWithClient(supabaseAdminUntyped);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user can manage this join request
    const canManage = await canManageJoinRequest(requestId, user.id);
    if (!canManage) {
      logger.warn('User attempted to decide join request without permission', {
        component: 'join-request-decision-api',
        operation: 'decide',
        requestId,
        decision,
        userId: user.id
      });
      return NextResponse.json({ 
        error: 'You must be a system admin or group owner admin to process this request' 
      }, { status: 403 });
    }

    // Get join request details
    const { data: joinRequest, error: requestError } = await supabaseAdmin
      .from('org_group_join_requests')
      .select('id, group_id, organization_id, status, invite_code, requested_by, reason')
      .eq('id', requestId)
      .maybeSingle();

    if (requestError) {
      logger.error('Error fetching join request details', {
        component: 'join-request-decision-api',
        operation: 'decide',
        requestId,
        error: requestError.message
      });
      return NextResponse.json({ error: 'Failed to fetch join request' }, { status: 500 });
    }

    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 });
    }

    // Check if request is still pending
    if (joinRequest.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Join request has already been processed' 
      }, { status: 409 });
    }

    // Start transaction-like operations
    const now = new Date().toISOString();

    try {
      if (decision === 'approve') {
        // Use transactional RPC for approval (SECURITY DEFINER, atomic operation)
        // RPC: approve_join_request(p_request_id uuid, p_invite_code text)
        // - Inserts into org_group_members (if not exists)
        // - Increments invite code usage (if provided)
        // - Updates join request status to 'approved'
        // - All in a single transaction
        const { error: approveError } = await supabaseAdmin.rpc('approve_join_request', {
          p_request_id: requestId,
          p_invite_code: joinRequest.invite_code || null
        });

        if (approveError) {
          // Parse DB exception to user-friendly message
          const errorMessage = approveError.message || '';
          let userMessage = '参加リクエストの承認に失敗しました';
          let errorCategory = 'unknown';

          if (errorMessage.includes('not found') || errorMessage.includes('存在しません')) {
            userMessage = 'リクエストまたは招待コードが見つかりません';
            errorCategory = 'not_found';
          } else if (errorMessage.includes('expired') || errorMessage.includes('期限')) {
            userMessage = '招待コードの有効期限が切れています';
            errorCategory = 'expired';
          } else if (errorMessage.includes('max') || errorMessage.includes('上限')) {
            userMessage = '招待コードの使用回数上限に達しています';
            errorCategory = 'max_uses_reached';
          } else if (errorMessage.includes('already') || errorMessage.includes('既に')) {
            userMessage = '既にグループメンバーです';
            errorCategory = 'already_member';
          }

          logger.error('Failed to approve join request via RPC', {
            component: 'join-request-decision-api',
            operation: 'approve',
            requestId,
            inviteCode: joinRequest.invite_code,
            error: approveError.message,
            code: approveError.code,
            errorCategory,
            userMessage
          });

          return NextResponse.json({
            error: userMessage,
            code: errorCategory
          }, { status: 400 });
        }

        // Fetch updated request for response (uses untyped client for complex JOIN)
        const { data: updatedRequest, error: fetchError } = await supabaseAdminUntyped
          .from('org_group_join_requests')
          .select(`
            id, group_id, organization_id, status, invite_code, requested_by, reason,
            decision_note, decided_by, decided_at, created_at, updated_at,
            group:organization_groups!org_group_join_requests_group_id_fkey(id, name,
              owner_organization:organizations!organization_groups_owner_org_id_fkey(id, name, company_name)
            ),
            organization:organizations!org_group_join_requests_organization_id_fkey(id, name, company_name)
          `)
          .eq('id', requestId)
          .maybeSingle();

        if (fetchError || !updatedRequest) {
          logger.warn('Approval succeeded but failed to fetch updated request', {
            component: 'join-request-decision-api',
            operation: 'approve',
            requestId,
            error: fetchError?.message
          });
        }

        logger.info('Join request approved successfully via RPC', {
          component: 'join-request-decision-api',
          operation: 'approve',
          requestId,
          groupId: joinRequest.group_id,
          organizationId: joinRequest.organization_id,
          userId: user.id
        });

        return NextResponse.json({
          data: updatedRequest,
          message: 'Join request approved successfully. Organization added to group.'
        });
      }

      // Reject: Update join request status only (uses untyped client for complex JOIN)
      const { data: updatedRequest, error: updateError } = await supabaseAdminUntyped
        .from('org_group_join_requests')
        .update({
          status: 'rejected',
          decision_note: note || null,
          decided_by: user.id,
          decided_at: now,
          updated_at: now
        })
        .eq('id', requestId)
        .select(`
          id, group_id, organization_id, status, invite_code, requested_by, reason,
          decision_note, decided_by, decided_at, created_at, updated_at,
          group:organization_groups!org_group_join_requests_group_id_fkey(id, name,
            owner_organization:organizations!organization_groups_owner_org_id_fkey(id, name, company_name)
          ),
          organization:organizations!org_group_join_requests_organization_id_fkey(id, name, company_name)
        `)
        .maybeSingle();

      if (updateError) {
        logger.error('Error updating join request status', {
          component: 'join-request-decision-api',
          operation: 'decide',
          requestId,
          decision,
          error: updateError.message
        });
        return NextResponse.json({ 
          error: 'Failed to update join request status' 
        }, { status: 500 });
      }

      if (!updatedRequest) {
        logger.error('Update succeeded but no data returned', {
          component: 'join-request-decision-api',
          operation: 'decide',
          requestId,
          decision
        });
        return NextResponse.json({ 
          error: 'Failed to update join request status' 
        }, { status: 500 });
      }

      logger.info('Join request processed successfully', {
        component: 'join-request-decision-api',
        operation: 'decide',
        requestId,
        decision,
        groupId: joinRequest.group_id,
        organizationId: joinRequest.organization_id,
        userId: user.id
      });

      return NextResponse.json({
        data: updatedRequest,
        message: 'Join request rejected successfully.'
      });

    } catch (transactionError: any) {
      logger.error('Transaction error during join request processing', {
        component: 'join-request-decision-api',
        operation: 'decide',
        requestId,
        decision,
        error: transactionError.message
      });
      return NextResponse.json({ 
        error: 'Failed to process join request' 
      }, { status: 500 });
    }

  } catch (error: any) {
    // Get requestId from params for error logging
    const { requestId } = await params.catch(() => ({ requestId: 'unknown' }));
    logger.error('Unexpected error in join request decision', {
      component: 'join-request-decision-api',
      operation: 'decide',
      requestId,
      error: error.message
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}