/**
 * Admin Reviews Reopen API
 *
 * ⚠️ Requires site_admin authentication.
 */
/* eslint-disable no-console */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { handleApiError, handleDatabaseError, handleZodError, notFoundError, validationError } from '@/lib/api/error-responses';
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
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();
    const userId = authResult.userId;

    // Get user profile for audit logging
    const { data: userProfile } = await supabase
      .from('v_app_users_compat2')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    // Parse and validate request body
    const body = await request.json();
    const validation = reopenSchema.safeParse(body);
    
    if (!validation.success) {
      return handleZodError(validation.error);
    }

    const { organization_id, reason, category, notes } = validation.data;

    // Check if organization exists
    // Note: Using untyped client - organizations テーブルの型定義を Supabase client に追加
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, status')
      .eq('id', organization_id)
      .single();

    if (orgError || !organization) {
      return notFoundError('Organization');
    }

    // Get current organization status
    const currentStatus = organization.status;
    
    // Update organization status to under_review
    // Note: Using untyped client - organizations テーブルの型定義を Supabase client に追加
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ 
        status: 'under_review',
        updated_at: new Date().toISOString()
      })
      .eq('id', organization_id);

    if (updateError) {
      logger.error('[Reviews Reopen] Failed to update organization status', { data: updateError });
      return handleDatabaseError(updateError);
    }

    // Create audit log entry
    // Note: Using untyped client - review_audit テーブルの型定義を Supabase client に追加
    const { error: auditError } = await supabase
      .from('review_audit')
      .insert({
        organization_id,
        reviewer_id: userId,
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

    logger.info(`[Reviews Reopen] Organization ${organization.name} reopened for review by ${userProfile?.full_name}`, {
      organization_id,
      reviewer_id: userId,
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
    return handleApiError(error);
  }
}

// GET endpoint to check if an organization can be reopened
export async function GET(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organization_id');

    if (!organizationId) {
      return validationError([
        { field: 'organization_id', message: 'organization_id parameter is required' }
      ]);
    }

    // Get organization details
    // Note: Using untyped client - organizations テーブルの型定義を Supabase client に追加
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, status')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return notFoundError('Organization');
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
    return handleApiError(error);
  }
}