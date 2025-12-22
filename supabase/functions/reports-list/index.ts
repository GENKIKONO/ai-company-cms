console.info('reports-list started');

interface MonthlyReportLite {
  id: string;
  organization_id: string;
  period_start: string;
  period_end: string | null;
  status: string | null;
  summary_text?: string | null;
}

declare const SUPABASE_URL: string;
declare const SUPABASE_ANON_KEY: string;

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(init.headers || {}),
    },
  });

const badRequest = (message: string) => json({ error: message }, { status: 400 });
const unauthorized = (message = 'Unauthorized') => json({ error: message }, { status: 401 });

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'GET') return badRequest('Method not allowed');

    const auth = req.headers.get('authorization');
    if (!auth) return unauthorized('Missing Authorization header');

    const url = new URL(req.url);
    const org_id = url.searchParams.get('org_id');
    if (!org_id) return badRequest('org_id is required');

    const months = Math.max(1, Math.min(60, Number(url.searchParams.get('months') ?? '12')));
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
    const startIso = start.toISOString().slice(0, 10);

    const endpoint = `${SUPABASE_URL}/rest/v1/ai_monthly_reports`;
    const qs = new URLSearchParams({
      select: 'id,organization_id,period_start,period_end,status,summary_text',
      organization_id: `eq.${org_id}`,
      period_start: `gte.${startIso}`,
      order: 'period_start.desc',
    });

    const res = await fetch(`${endpoint}?${qs.toString()}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        authorization: auth,
        accept: 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return json({ error: 'query_failed', detail: text }, { status: res.status });
    }

    const rows = (await res.json()) as MonthlyReportLite[];
    const data = rows.map((r) => ({
      ...r,
      summary_preview: (r.summary_text ?? '').slice(0, 140),
    }));

    return json({
      organization_id: org_id,
      months,
      items: data,
    });
  } catch (e) {
    console.error(e);
    return json({ error: 'internal_error' }, { status: 500 });
  }
});