console.info('monthly-report-scheduler started');
interface ResultBody {
  status: 'ok' | 'error';
  triggered: number;
  targets: string[];
  message?: string;
}

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('npm:@supabase/supabase-js@2.46.1');
    const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    // Fetch all active orgs
    const { data: orgs, error: orgErr } = await admin
      .from('organizations')
      .select('id')
      .eq('is_active', true);

    if (orgErr) {
      console.error('orgs fetch error', orgErr);
      return json({ status: 'error', triggered: 0, targets: [], message: orgErr.message }, 500);
    }

    const targets = (orgs ?? []).map((o: { id: string }) => o.id);

    // Fire-and-forget generate calls in background
    const endpoint = new URL('/functions/v1/monthly-report-generate', supabaseUrl).toString();

    const calls = targets.map((org_id) => {
      const u = new URL(endpoint);
      u.searchParams.set('org_id', org_id);
      if (year) u.searchParams.set('year', year);
      if (month) u.searchParams.set('month', month ?? '');
      return fetch(u.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${serviceRole}` },
      }).then((r) => r.ok).catch(() => false);
    });

    // Do not block response for all requests
    EdgeRuntime.waitUntil(Promise.allSettled(calls));

    return json({ status: 'ok', triggered: targets.length, targets });
  } catch (e) {
    console.error('unhandled', e);
    return json({ status: 'error', triggered: 0, targets: [], message: 'internal error' });
  }
});

function json(body: ResultBody, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' },
  });
}
