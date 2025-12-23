/**
 * monthly-report-generate
 *
 * 月次レポート生成 Edge Function (仕様準拠版)
 *
 * 機能:
 * - ai_monthly_reports テーブルに冪等 upsert
 * - monthly_report_jobs テーブルにジョブ作成（idempotency_key 付き）
 * - period_start/period_end 形式で期間管理
 * - util.normalize_month_period 相当の正規化
 * - 非同期でKPI計算を実行
 *
 * 入力:
 * - organization_id (uuid): 組織ID
 * - plan_id (text): プランID（省略時は組織のデフォルト）
 * - level (text): basic | advanced
 * - period_start (date): 開始日（省略時は前月）
 * - period_end (date): 終了日（省略時は自動計算）
 */

import { createServiceRoleClient } from '../_shared/supabase.ts';
import {
  normalizeMonthPeriod,
  getDefaultTargetPeriod,
  generateIdempotencyKeyAsync,
  isValidUUID,
  isValidYearMonth,
  isFuturePeriod,
  jsonResponse,
  errorResponse,
  type NormalizedPeriod,
  type ReportJobResult,
} from '../_shared/reports.ts';

console.info('monthly-report-generate started');

interface Query {
  org_id?: string;
  organization_id?: string; // alias
  plan_id?: string;
  level?: string;
  year?: string;
  month?: string;
  period_start?: string;
  period_end?: string;
  force?: string; // 'true' で completed も再生成
}

Deno.serve(async (req: Request) => {
  try {
    // Parse query parameters
    const url = new URL(req.url);
    const q: Query = Object.fromEntries(url.searchParams.entries());

    // Also support POST body
    let bodyParams: Partial<Query> = {};
    if (req.method === 'POST') {
      try {
        bodyParams = await req.json();
      } catch {
        // Ignore JSON parse errors
      }
    }

    // Merge query and body params
    const params = { ...q, ...bodyParams };

    // バリデーション: organization_id
    const org_id = params.org_id || params.organization_id;
    if (!org_id) {
      return errorResponse('org_id is required', 400);
    }
    if (!isValidUUID(org_id)) {
      return errorResponse('invalid org_id format', 400);
    }

    // 対象期間の決定
    let period: NormalizedPeriod;

    if (params.period_start) {
      // period_start が指定された場合
      period = normalizeMonthPeriod(params.period_start, params.period_end);
    } else if (params.year && params.month) {
      // year/month が指定された場合
      const year = Number(params.year);
      const month = Number(params.month);

      if (!isValidYearMonth(year, month)) {
        return errorResponse('invalid year/month', 400);
      }

      if (isFuturePeriod(year, month)) {
        return errorResponse('cannot generate report for future month', 400);
      }

      period = normalizeMonthPeriod(`${year}-${String(month).padStart(2, '0')}-01`);
    } else {
      // デフォルト: 前月
      period = getDefaultTargetPeriod();
    }

    const { monthBucket, periodStart, periodEnd } = period;
    const force = params.force === 'true';
    const level = (params.level === 'advanced' ? 'advanced' : 'basic') as 'basic' | 'advanced';

    // Supabase Admin クライアント
    const admin = createServiceRoleClient();

    // 組織の plan_id を取得
    const { data: orgData, error: orgError } = await admin
      .from('organizations')
      .select('id, plan_id')
      .eq('id', org_id)
      .single();

    if (orgError || !orgData) {
      return errorResponse('organization not found', 404);
    }

    const plan_id = params.plan_id || orgData.plan_id || 'free';

    // idempotency_key 生成
    const idempotencyKey = await generateIdempotencyKeyAsync({
      organizationId: org_id,
      monthBucket,
      planId: plan_id,
      level,
    });

    // 既存レポートの確認
    const { data: existing, error: checkError } = await admin
      .from('ai_monthly_reports')
      .select('id, status')
      .eq('organization_id', org_id)
      .eq('period_start', periodStart)
      .eq('plan_id', plan_id)
      .eq('level', level)
      .maybeSingle();

    if (checkError) {
      console.error('check error', checkError);
      return errorResponse(checkError.message, 500);
    }

    // 冪等性チェック
    if (existing) {
      if (existing.status === 'completed' && !force) {
        return jsonResponse({
          status: 'skipped',
          reportId: existing.id,
          organizationId: org_id,
          period,
          currentStatus: existing.status,
          message: 'report already completed (use force=true to regenerate)',
        });
      }
      if (existing.status === 'generating') {
        // 既存ジョブの確認
        const { data: existingJob } = await admin
          .from('monthly_report_jobs')
          .select('id, status')
          .eq('report_id', existing.id)
          .in('status', ['queued', 'running'])
          .maybeSingle();

        return jsonResponse({
          status: 'skipped',
          reportId: existing.id,
          jobId: existingJob?.id,
          organizationId: org_id,
          period,
          currentStatus: existing.status,
          message: 'report generation already in progress',
        });
      }
    }

    // レポート作成または更新（upsert）
    const reportPayload = {
      organization_id: org_id,
      period_start: periodStart,
      period_end: periodEnd,
      plan_id,
      level,
      status: 'generating',
      summary_text: '',
      metrics: {
        ai_visibility_score: 0,
        total_bot_hits: 0,
        unique_bots: 0,
        analyzed_urls: 0,
        top_performing_urls: 0,
        improvement_needed_urls: 0,
      },
      updated_at: new Date().toISOString(),
    };

    let report_id: string;

    if (existing) {
      // 既存レポートを更新
      const { data, error } = await admin
        .from('ai_monthly_reports')
        .update({
          status: 'generating',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id')
        .single();

      if (error) {
        console.error('update error', error);
        return errorResponse(error.message, 500);
      }
      report_id = data.id;
    } else {
      // 新規レポート作成
      const { data, error } = await admin
        .from('ai_monthly_reports')
        .insert(reportPayload)
        .select('id')
        .single();

      if (error) {
        console.error('insert error', error);
        return errorResponse(error.message, 500);
      }
      report_id = data.id;
    }

    // ジョブ作成（idempotency_key で重複チェック）
    const { data: existingJob } = await admin
      .from('monthly_report_jobs')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .in('status', ['queued', 'running'])
      .maybeSingle();

    let job_id: string;
    let jobStatus: string;

    if (existingJob) {
      // 既存ジョブがある場合はスキップ
      job_id = existingJob.id;
      jobStatus = existingJob.status;
    } else {
      // 新規ジョブ作成
      const jobPayload = {
        report_id,
        organization_id: org_id,
        idempotency_key: idempotencyKey,
        status: 'queued',
        attempts: 0,
        meta: {
          plan_id,
          level,
          period_start: periodStart,
          period_end: periodEnd,
        },
        scheduled_at: new Date().toISOString(),
      };

      const { data: jobData, error: jobError } = await admin
        .from('monthly_report_jobs')
        .insert(jobPayload)
        .select('id, status')
        .single();

      if (jobError) {
        // UNIQUE制約エラーの場合は既存ジョブを返す
        if (jobError.code === '23505') {
          const { data: dup } = await admin
            .from('monthly_report_jobs')
            .select('id, status')
            .eq('idempotency_key', idempotencyKey)
            .single();

          return jsonResponse({
            status: 'skipped',
            reportId: report_id,
            jobId: dup?.id,
            organizationId: org_id,
            period,
            currentStatus: dup?.status as string,
            message: 'job already exists (idempotency)',
          });
        }
        console.error('job insert error', jobError);
        return errorResponse(jobError.message, 500);
      }

      job_id = jobData.id;
      jobStatus = jobData.status;
    }

    // 非同期でKPI計算を実行（レスポンスをブロックしない）
    EdgeRuntime.waitUntil(
      computeAndFinalizeReport(admin, report_id, job_id, org_id, periodStart, periodEnd)
    );

    const result: ReportJobResult = {
      status: 'ok',
      reportId: report_id,
      jobId: job_id,
      organizationId: org_id,
      period,
      currentStatus: jobStatus as 'queued',
      message: 'report generation started',
    };

    return jsonResponse(result, 200);
  } catch (e) {
    console.error('unhandled', e);
    return errorResponse('internal error', 500, e instanceof Error ? e.message : undefined);
  }
});

/**
 * 非同期でKPI計算を実行し、完了時にステータスを更新
 */
async function computeAndFinalizeReport(
  admin: ReturnType<typeof createServiceRoleClient>,
  report_id: string,
  job_id: string,
  org_id: string,
  period_start: string,
  period_end: string
): Promise<void> {
  try {
    console.info(`Computing KPIs for report ${report_id}, job ${job_id}`);

    // ジョブを running に更新
    await admin
      .from('monthly_report_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        attempts: 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job_id);

    // KPI計算: fn_build_monthly_kpis RPC を呼び出し
    // 返却例: { order_count: int, revenue_cents: bigint, ai_usage_events: int }
    let kpiData: Record<string, unknown> = {};
    try {
      const { data: kpis, error: kpiError } = await admin.rpc('fn_build_monthly_kpis', {
        p_org_id: org_id,
        p_period_start: period_start,
        p_period_end: period_end,
      });

      if (kpiError) {
        console.warn(`[fn_build_monthly_kpis] RPC error for report ${report_id}:`, kpiError.message);
        // KPI取得失敗でも続行（デフォルト値を使用）
      } else if (kpis) {
        kpiData = kpis as Record<string, unknown>;
        console.info(`[fn_build_monthly_kpis] Success for report ${report_id}:`, kpiData);
      }
    } catch (kpiErr) {
      console.warn(`[fn_build_monthly_kpis] Exception for report ${report_id}:`, kpiErr);
    }

    // メトリクス構築（KPIデータ + 追加指標）
    // NOTE: 現在はスケルトン実装のため、一部の値はプレースホルダー
    const metrics = {
      // KPI RPC からの値
      order_count: kpiData.order_count ?? 0,
      revenue_cents: kpiData.revenue_cents ?? 0,
      ai_usage_events: kpiData.ai_usage_events ?? 0,
      // 追加指標（将来実装予定）
      // FIXME: これらの値は別途計算ロジックが必要
      ai_visibility_score: 0,
      total_bot_hits: 0,
      unique_bots: 0,
      analyzed_urls: 0,
      top_performing_urls: 0,
      improvement_needed_urls: 0,
    };

    // レポート完了更新
    const { error: updateError } = await admin
      .from('ai_monthly_reports')
      .update({
        status: 'completed',
        metrics,
        summary_text: `Monthly report for ${period_start} to ${period_end}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', report_id);

    if (updateError) {
      throw updateError;
    }

    // ジョブ完了更新
    await admin
      .from('monthly_report_jobs')
      .update({
        status: 'succeeded',
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', job_id);

    console.info(`Report ${report_id} completed successfully`);

    // Realtime broadcast で UI に通知（DBトリガで自動broadcast設定済みなら不要）
    // await admin.channel(`org:${org_id}:monthly_reports`).send({ type: 'broadcast', ... });

  } catch (e) {
    console.error('compute error', e);

    // レポートを failed に
    await admin
      .from('ai_monthly_reports')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', report_id);

    // ジョブを failed に
    await admin
      .from('monthly_report_jobs')
      .update({
        status: 'failed',
        last_error: e instanceof Error ? e.message : 'Unknown error',
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', job_id);
  }
}
