// deno-lint-ignore-file no-explicit-any
// Minimal, safe monthly report worker pulling from job_runs_v2 and upserting ai_monthly_reports
// Routes:
//  - POST /reports-cron/run?limit=10
// Notes:
//  - Uses SUPABASE_SERVICE_ROLE_KEY for RLS bypass on server-side
//  - Idempotent via job_runs_v2.idempotency_key and ON CONFLICT logic
//  - No external deps; uses fetch Web API

interface JobRow {
  id: string
  job_name: string
  idempotency_key: string | null
  status: string
  meta: any
  started_at: string | null
}

const url = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseHeaders = {
  'Content-Type': 'application/json',
  'apikey': serviceKey,
  'Authorization': `Bearer ${serviceKey}`,
}

const sql = async (query: string, args: any[] = []) => {
  const resp = await fetch(`${url}/rest/v1/rpc/pgexec`, {
    method: 'POST',
    headers: supabaseHeaders,
    body: JSON.stringify({ query, params: args }),
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`SQL error ${resp.status}: ${text}`)
  }
  return resp.json()
}

const nowIso = () => new Date().toISOString()

const pickPendingJobs = async (limit: number) => {
  const q = `
    with cte as (
      select id
      from public.job_runs_v2
      where status = 'pending' and job_name = 'monthly_report_regen'
      order by created_at asc
      limit $1
      for update skip locked
    )
    update public.job_runs_v2 j
      set status = 'running', started_at = now(), updated_at = now()
    where j.id in (select id from cte)
    returning j.id, j.job_name, j.idempotency_key, j.status, j.meta, j.started_at;`
  const rows = await sql(q, [limit]) as JobRow[]
  return rows
}

const upsertMonthlyReport = async (orgId: string, periodStart: string, periodEnd: string) => {
  const q = `
    insert into public.ai_monthly_reports (organization_id, plan_id, level, period_start, period_end, status, summary_text)
    values ($1::uuid, 'starter', 'org', $2::date, $3::date, 'processing', '')
    on conflict (organization_id, period_start, period_end) do update
      set updated_at = now(), status = 'processing'
    returning id;`
  const res = await sql(q, [orgId, periodStart, periodEnd])
  return res?.[0]?.id as string | undefined
}

const markJob = async (id: string, status: 'succeeded' | 'failed', error?: { code?: string; message?: string }) => {
  const q = `
    update public.job_runs_v2
      set status = $2, finished_at = now(), updated_at = now(), error_code = $3, error_message = $4
    where id = $1
    returning id, status;`
  return sql(q, [id, status, error?.code ?? null, error?.message ?? null])
}

Deno.serve(async (req) => {
  try {
    const urlObj = new URL(req.url)
    const pathname = urlObj.pathname

    if (req.method !== 'POST' || !pathname.endsWith('/reports-cron/run')) {
      return new Response('Not Found', { status: 404 })
    }

    const limit = Number(urlObj.searchParams.get('limit') ?? '10')

    const jobs = await pickPendingJobs(limit)
    const results: any[] = []

    for (const job of jobs) {
      try {
        const orgId = job.meta?.organization_id as string
        const periodStart = job.meta?.period_start as string
        const periodEnd = job.meta?.period_end as string
        if (!orgId || !periodStart || !periodEnd) throw new Error('missing meta fields')

        await upsertMonthlyReport(orgId, periodStart, periodEnd)
        await markJob(job.id, 'succeeded')
        results.push({ id: job.id, ok: true })
      } catch (e) {
        await markJob(job.id, 'failed', { message: (e as Error).message })
        results.push({ id: job.id, ok: false, error: (e as Error).message })
      }
    }

    return new Response(JSON.stringify({ picked: jobs.length, results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})