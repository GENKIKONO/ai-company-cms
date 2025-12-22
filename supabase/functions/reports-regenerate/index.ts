console.info('reports-regenerate started');

declare const SUPABASE_URL: string;
declare const SUPABASE_ANON_KEY: string;

interface EnqueuePayload {
  org_id?: string;
  period_start?: string; // YYYY-MM-01 optional, default current month
}

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(init.headers || {}),
    },
  });

const badRequest = (m: string) => json({ error: m }, { status: 400 });
const unauthorized = (m = 'Unauthorized') => json({ error: m }, { status: 401 });

const toMonthStartISO = (date?: string) => {
  const d = date ? new Date(date) : new Date();
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  return start.toISOString().slice(0, 10); // YYYY-MM-DD
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return badRequest('Method not allowed');

    const auth = req.headers.get('authorization');
    if (!auth) return unauthorized('Missing Authorization header');

    const body = (await req.json().catch(() => ({}))) as EnqueuePayload;
    const org_id = body.org_id;
    const period_start_iso = toMonthStartISO(body.period_start);
    if (!org_id) return badRequest('org_id is required');

    // Build idempotency key and job payload
    const month = period_start_iso.slice(0, 7).replace('-', ''); // yyyymm
    const idemKey = `report:${org_id}:${month}`;

    // Insert or reuse job_runs_v2
    const endpoint = `${SUPABASE_URL}/rest/v1/job_runs_v2`;
    const jobPayload = {
      job_name: 'monthly_report_generate',
      idempotency_key: idemKey,
      status: 'pending',
      scheduled_at: new Date().toISOString(),
      meta: { org_id, period_start: period_start_iso },
    };

    // Upsert-like behavior: first try to find existing by idempotency_key
    const findQs = new URLSearchParams({
      select: 'id,status,meta,started_at,finished_at',
      idempotency_key: `eq.${idemKey}`,
      limit: '1',
    });
    const findRes = await fetch(`${endpoint}?${findQs}`, {
      headers: { apikey: SUPABASE_ANON_KEY, authorization: auth, accept: 'application/json' },
    });
    if (!findRes.ok) {
      const t = await findRes.text();
      return json({ error: 'lookup_failed', detail: t }, { status: findRes.status });
    }
    const existing = (await findRes.json()) as Array<Record<string, unknown>>;
    if (existing[0]) {
      return json({ job_id: existing[0]['id'], status: existing[0]['status'], reused: true });
    }

    // Create new pending job
    const createRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        authorization: auth,
        accept: 'application/json',
        'content-type': 'application/json',
        prefer: 'return=representation',
      },
      body: JSON.stringify(jobPayload),
    });
    if (!createRes.ok) {
      const t = await createRes.text();
      return json({ error: 'enqueue_failed', detail: t }, { status: createRes.status });
    }
    const rows = (await createRes.json()) as Array<{ id: string; status: string }>;

    // Fire-and-forget audit (best-effort)
    try {
      const auditEndpoint = `${SUPABASE_URL}/rest/v1/ops_audit_simple`;
      const au = await fetch(auditEndpoint, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          authorization: auth,
          'content-type': 'application/json',
          prefer: 'return=minimal',
        },
        body: JSON.stringify({
          action: 'reports_regenerate',
          endpoint: '/reports-regenerate',
          request_id: crypto.randomUUID?.() ?? undefined,
          status: 'success',
          entity_kind: 'ai_monthly_reports',
          entity_ids: [org_id],
        }),
      });
      EdgeRuntime.waitUntil(au.then(() => undefined).catch(() => undefined));
    } catch (_) {}

    const job = rows[0];
    return json({ job_id: job.id, status: job.status, reused: false });
  } catch (e) {
    console.error(e);
    return json({ error: 'internal_error' }, { status: 500 });
  }
});