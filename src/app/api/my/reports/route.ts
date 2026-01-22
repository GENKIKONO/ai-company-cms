/**
 * /api/my/reports - レポートAPI
 *
 * 【認証方式】
 * - createApiAuthClient を使用（統一認証ヘルパー）
 * - getUser() が唯一の Source of Truth
 * - Cookie 同期は applyCookies で行う
 *
 * @see src/lib/supabase/api-auth.ts
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';
import { logger } from '@/lib/utils/logger';
import {
  getMonthlyReportsListByYearMonth,
  getMonthlyReportByYearMonth,
  saveMonthlyReport,
  updateMonthlyReportStatus,
  toPeriodStart,
  toPeriodEnd
} from '@/lib/reports/monthly-report-service';

// Get monthly reports for authenticated organization
export async function GET(request: NextRequest) {
  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(request);

    // Get user's organization（v_app_users_compat2 互換ビュー使用）
    const { data: userProfiles, error: profileError } = await supabase
      .from('v_app_users_compat2')
      .select('organization_id')
      .eq('id', user.id);

    if (profileError) {
      logger.error('[Reports API] Failed to fetch user profile', { data: profileError });
      return applyCookies(NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 }));
    }

    const userProfile = userProfiles?.[0];
    if (!userProfile?.organization_id) {
      return applyCookies(NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: 50,
          offset: 0,
          has_more: false
        }
      }));
    }

    const organizationId = userProfile.organization_id;

    // Parse query parameters
    const url = new URL(request.url);
    const yearParam = url.searchParams.get('year');
    const monthParam = url.searchParams.get('month');
    const periodFrom = url.searchParams.get('period_from'); // YYYY-MM-DD
    const periodTo = url.searchParams.get('period_to'); // YYYY-MM-DD
    const statusParam = url.searchParams.get('status'); // pending|generating|completed|failed
    const sortOrder = url.searchParams.get('sort') === 'asc' ? 'asc' : 'desc';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    // Use service layer with enhanced filters
    const { reports, total, error } = await getMonthlyReportsListByYearMonth(
      organizationId,
      {
        year: yearParam ? parseInt(yearParam) : undefined,
        month: monthParam ? parseInt(monthParam) : undefined,
        periodFrom: periodFrom || undefined,
        periodTo: periodTo || undefined,
        status: statusParam as 'pending' | 'generating' | 'completed' | 'failed' | undefined,
        sortOrder,
        limit,
        offset
      }
    );

    if (error) {
      logger.error('[Reports API] Failed to fetch reports via service', { data: error });
      return applyCookies(NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      ));
    }

    // Return reports in new schema format (period_start, metrics)
    return applyCookies(NextResponse.json({
      success: true,
      data: reports,
      pagination: {
        total,
        limit,
        offset,
        has_more: total > offset + limit
      }
    }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }
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
    const { supabase, user, applyCookies } = await createApiAuthClient(request);

    // Get user's organization（v_app_users_compat2 互換ビュー使用）
    const { data: userProfiles, error: profileError } = await supabase
      .from('v_app_users_compat2')
      .select('organization_id')
      .eq('id', user.id);

    if (profileError) {
      logger.error('[Reports API] Failed to fetch user profile in POST', { data: profileError });
      return applyCookies(NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 }));
    }

    const userProfile = userProfiles?.[0];
    if (!userProfile?.organization_id) {
      return applyCookies(NextResponse.json({ error: 'Organization not found' }, { status: 404 }));
    }

    // 二段取得: organizations から plan_id を取得
    const { data: orgData } = await supabase
      .from('organizations')
      .select('plan_id')
      .eq('id', userProfile.organization_id)
      .maybeSingle();

    // plan_id を userProfile に追加（既存コードとの互換性のため）
    const userProfileWithOrg = {
      ...userProfile,
      organizations: orgData ? { plan_id: orgData.plan_id } : null
    };

    const organizationId = userProfile.organization_id;
    const planId = (userProfileWithOrg.organizations as { plan_id?: string } | null)?.plan_id ?? 'free';

    // Parse request body
    const body = await request.json();
    const { year, month } = body;

    if (!year || !month || month < 1 || month > 12) {
      return applyCookies(NextResponse.json(
        { error: 'Valid year and month (1-12) are required' },
        { status: 400 }
      ));
    }

    // Validate that requested month is not in the future
    const now = new Date();
    const requestedDate = new Date(year, month - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (requestedDate > currentMonth) {
      return applyCookies(NextResponse.json(
        { error: 'Cannot generate reports for future months' },
        { status: 400 }
      ));
    }

    // Check if report already exists using service layer
    const { report: existingReport, error: checkError } = await getMonthlyReportByYearMonth(
      organizationId,
      year,
      month
    );

    if (checkError) {
      logger.error('[Reports API] Error checking existing report', { data: checkError });
      return applyCookies(NextResponse.json(
        { error: 'Failed to check existing reports' },
        { status: 500 }
      ));
    }

    if (existingReport) {
      if (existingReport.status === 'generating') {
        return applyCookies(NextResponse.json(
          { error: 'Report generation is already in progress' },
          { status: 409 }
        ));
      } else if (existingReport.status === 'completed') {
        return applyCookies(NextResponse.json(
          { error: 'Report already exists for this period' },
          { status: 409 }
        ));
      }
      // If status is 'failed' or 'pending', we'll regenerate it
    }

    const periodStart = toPeriodStart(year, month);
    const periodEnd = toPeriodEnd(year, month);

    if (existingReport) {
      // Update existing failed/pending report
      const { success, error: updateError } = await updateMonthlyReportStatus(
        organizationId,
        periodStart,
        'generating'
      );

      if (!success) {
        logger.error('[Reports API] Failed to update report status', { data: updateError });
        return applyCookies(NextResponse.json(
          { error: 'Failed to start report generation' },
          { status: 500 }
        ));
      }

      logger.info(`[Reports API] Report regeneration started for org ${organizationId}`, { period: `${year}-${month}` });

      return applyCookies(NextResponse.json({
        success: true,
        message: 'Report generation started',
        report_id: existingReport.id,
        status: 'generating'
      }));
    } else {
      // Create new report record using service layer
      const { id: reportId, error: insertError } = await saveMonthlyReport({
        organization_id: organizationId,
        period_start: periodStart,
        period_end: periodEnd,
        status: 'generating',
        level: 'basic',
        plan_id: planId,
        summary_text: '',
        metrics: {
          ai_visibility_score: 0,
          total_bot_hits: 0,
          unique_bots: 0,
          analyzed_urls: 0,
          top_performing_urls: 0,
          improvement_needed_urls: 0
        }
      });

      if (insertError || !reportId) {
        logger.error('[Reports API] Failed to create report record', { data: insertError });
        return applyCookies(NextResponse.json(
          { error: 'Failed to start report generation' },
          { status: 500 }
        ));
      }

      logger.info(`[Reports API] Report generation started for org ${organizationId}`, { period: `${year}-${month}` });

      // Trigger Edge Function for background report generation
      triggerReportGenerationEdgeFunction(reportId, organizationId, year, month, planId).catch(err => {
        logger.error('[Reports API] Edge Function trigger failed (non-blocking)', { error: err.message });
      });

      return applyCookies(NextResponse.json({
        success: true,
        message: 'Report generation started',
        report_id: reportId,
        status: 'generating'
      }));
    }

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }
    logger.error('[Reports API] Unexpected error in POST', { data: error instanceof Error ? error : new Error(String(error)) });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Edge Function を呼び出してレポート生成を非同期でトリガー
 * 失敗してもAPI自体は成功を返す（非ブロッキング）
 */
async function triggerReportGenerationEdgeFunction(
  reportId: string,
  organizationId: string,
  year: number,
  month: number,
  planId: string
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    logger.warn('[Reports API] Missing Supabase credentials for Edge Function');
    return;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/monthly-report-generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({
          organization_id: organizationId,
          year,
          month,
          plan_id: planId,
          level: 'basic'
        })
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      logger.warn('[Reports API] Edge Function responded with error', {
        status: response.status,
        body: errorBody.substring(0, 500)
      });
      return;
    }

    const result = await response.json();
    logger.info('[Reports API] Edge Function triggered successfully', {
      reportId,
      jobId: result.jobId,
      status: result.status
    });
  } catch (error) {
    logger.error('[Reports API] Failed to trigger Edge Function', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
