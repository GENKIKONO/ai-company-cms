/**
 * P2-7: AIインタビューアナリティクス ダッシュボード
 * 組織別・期間別のインタビューメトリクス可視化
 */

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionWithClient } from '@/lib/core/auth-state';
import { logger } from '@/lib/utils/logger';
import type { InterviewAnalyticsResponse } from '@/types/interview-analytics';
import InterviewAnalyticsDashboard from './InterviewAnalyticsDashboard';

interface PageProps {
  searchParams: Promise<{
    period?: '7d' | '30d' | '90d';
  }>;
}

/**
 * サーバーサイドでの初期データ取得
 */
async function fetchInitialData(orgId: string, period: '7d' | '30d' | '90d' = '30d'): Promise<InterviewAnalyticsResponse> {
  try {
    // 期間計算
    const periodDays = { '7d': 7, '30d': 30, '90d': 90 }[period];
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date(Date.now() - (periodDays - 1) * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const supabase = await createClient();
    const startTime = Date.now();

    // MATERIALIZED VIEWから取得
    const { data: mvData, error: mvError } = await supabase
      .from('mv_ai_interview_org_daily_metrics')
      .select('organization_id, day, total_sessions, total_responses, avg_duration_sec, unique_users, session_count, completed_session_count, completion_rate, avg_question_count, ai_used_session_count, ai_call_count, citations_item_count, quoted_tokens_sum, last_session_at')
      .eq('organization_id', orgId)
      .gte('day', fromDate)
      .lte('day', toDate)
      .order('day', { ascending: true });

    let rawData = mvData;
    let dataSource: 'materialized_view' | 'view' = 'materialized_view';

    // MV が空またはエラーの場合は通常VIEWから取得
    if (mvError || !mvData || mvData.length === 0) {
      if (mvError) {
        logger.warn('MATERIALIZED VIEW query failed, falling back to view', {
          error: mvError.message,
          orgId,
          period
        });
      }

      const { data: viewData, error: viewError } = await supabase
        .from('v_ai_interview_org_daily_metrics')
        .select('organization_id, day, total_sessions, total_responses, avg_duration_sec, unique_users, session_count, completed_session_count, completion_rate, avg_question_count, ai_used_session_count, ai_call_count, citations_item_count, quoted_tokens_sum, last_session_at')
        .eq('organization_id', orgId)
        .gte('day', fromDate)
        .lte('day', toDate)
        .order('day', { ascending: true });

      if (viewError) {
        throw new Error(`View query failed: ${viewError.message}`);
      }

      rawData = viewData;
      dataSource = 'view';
    }

    const queryTimeMs = Date.now() - startTime;

    // データ変換
    const days = (rawData || []).map(row => ({
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
      completionRate: null as number | null,
      avgQuestionCount: null as number | null
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

    // 完了率計算
    if (totals.sessionCount > 0) {
      totals.completionRate = Number((totals.completedSessionCount / totals.sessionCount).toFixed(3));
    }

    // 平均質問数計算
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
        recordCount: rawData?.length || 0
      }
    };

  } catch (error: any) {
    logger.error('Failed to fetch initial interview analytics data:', {
      error: error.message,
      orgId,
      period
    });
    throw error;
  }
}

/**
 * ページコンポーネント（SSR）
 */
export default async function InterviewAnalyticsPage({ searchParams }: PageProps) {
  // 認証チェック
  const supabase = await createClient();
  const session = await getSessionWithClient(supabase);
  if (!session) {
    redirect('/auth/login');
  }

  // 組織ID取得
  const { data: userOrg, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', session.user.id)
    .eq('role', 'owner')
    .single();

  if (orgError || !userOrg) {
    logger.error('Failed to get user organization:', { 
      error: orgError?.message, 
      userId: session.user.id 
    });
    notFound();
  }

  const orgId = userOrg.organization_id;
  const resolvedSearchParams = await searchParams;
  const period = resolvedSearchParams.period || '30d';

  // 初期データ取得
  let initialData: InterviewAnalyticsResponse | null = null;
  let serverError: string | null = null;

  try {
    initialData = await fetchInitialData(orgId, period);
  } catch (error: any) {
    serverError = error.message;
    logger.error('Server-side data fetch failed:', { error: error.message, orgId, period });
  }

  return (
    <div className="">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="hig-text-h1 hig-jp-heading">AIインタビューアナリティクス</h1>
              <p className="hig-text-body text-[var(--color-text-secondary)] mt-2">
                組織のAIインタビュー活動状況を分析・可視化
              </p>
            </div>
          </div>
        </div>

        {/* ダッシュボード */}
        <Suspense fallback={
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        }>
          <InterviewAnalyticsDashboard 
            orgId={orgId}
            initialPeriod={period}
            initialData={initialData}
            serverError={serverError}
          />
        </Suspense>
      </main>
    </div>
  );
}