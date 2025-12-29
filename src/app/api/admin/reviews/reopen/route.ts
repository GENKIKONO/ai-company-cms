/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';
import type { ReopenRequest } from '@/lib/types/review';

// Validation schema for reopen request
const reopenSchema = z.object({
  organization_id: z.string().uuid('Invalid organization ID'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be less than 500 characters'),
  category: z.enum(['fake_info', 'inappropriate', 'copyright', 'spam', 'other']).optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication and admin role
    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    // TODO: [SUPABASE_TYPE_FOLLOWUP] app_users テーブルの型定義を Supabase client に追加
    const { data: userProfile, error: profileError } = await (supabase as any)
      .from('app_users')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = reopenSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { organization_id, reason, category, notes } = validation.data;

    // Check if organization exists
    // TODO: [SUPABASE_TYPE_FOLLOWUP] organizations テーブルの型定義を Supabase client に追加
    const { data: organization, error: orgError } = await (supabase as any)
      .from('organizations')
      .select('id, name, status')
      .eq('id', organization_id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get current organization status
    const currentStatus = organization.status;
    
    // Update organization status to under_review
    // TODO: [SUPABASE_TYPE_FOLLOWUP] organizations テーブルの型定義を Supabase client に追加
    const { error: updateError } = await (supabase as any)
      .from('organizations')
      .update({ 
        status: 'under_review',
        updated_at: new Date().toISOString()
      })
      .eq('id', organization_id);

    if (updateError) {
      logger.error('[Reviews Reopen] Failed to update organization status', { data: updateError });
      return NextResponse.json(
        { error: 'Failed to update organization status' },
        { status: 500 }
      );
    }

    // Create audit log entry
    // TODO: [SUPABASE_TYPE_FOLLOWUP] review_audit テーブルの型定義を Supabase client に追加
    const { error: auditError } = await (supabase as any)
      .from('review_audit')
      .insert({
        organization_id,
        reviewer_id: user.id,
        action: 'reopen',
        previous_status: currentStatus,
        new_status: 'under_review',
        reason,
        category,
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (auditError) {
      logger.error('[Reviews Reopen] Failed to create audit log', { data: auditError });
      // Note: We don't fail the request if audit logging fails
    }

    logger.info(`[Reviews Reopen] Organization ${organization.name} reopened for review by ${userProfile.full_name}`, {
      organization_id,
      reviewer_id: user.id,
      reason,
      category,
      previous_status: currentStatus
    });

    return NextResponse.json({
      success: true,
      message: 'Review reopened successfully',
      data: {
        organization_id,
        organization_name: organization.name,
        previous_status: currentStatus,
        new_status: 'under_review',
        reopened_by: userProfile.full_name,
        reopened_at: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('[Reviews Reopen] Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if an organization can be reopened
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication and admin role
    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    // TODO: [SUPABASE_TYPE_FOLLOWUP] app_users テーブルの型定義を Supabase client に追加
    const { data: userProfile, error: profileError } = await (supabase as any)
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id parameter is required' },
        { status: 400 }
      );
    }

    // Get organization details
    // TODO: [SUPABASE_TYPE_FOLLOWUP] organizations テーブルの型定義を Supabase client に追加
    const { data: organization, error: orgError } = await (supabase as any)
      .from('organizations')
      .select('id, name, status')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if organization can be reopened
    const canReopen = ['approved', 'rejected'].includes(organization.status);

    return NextResponse.json({
      success: true,
      data: {
        organization_id: organization.id,
        organization_name: organization.name,
        current_status: organization.status,
        can_reopen: canReopen,
        reason: canReopen 
          ? 'Organization can be reopened for review' 
          : `Cannot reopen organization with status: ${organization.status}`
      }
    });

  } catch (error) {
    logger.error('[Reviews Reopen Check] Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}