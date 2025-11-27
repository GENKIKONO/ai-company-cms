import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { MonthlyReport } from '@/types/database';

// Get monthly reports for authenticated organization
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user and organization
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userProfile, error: profileError } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = userProfile.organization_id;

    // Parse query parameters
    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    // Build query
    let query = supabase
      .from('monthly_reports')
      .select('*')
      .eq('organization_id', organizationId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (year) {
      query = query.eq('year', parseInt(year));
    }
    if (month) {
      query = query.eq('month', parseInt(month));
    }

    const { data: reports, error: reportsError } = await query;

    if (reportsError) {
      logger.error('[Reports API] Failed to fetch reports', { data: reportsError });
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('monthly_reports')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (year) countQuery = countQuery.eq('year', parseInt(year));
    if (month) countQuery = countQuery.eq('month', parseInt(month));

    const { count, error: countError } = await countQuery;

    if (countError) {
      logger.error('[Reports API] Failed to get reports count', { data: countError });
    }

    // Format reports for response
    const formattedReports = reports?.map(report => ({
      id: report.id,
      year: report.year,
      month: report.month,
      status: report.status,
      format: report.format,
      file_url: report.file_url,
      file_size: report.file_size,
      data_summary: report.data_summary,
      generated_at: report.generated_at,
      created_at: report.created_at,
      error_message: report.error_message
    })) || [];

    return NextResponse.json({
      success: true,
      data: formattedReports,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    logger.error('[Reports API] Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate a new monthly report on-demand (for current or previous months only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user and organization
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userProfile, error: profileError } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = userProfile.organization_id;

    // Parse request body
    const body = await request.json();
    const { year, month } = body;

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Valid year and month (1-12) are required' },
        { status: 400 }
      );
    }

    // Validate that requested month is not in the future
    const now = new Date();
    const requestedDate = new Date(year, month - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (requestedDate > currentMonth) {
      return NextResponse.json(
        { error: 'Cannot generate reports for future months' },
        { status: 400 }
      );
    }

    // Check if report already exists
    const { data: existingReport, error: checkError } = await supabase
      .from('monthly_reports')
      .select('id, status')
      .eq('organization_id', organizationId)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // Not "not found" error
      logger.error('[Reports API] Error checking existing report', { data: checkError });
      return NextResponse.json(
        { error: 'Failed to check existing reports' },
        { status: 500 }
      );
    }

    if (existingReport) {
      if (existingReport.status === 'generating') {
        return NextResponse.json(
          { error: 'Report generation is already in progress' },
          { status: 409 }
        );
      } else if (existingReport.status === 'completed') {
        return NextResponse.json(
          { error: 'Report already exists for this period' },
          { status: 409 }
        );
      }
      // If status is 'failed', we'll regenerate it
    }

    // Trigger report generation (in a real implementation, this would queue a background job)
    // For now, we'll just create the record and return - the actual generation would be async
    const reportId = existingReport?.id || crypto.randomUUID();

    if (existingReport) {
      // Update existing failed report
      const { error: updateError } = await supabase
        .from('monthly_reports')
        .update({
          status: 'generating',
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (updateError) {
        logger.error('[Reports API] Failed to update report status', { data: updateError });
        return NextResponse.json(
          { error: 'Failed to start report generation' },
          { status: 500 }
        );
      }
    } else {
      // Create new report record
      const { error: insertError } = await supabase
        .from('monthly_reports')
        .insert({
          id: reportId,
          organization_id: organizationId,
          year,
          month,
          status: 'generating',
          format: 'html',
          data_summary: {
            ai_visibility_score: 0,
            total_bot_hits: 0,
            unique_bots: 0,
            analyzed_urls: 0,
            top_performing_urls: 0,
            improvement_needed_urls: 0
          }
        });

      if (insertError) {
        logger.error('[Reports API] Failed to create report record', { data: insertError });
        return NextResponse.json(
          { error: 'Failed to start report generation' },
          { status: 500 }
        );
      }
    }

    logger.info(`[Reports API] Report generation started for org ${organizationId}`, { period: `${year}-${month}` });

    // TODO: Trigger background job for actual report generation
    // await triggerReportGeneration(reportId, organizationId, year, month);

    return NextResponse.json({
      success: true,
      message: 'Report generation started',
      report_id: reportId,
      status: 'generating'
    });

  } catch (error) {
    logger.error('[Reports API] Unexpected error in POST', { data: error instanceof Error ? error : new Error(String(error)) });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}