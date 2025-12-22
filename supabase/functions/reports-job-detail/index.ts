console.info('reports-job-detail started');

declare const SUPABASE_URL: string;
declare const SUPABASE_ANON_KEY: string;

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }
    const auth = req.headers.get('authorization');
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }
    const url = new URL(req.url);
    const job_id = url.searchParams.get('job_id');
    if (!job_id) {
      return new Response(JSON.stringify({ error: 'job_id is required' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const endpoint = `${SUPABASE_URL}/rest/v1/job_runs_v2`;
    const qs = new URLSearchParams({
      select: 'id,job_name,status,started_at,finished_at,scheduled_at,duration_ms,retry_count,error_code,error_message,meta,created_at,updated_at',
      id: `eq.${job_id}`,
      limit: '1',
    });

    const res = await fetch(`${endpoint}?${qs}`, { headers: { apikey: SUPABASE_ANON_KEY, authorization: auth, accept: 'application/json' } });
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: 'query_failed', detail: t }), { status: res.status, headers: { 'content-type': 'application/json' } });
    }
    const rows = (await res.json()) as unknown[];
    return new Response(JSON.stringify({ job: rows[0] ?? null }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
});