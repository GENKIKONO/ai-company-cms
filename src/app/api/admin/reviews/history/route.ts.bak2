/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/utils/logger';
import type { ReviewAuditWithDetails } from '@/lib/types/review';

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: userProfile, error: profileError } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organization_id');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id parameter is required' },
        { status: 400 }
      );
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
      logger.error('[Reviews History] Failed to fetch review history', historyError);
      return NextResponse.json(
        { error: 'Failed to fetch review history' },
        { status: 500 }
      );
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
      logger.error('[Reviews History] Failed to get total count', countError);
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
    logger.error('[Reviews History] Unexpected error', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}