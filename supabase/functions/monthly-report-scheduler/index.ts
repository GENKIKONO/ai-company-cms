/**
 * monthly-report-scheduler
 *
 * 月次レポート一括スケジューラー Edge Function
 * - 全アクティブ組織に対してレポート生成をトリガー
 * - 既に完了済みの組織はスキップ（冪等）
 * - cron または HTTP で起動
 */

console.info('monthly-report-scheduler started');

interface ResultBody {
  status: 'ok' | 'error';
  triggered: number;
  skipped: number;
  targets: string[];
  message?: string;
}

// 期間ヘルパー
function toPeriodStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const yearParam = url.searchParams.get('year');
    const monthParam = url.searchParams.get('month');
    const forceParam = url.searchParams.get('force'); // 'true' で completed も再生成

    // 対象期間の決定（デフォルト: 前月 UTC）
    const now = new Date();
    const utcYear = now.getUTCFullYear();
    const utcMonth = now.getUTCMonth(); // 0-11
    const year = yearParam ? Number(yearParam) : utcMonth === 0 ? utcYear - 1 : utcYear;
    const month = monthParam ? Number(monthParam) : utcMonth === 0 ? 12 : utcMonth;

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return json({ status: 'error', triggered: 0, skipped: 0, targets: [], message: 'invalid year/month' }, 400);
    }

    const period_start = toPeriodStart(year, month);
    const force = forceParam === 'true';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('npm:@supabase/supabase-js@2.46.1');
    const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    // 全アクティブ組織を取得
    const { data: orgs, error: orgErr } = await admin
      .from('organizations')
      .select('id')
      .eq('is_active', true);

    if (orgErr) {
      console.error('orgs fetch error', orgErr);
      return json({ status: 'error', triggered: 0, skipped: 0, targets: [], message: orgErr.message }, 500);
    }

    const allOrgIds = (orgs ?? []).map((o: { id: string }) => o.id);

    if (allOrgIds.length === 0) {
      return json({ status: 'ok', triggered: 0, skipped: 0, targets: [], message: 'no active organizations' }, 200);
    }

    // 既にレポートが存在する組織を確認（冪等性チェック）
    let skipOrgIds: string[] = [];
    if (!force) {
      const { data: existingReports, error: existErr } = await admin
        .from('ai_monthly_reports')
        .select('organization_id, status')
        .eq('period_start', period_start)
        .in('organization_id', allOrgIds);

      if (existErr) {
        console.error('existing reports check error', existErr);
      } else {
        // completed または generating の組織はスキップ
        skipOrgIds = (existingReports ?? [])
          .filter((r: { status: string }) => r.status === 'completed' || r.status === 'generating')
          .map((r: { organization_id: string }) => r.organization_id);
      }
    }

    const targets = allOrgIds.filter((id) => !skipOrgIds.includes(id));
    const skipped = skipOrgIds.length;

    if (targets.length === 0) {
      return json({
        status: 'ok',
        triggered: 0,
        skipped,
        targets: [],
        message: `all ${allOrgIds.length} organizations already have reports for ${year}-${month}`,
      }, 200);
    }

    // 生成リクエストを非同期で発行（Fire-and-forget）
    const endpoint = new URL('/functions/v1/monthly-report-generate', supabaseUrl).toString();

    const calls = targets.map((org_id) => {
      const u = new URL(endpoint);
      u.searchParams.set('org_id', org_id);
      u.searchParams.set('year', String(year));
      u.searchParams.set('month', String(month));
      if (force) u.searchParams.set('force', 'true');

      return fetch(u.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${serviceRole}` },
      })
        .then((r) => {
          if (!r.ok) console.warn(`generate failed for ${org_id}: ${r.status}`);
          return r.ok;
        })
        .catch((e) => {
          console.error(`generate error for ${org_id}:`, e);
          return false;
        });
    });

    // レスポンスをブロックせず、バックグラウンドで実行
    EdgeRuntime.waitUntil(Promise.allSettled(calls));

    console.info(`Triggered ${targets.length} report generations, skipped ${skipped}`);

    return json({
      status: 'ok',
      triggered: targets.length,
      skipped,
      targets,
      message: `triggered ${targets.length} generations for ${year}-${month}`,
    });
  } catch (e) {
    console.error('unhandled', e);
    return json({ status: 'error', triggered: 0, skipped: 0, targets: [], message: 'internal error' });
  }
});

function json(body: ResultBody, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' },
  });
}
