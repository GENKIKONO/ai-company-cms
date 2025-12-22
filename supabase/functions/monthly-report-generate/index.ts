/**
 * monthly-report-generate
 *
 * 月次レポート生成 Edge Function
 * - ai_monthly_reports テーブルに冪等 upsert
 * - period_start/period_end 形式で期間管理
 * - 非同期でKPI計算を実行
 */

console.info('monthly-report-generate started');

interface Query {
  org_id?: string;
  year?: string;
  month?: string;
  force?: string; // 'true' で completed も再生成
}

interface ResultBody {
  status: 'ok' | 'error' | 'skipped';
  report_id?: string;
  org_id?: string;
  period?: { year: number; month: number; start: string; end: string };
  message?: string;
}

// 期間ヘルパー
function toPeriodStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function toPeriodEnd(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const q: Query = Object.fromEntries(url.searchParams.entries());

    // バリデーション
    const org_id = q.org_id;
    if (!org_id) {
      return json({ status: 'error', message: 'org_id is required' }, 400);
    }

    // UUID 形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(org_id)) {
      return json({ status: 'error', message: 'invalid org_id format' }, 400);
    }

    // 対象期間の決定（デフォルト: 前月 UTC）
    const now = new Date();
    const utcYear = now.getUTCFullYear();
    const utcMonth = now.getUTCMonth(); // 0-11
    let year = q.year ? Number(q.year) : utcMonth === 0 ? utcYear - 1 : utcYear;
    let month = q.month ? Number(q.month) : utcMonth === 0 ? 12 : utcMonth; // 1-12

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return json({ status: 'error', message: 'invalid year/month' }, 400);
    }

    // 未来の月は拒否
    const requestedDate = new Date(Date.UTC(year, month - 1, 1));
    const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    if (requestedDate > currentMonth) {
      return json({ status: 'error', message: 'cannot generate report for future month' }, 400);
    }

    const period_start = toPeriodStart(year, month);
    const period_end = toPeriodEnd(year, month);
    const force = q.force === 'true';

    // Supabase Admin クライアント
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('npm:@supabase/supabase-js@2.46.1');
    const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    // 既存レポートの確認
    const { data: existing, error: checkError } = await admin
      .from('ai_monthly_reports')
      .select('id, status')
      .eq('organization_id', org_id)
      .eq('period_start', period_start)
      .maybeSingle();

    if (checkError) {
      console.error('check error', checkError);
      return json({ status: 'error', message: checkError.message }, 500);
    }

    // 冪等性チェック
    if (existing) {
      if (existing.status === 'completed' && !force) {
        return json({
          status: 'skipped',
          report_id: existing.id,
          org_id,
          period: { year, month, start: period_start, end: period_end },
          message: 'report already completed (use force=true to regenerate)',
        }, 200);
      }
      if (existing.status === 'generating') {
        return json({
          status: 'skipped',
          report_id: existing.id,
          org_id,
          period: { year, month, start: period_start, end: period_end },
          message: 'report generation already in progress',
        }, 200);
      }
    }

    // 組織の plan_id を取得
    const { data: orgData, error: orgError } = await admin
      .from('organizations')
      .select('id, plan_id')
      .eq('id', org_id)
      .single();

    if (orgError || !orgData) {
      return json({ status: 'error', message: 'organization not found' }, 404);
    }

    const plan_id = orgData.plan_id ?? 'free';

    // 冪等 upsert（ON CONFLICT で重複回避）
    const payload = {
      organization_id: org_id,
      period_start,
      period_end,
      status: 'generating',
      level: 'basic',
      plan_id,
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

    const { data, error } = await admin
      .from('ai_monthly_reports')
      .upsert(payload, { onConflict: 'organization_id,period_start' })
      .select('id')
      .single();

    if (error) {
      console.error('upsert error', error);
      return json({ status: 'error', message: error.message }, 500);
    }

    const report_id = data.id;

    // 非同期でKPI計算を実行（レスポンスをブロックしない）
    EdgeRuntime.waitUntil(
      computeAndFinalizeReport(admin, report_id, org_id, period_start, period_end)
    );

    const body: ResultBody = {
      status: 'ok',
      report_id,
      org_id,
      period: { year, month, start: period_start, end: period_end },
      message: 'report generation started',
    };

    return json(body, 200);
  } catch (e) {
    console.error('unhandled', e);
    return json({ status: 'error', message: 'internal error' }, 500);
  }
});

/**
 * 非同期でKPI計算を実行し、完了時にステータスを更新
 */
async function computeAndFinalizeReport(
  admin: any,
  report_id: string,
  org_id: string,
  period_start: string,
  period_end: string
): Promise<void> {
  try {
    console.info(`Computing KPIs for report ${report_id}`);

    // TODO: 実際のKPI計算ロジック
    // 例: fn_build_monthly_kpis(org_id, period_start, period_end) を呼び出し
    // const { data: kpis } = await admin.rpc('fn_build_monthly_kpis', { ... });

    // 仮のKPI計算（実際はDB関数やAPI呼び出しで算出）
    const metrics = {
      ai_visibility_score: Math.floor(Math.random() * 100),
      total_bot_hits: Math.floor(Math.random() * 1000),
      unique_bots: Math.floor(Math.random() * 50),
      analyzed_urls: Math.floor(Math.random() * 200),
      top_performing_urls: Math.floor(Math.random() * 20),
      improvement_needed_urls: Math.floor(Math.random() * 30),
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
      console.error('finalize update error', updateError);
      // 失敗時はステータスを failed に
      await admin
        .from('ai_monthly_reports')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', report_id);
      return;
    }

    console.info(`Report ${report_id} completed successfully`);

    // TODO: Realtime broadcast で UI に通知
    // await admin.channel(`org:${org_id}:monthly_reports`).send({ type: 'broadcast', ... });

  } catch (e) {
    console.error('compute error', e);
    // 失敗時はステータスを failed に
    await admin
      .from('ai_monthly_reports')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', report_id);
  }
}

function json(body: ResultBody, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' },
  });
}
