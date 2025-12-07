/**
 * P2-7: AIインタビューアナリティクス API
 * 組織別・期間別のインタビューメトリクス提供
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOrgMember } from '@/lib/api/auth-middleware';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type {
  InterviewAnalyticsApiResponse,
  InterviewAnalyticsResponse,
  InterviewAnalyticsError,
  InterviewAnalyticsQuery,
  InterviewAnalyticsPeriod,
  SupabaseOrgDailyMetric,
  InterviewDailyMetric,
  INTERVIEW_ANALYTICS_ERROR_CODES
} from '@/types/interview-analytics';

/**
 * 期間パラメータから日数を取得
 */
function getPeriodDays(period: InterviewAnalyticsPeriod): number {
  const periodMap = { '7d': 7, '30d': 30, '90d': 90 };
  return periodMap[period];
}

/**
 * 期間パラメータの検証
 */
function validatePeriod(period: string | null): InterviewAnalyticsPeriod {
  if (!period) return '30d';
  if (['7d', '30d', '90d'].includes(period)) {
    return period as InterviewAnalyticsPeriod;
  }
  throw new Error(`Invalid period: ${period}. Must be one of: 7d, 30d, 90d`);
}

/**
 * Supabaseの生データをAPIレスポンス形式に変換
 */
function transformSupabaseData(
  rawData: SupabaseOrgDailyMetric[],
  orgId: string,
  period: InterviewAnalyticsPeriod,
  fromDate: string,
  toDate: string,
  queryTimeMs: number,
  dataSource: 'materialized_view' | 'view'
): InterviewAnalyticsResponse {
  
  // 日別メトリクス変換
  const days: InterviewDailyMetric[] = rawData.map(row => ({
    day: row.day,
    sessionCount: row.session_count,
    completedSessionCount: row.completed_session_count,
    completionRate: row.completion_rate,
    avgQuestionCount: row.avg_question_count,
    aiUsedSessionCount: row.ai_used_session_count,
    aiCallCount: row.ai_call_count,
    citationsItemCount: row.citations_item_count,
    quotedTokensSum: row.quoted_tokens_sum,
    lastSessionAt: row.last_session_at
  }));

  // 合計値計算
  const totals = days.reduce((acc, day) => ({
    sessionCount: acc.sessionCount + day.sessionCount,
    completedSessionCount: acc.completedSessionCount + day.completedSessionCount,
    aiUsedSessionCount: acc.aiUsedSessionCount + day.aiUsedSessionCount,
    aiCallCount: acc.aiCallCount + day.aiCallCount,
    citationsItemCount: acc.citationsItemCount + day.citationsItemCount,
    quotedTokensSum: acc.quotedTokensSum + day.quotedTokensSum,
    completionRate: null, // 後で計算
    avgQuestionCount: null // 後で計算
  }), {
    sessionCount: 0,
    completedSessionCount: 0,
    aiUsedSessionCount: 0,
    aiCallCount: 0,
    citationsItemCount: 0,
    quotedTokensSum: 0,
    completionRate: null as number | null,
    avgQuestionCount: null as number | null
  });

  // 完了率計算（総セッション数が0でない場合のみ）
  if (totals.sessionCount > 0) {
    totals.completionRate = Number((totals.completedSessionCount / totals.sessionCount).toFixed(3));
  }

  // 平均質問数計算（質問数データがある日のみから計算）
  const daysWithQuestions = days.filter(day => day.avgQuestionCount !== null);
  if (daysWithQuestions.length > 0) {
    const totalQuestions = daysWithQuestions.reduce((sum, day) => 
      sum + (day.avgQuestionCount! * day.sessionCount), 0);
    const totalSessionsWithQuestions = daysWithQuestions.reduce((sum, day) => 
      sum + day.sessionCount, 0);
    if (totalSessionsWithQuestions > 0) {
      totals.avgQuestionCount = Number((totalQuestions / totalSessionsWithQuestions).toFixed(2));
    }
  }

  return {
    success: true,
    orgId,
    period,
    from: fromDate,
    to: toDate,
    days,
    totals,
    metadata: {
      dataSource,
      queryTimeMs,
      recordCount: rawData.length
    }
  };
}

/**
 * MATERIALIZED VIEW からデータ取得
 */
async function fetchFromMaterializedView(
  supabase: any,
  orgId: string,
  fromDate: string,
  toDate: string
): Promise<SupabaseOrgDailyMetric[]> {
  const { data, error } = await supabase
    .from('mv_ai_interview_org_daily_metrics')
    .select('*')
    .eq('organization_id', orgId)
    .gte('day', fromDate)
    .lte('day', toDate)
    .order('day', { ascending: true });

  if (error) {
    throw new Error(`Materialized view query failed: ${error.message}`);
  }

  return data || [];
}

/**
 * 通常VIEW からデータ取得（フォールバック）
 */
async function fetchFromView(
  supabase: any,
  orgId: string,
  fromDate: string,
  toDate: string
): Promise<SupabaseOrgDailyMetric[]> {
  const { data, error } = await supabase
    .from('v_ai_interview_org_daily_metrics')
    .select('*')
    .eq('organization_id', orgId)
    .gte('day', fromDate)
    .lte('day', toDate)
    .order('day', { ascending: true });

  if (error) {
    throw new Error(`View query failed: ${error.message}`);
  }

  return data || [];
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // クエリパラメータ解析
    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId');
    const periodParam = url.searchParams.get('period');

    // 必須パラメータ検証
    if (!orgId) {
      const error: InterviewAnalyticsError = {
        success: false,
        code: 'MISSING_ORG_ID',
        message: 'orgId parameter is required'
      };
      return NextResponse.json(error, { status: 400 });
    }

    // 期間パラメータ検証
    let period: InterviewAnalyticsPeriod;
    try {
      period = validatePeriod(periodParam);
    } catch (validationError: any) {
      const error: InterviewAnalyticsError = {
        success: false,
        code: 'INVALID_PERIOD',
        message: validationError.message
      };
      return NextResponse.json(error, { status: 400 });
    }

    // 認証・認可チェック
    const authResult = await requireOrgMember(orgId, request);
    if (authResult.success === false) {
      const error: InterviewAnalyticsError = {
        success: false,
        code: 'PERMISSION_DENIED',
        message: authResult.message
      };
      return NextResponse.json(error, { status: 401 });
    }

    // 日付範囲計算
    const days = getPeriodDays(period);
    const toDate = new Date().toISOString().split('T')[0]; // 今日
    const fromDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]; // days日前

    const supabase = await createClient();
    let rawData: SupabaseOrgDailyMetric[];
    let dataSource: 'materialized_view' | 'view' = 'materialized_view';

    try {
      // まずMATERIALIZED VIEWから取得を試行
      rawData = await fetchFromMaterializedView(supabase, orgId, fromDate, toDate);
      
      // データが空の場合、通常VIEWにフォールバック
      if (rawData.length === 0) {
        logger.info('Falling back to regular view due to empty materialized view data', {
          orgId,
          period,
          fromDate,
          toDate
        });
        rawData = await fetchFromView(supabase, orgId, fromDate, toDate);
        dataSource = 'view';
      }
    } catch (mvError: any) {
      // MATERIALIZED VIEWエラー時は通常VIEWにフォールバック
      logger.warn('Materialized view query failed, falling back to regular view', {
        error: mvError.message,
        orgId,
        period
      });
      
      try {
        rawData = await fetchFromView(supabase, orgId, fromDate, toDate);
        dataSource = 'view';
      } catch (viewError: any) {
        throw new Error(`Both materialized view and view queries failed: ${viewError.message}`);
      }
    }

    const queryTimeMs = Date.now() - startTime;

    // データ変換
    const response = transformSupabaseData(
      rawData,
      orgId,
      period,
      fromDate,
      toDate,
      queryTimeMs,
      dataSource
    );

    logger.info('Interview analytics data fetched successfully', {
      orgId,
      period,
      dataSource,
      recordCount: response.days.length,
      queryTimeMs,
      totals: response.totals
    });

    return NextResponse.json(response);

  } catch (error: any) {
    const queryTimeMs = Date.now() - startTime;
    
    logger.error('Failed to fetch interview analytics:', {
      error: error.message,
      stack: error.stack,
      queryTimeMs
    });

    const errorResponse: InterviewAnalyticsError = {
      success: false,
      code: 'DATA_SOURCE_ERROR',
      message: error.message || 'Failed to fetch analytics data',
      detail: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        queryTimeMs
      } : undefined
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}