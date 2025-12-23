/**
 * reports-get-current
 *
 * 最新レポート取得 Edge Function (仕様準拠版)
 *
 * 機能:
 * - 指定月のレポートを取得
 * - completed優先、なければ直近の generating/pending/failed を返す
 * - plan_id, level でのフィルタリング対応
 *
 * 入力:
 * - org_id (uuid): 組織ID
 * - date (string): 対象日 (YYYY-MM-01 or ISO date)、省略時は当月
 * - plan_id (text): プランID（省略可）
 * - level (text): basic | advanced（省略可）
 */

import { createAuthenticatedClient, createServiceRoleClient } from '../_shared/supabase.ts';
import {
  normalizeMonthPeriod,
  sortByStatusPriority,
  isValidUUID,
  jsonResponse,
  errorResponse,
} from '../_shared/reports.ts';

console.info('reports-get-current started');

interface QueryParams {
  org_id?: string;
  organization_id?: string; // alias
  date?: string; // YYYY-MM-DD or ISO date
  plan_id?: string;
  level?: string;
}

interface MonthlyReport {
  id: string;
  organization_id: string;
  plan_id: string | null;
  level: string | null;
  period_start: string;
  period_end: string | null;
  status: string;
  summary_text: string | null;
  metrics: Record<string, unknown> | null;
  sections: Record<string, unknown> | null;
  suggestions: unknown[] | null;
  created_at: string;
  updated_at: string;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'GET') {
      return errorResponse('Method not allowed', 405);
    }

    // Auth: require a valid supabase session token
    const auth = req.headers.get('authorization');
    if (!auth) {
      return errorResponse('Missing Authorization header', 401);
    }

    // Extract token
    const token = auth.replace(/^Bearer\s+/i, '');

    // Parse query
    const url = new URL(req.url);
    const params: QueryParams = Object.fromEntries(url.searchParams) as QueryParams;
    const org_id = params.org_id || params.organization_id;

    if (!org_id) {
      return errorResponse('org_id is required', 400);
    }

    if (!isValidUUID(org_id)) {
      return errorResponse('invalid org_id format', 400);
    }

    // Compute month period
    const targetDate = params.date ? new Date(params.date) : new Date();
    const period = normalizeMonthPeriod(targetDate);
    const { periodStart, periodEnd } = period;

    // Create authenticated client (RLS enforced)
    const supabase = createAuthenticatedClient(token);

    // Build query
    let query = supabase
      .from('ai_monthly_reports')
      .select('*')
      .eq('organization_id', org_id)
      .eq('period_start', periodStart);

    // Optional filters
    if (params.plan_id) {
      query = query.eq('plan_id', params.plan_id);
    }
    if (params.level) {
      query = query.eq('level', params.level);
    }

    // Fetch all matching reports for the period
    const { data: reports, error } = await query;

    if (error) {
      console.error('query error', error);
      return errorResponse('query_failed', 500, error.message);
    }

    if (!reports || reports.length === 0) {
      // No report found
      return jsonResponse({
        status: 'ok',
        organizationId: org_id,
        period,
        report: null,
        message: 'No report found for this period',
      } as any);
    }

    // Sort by status priority: completed > generating > pending > failed
    const sorted = sortByStatusPriority(reports as MonthlyReport[]);
    const bestReport = sorted[0];

    return new Response(
      JSON.stringify({
        organization_id: org_id,
        period_start: periodStart,
        period_end: periodEnd,
        report: bestReport,
        total_candidates: reports.length,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (e) {
    console.error('unhandled error', e);
    return errorResponse('internal_error', 500, e instanceof Error ? e.message : undefined);
  }
});
