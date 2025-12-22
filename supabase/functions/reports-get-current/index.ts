console.info('reports-get-current started');

interface MonthlyReport {
  id: string;
  organization_id: string;
  period_start: string; // ISO date
  period_end: string | null;
  status: string | null;
  summary_text: string | null;
}

interface QueryParams {
  org_id?: string;
  date?: string; // optional YYYY-MM-01 or ISO date, defaults to current month
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

    // Auth: require a valid supabase session token
    const auth = req.headers.get('authorization');
    if (!auth) return unauthorized('Missing Authorization header');

    // Parse query
    const url = new URL(req.url);
    const { org_id, date }: QueryParams = Object.fromEntries(url.searchParams) as QueryParams;
    if (!org_id) return badRequest('org_id is required');

    // Compute month start
    const period = date ? new Date(date) : new Date();
    const periodStart = new Date(Date.UTC(period.getUTCFullYear(), period.getUTCMonth(), 1));
    const isoStart = periodStart.toISOString().slice(0, 10); // YYYY-MM-DD

    // Query Postgres via REST since functions run with anon key and RLS
    const endpoint = `${SUPABASE_URL}/rest/v1/ai_monthly_reports`;
    const qs = new URLSearchParams({
      select: '*',
      organization_id: `eq.${org_id}`,
      period_start: `eq.${isoStart}`,
      limit: '1',
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

    const rows = (await res.json()) as MonthlyReport[];
    const data = rows[0] ?? null;

    return json({
      organization_id: org_id,
      period_start: isoStart,
      report: data, // null when not found
    });
  } catch (e) {
    console.error(e);
    return json({ error: 'internal_error' }, { status: 500 });
  }
});