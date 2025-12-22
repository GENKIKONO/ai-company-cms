console.info('monthly-report-generate started');
interface Query {
  org_id?: string;
  year?: string;
  month?: string;
}

interface ResultBody {
  status: 'ok' | 'error';
  report_id?: string;
  org_id?: string;
  period?: { year: number; month: number };
  message?: string;
}

// Use built-in env vars; no extra secrets required
Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const q: Query = Object.fromEntries(url.searchParams.entries());

    const org_id = q.org_id;
    if (!org_id) {
      return json({ status: 'error', message: 'org_id is required' }, 400);
    }

    // Determine target period (default: previous month in UTC)
    const now = new Date();
    const utcYear = now.getUTCFullYear();
    const utcMonth = now.getUTCMonth(); // 0-11
    let year = q.year ? Number(q.year) : utcMonth === 0 ? utcYear - 1 : utcYear;
    let month = q.month ? Number(q.month) : utcMonth === 0 ? 12 : utcMonth; // 1-12

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return json({ status: 'error', message: 'invalid year/month' }, 400);
    }

    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    // Aggregate example: insert into reports table with computed metrics
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('npm:@supabase/supabase-js@2.46.1');
    const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    // Example: compute KPIs via RPC or SQL-like client calls
    // Here we assume a materialized view or SQL function exists; as a fallback, we store a stub record
    const payload = {
      org_id,
      period_year: year,
      period_month: month,
      generated_at: new Date().toISOString(),
      // Placeholder metrics; database triggers/jobs can backfill real numbers
      kpi_1: 0,
      kpi_2: 0,
      status: 'pending',
    } as const;

    const { data, error } = await admin
      .from('monthly_reports')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.error('insert error', error);
      return json({ status: 'error', message: error.message }, 500);
    }

    const body: ResultBody = {
      status: 'ok',
      report_id: data.id,
      org_id,
      period: { year, month },
    };

    return json(body, 200);
  } catch (e) {
    console.error('unhandled', e);
    return json({ status: 'error', message: 'internal error' }, 500);
  }
});

function json(body: ResultBody, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' },
  });
}
