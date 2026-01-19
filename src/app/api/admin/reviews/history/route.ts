/**
 * Admin Reviews History API
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
import { handleApiError, handleDatabaseError, validationError } from '@/lib/api/error-responses';
import type { ReviewAuditWithDetails } from '@/lib/types/review';

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
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    if (!organizationId) {
      return validationError([
        { field: 'organization_id', message: 'organization_id parameter is required' }
      ]);
    }

    // Fetch review history with reviewer details
    const { data: history, error: historyError } = await supabase
      .from('review_audit')
      .select(`
        id,
        organization_id,
        reviewer_id,
        action,
        previous_status,
        new_status,
        reason,
        category,
        notes,
        created_at,
        updated_at,
        app_users!reviewer_id (
          full_name,
          email
        ),
        organizations!organization_id (
          name
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (historyError) {
      logger.error('[Reviews History] Failed to fetch review history', { data: historyError });
      return handleDatabaseError(historyError);
    }

    // Transform the data to match the expected interface
    const formattedHistory: ReviewAuditWithDetails[] = (history || []).map((entry: any) => ({
      id: entry.id,
      organization_id: entry.organization_id,
      reviewer_id: entry.reviewer_id,
      action: entry.action,
      previous_status: entry.previous_status,
      new_status: entry.new_status,
      reason: entry.reason,
      category: entry.category,
      notes: entry.notes,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      organization_name: entry.organizations?.name || 'Unknown Organization',
      reviewer_name: entry.app_users?.full_name || 'Unknown Reviewer',
      reviewer_email: entry.app_users?.email || 'unknown@example.com'
    }));

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('review_audit')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (countError) {
      logger.error('[Reviews History] Failed to get total count', { data: countError });
    }

    return NextResponse.json({
      success: true,
      data: formattedHistory,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    logger.error('[Reviews History] Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    return handleApiError(error);
  }
}