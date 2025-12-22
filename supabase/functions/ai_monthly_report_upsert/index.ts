// ai_monthly_report_upsert
// Assumptions:
// - public.ai_monthly_reports table exists with columns:
//   id uuid PK default gen_random_uuid(), organization_id uuid, period_start timestamptz,
//   period_end timestamptz, metrics jsonb, created_at timestamptz default now(), updated_at timestamptz default now()
// - Unique constraint on (organization_id, period_start, period_end)
// - Related content tables include posts, services, faqs, case_studies with fields:
//   organization_id uuid, is_published boolean, published_at timestamptz
// - Optional: sales_materials_stats(org_id uuid, event text, created_at timestamptz), activities_YYYY tables use naming activities_2025 etc.
// - RLS enabled and Edge Function uses SERVICE_ROLE for writes.
//
// If some tables are missing, metrics gracefully fall back to 0 and proceed.
//
// Routes:
// - POST /ai_monthly_report_upsert?org_id=<uuid>
//
// Implementation details:
// - Validates org_id format and existence in organizations
// - Computes last month UTC boundaries
// - Aggregates metrics from known tables if present
// - UPSERT into ai_monthly_reports and returns the row with action: 'inserted' | 'updated'

// deno-lint-ignore-file no-explicit-any

interface UpsertResult {
  action: 'inserted' | 'updated';
  report_id: string;
  period_start: string;
  period_end: string;
  metrics: Record<string, any>;
}

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive',
    },
  });

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

// Simple pg client using SUPABASE_DB_URL via postgres wire
// Prefer Deno Postgres via npm since Edge supports npm in Deno Deploy runtime
import pkg from 'npm:pg@8.11.5';
const { Client } = pkg;

// Helper: run a single-value query safely, returns first row or null
async function oneOrNull<T = any>(client: any, sql: string, params: any[] = []): Promise<T | null> {
  try {
    const res = await client.query(sql, params);
    if (res?.rows?.length) return res.rows[0] as T;
    return null;
  } catch (_e) {
    return null;
  }
}

async function existsTable(client: any, schema: string, table: string): Promise<boolean> {
  const row = await oneOrNull(client, `select 1 from information_schema.tables where table_schema = $1 and table_name = $2`, [schema, table]);
  return !!row;
}

function lastMonthUtcBounds(): { start: string; end: string } {
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth(); // 0-11
  // Last month calculation
  const lastMonth = utcMonth === 0 ? 11 : utcMonth - 1;
  const yearForLast = utcMonth === 0 ? utcYear - 1 : utcYear;
  const start = new Date(Date.UTC(yearForLast, lastMonth, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(yearForLast, lastMonth + 1, 0, 23, 59, 59, 999));
  return { start: start.toISOString(), end: end.toISOString() };
}

async function gatherMetrics(client: any, orgId: string, startIso: string, endIso: string) {
  const metrics: Record<string, any> = {};

  // Helper for counting published items across common tables
  const contentTables = [
    { name: 'posts', dateCol: 'published_at' },
    { name: 'services', dateCol: 'published_at' },
    { name: 'faqs', dateCol: 'published_at' },
    { name: 'case_studies', dateCol: 'published_at' },
  ];

  let totalPublished = 0;
  for (const t of contentTables) {
    if (await existsTable(client, 'public', t.name)) {
      const row = await oneOrNull<{ cnt: string }>(
        client,
        `select count(*)::int as cnt from public.${t.name}
          where organization_id = $1 and is_published = true
            and ${t.dateCol} >= $2 and ${t.dateCol} <= $3`,
        [orgId, startIso, endIso],
      );
      const c = row ? Number(row.cnt) : 0;
      metrics[`${t.name}_published`] = c;
      totalPublished += c;
    } else {
      metrics[`${t.name}_published`] = 0;
    }
  }
  metrics.total_published = totalPublished;

  // Optional: sales_materials_stats
  if (await existsTable(client, 'public', 'sales_materials_stats')) {
    const views = await oneOrNull<{ cnt: string }>(
      client,
      `select count(*)::int as cnt from public.sales_materials_stats
         where organization_id = $1 and event = 'view' and created_at >= $2 and created_at <= $3`,
      [orgId, startIso, endIso],
    );
    const downloads = await oneOrNull<{ cnt: string }>(
      client,
      `select count(*)::int as cnt from public.sales_materials_stats
         where organization_id = $1 and event = 'download' and created_at >= $2 and created_at <= $3`,
      [orgId, startIso, endIso],
    );
    metrics.sales_materials_views = views ? Number(views.cnt) : 0;
    metrics.sales_materials_downloads = downloads ? Number(downloads.cnt) : 0;
  } else {
    metrics.sales_materials_views = 0;
    metrics.sales_materials_downloads = 0;
  }

  // Optional: activities_YYYY table for the computed year
  const y = new Date(startIso).getUTCFullYear();
  const actTable = `activities_${y}`;
  if (await existsTable(client, 'public', actTable)) {
    const row = await oneOrNull<{ cnt: string }>(
      client,
      `select count(*)::int as cnt from public.${actTable}
         where organization_id = $1 and created_at >= $2 and created_at <= $3`,
      [orgId, startIso, endIso],
    );
    metrics.activities = row ? Number(row.cnt) : 0;
  } else {
    metrics.activities = 0;
  }

  return metrics;
}

async function ensureOrganizationExists(client: any, orgId: string) {
  if (!(await existsTable(client, 'public', 'organizations'))) return false;
  const row = await oneOrNull(client, `select id from public.organizations where id = $1`, [orgId]);
  return !!row;
}

async function upsertReport(client: any, orgId: string, startIso: string, endIso: string, metrics: Record<string, any>): Promise<UpsertResult> {
  // Ensure table exists
  if (!(await existsTable(client, 'public', 'ai_monthly_reports'))) {
    throw new Error('Table public.ai_monthly_reports not found');
  }

  // UPSERT by unique key (organization_id, period_start, period_end)
  const res = await client.query(
    `insert into public.ai_monthly_reports (organization_id, period_start, period_end, metrics)
     values ($1, $2, $3, $4)
     on conflict (organization_id, period_start, period_end)
     do update set metrics = excluded.metrics, updated_at = now()
     returning id, xmax = 0 as inserted;`,
    [orgId, startIso, endIso, metrics],
  );
  const row = res.rows[0];
  const inserted = row.inserted === true || row.inserted === 't';
  const action: 'inserted' | 'updated' = inserted ? 'inserted' : 'updated';
  return {
    action,
    report_id: row.id,
    period_start: startIso,
    period_end: endIso,
    metrics,
  };
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const url = new URL(req.url);
    const orgId = url.searchParams.get('org_id') || '';
    if (!isUuid(orgId)) return json({ error: 'org_id must be a valid UUID' }, 400);

    const { start, end } = lastMonthUtcBounds();

    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!dbUrl) return json({ error: 'SUPABASE_DB_URL is not set' }, 500);

    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();
    try {
      const exists = await ensureOrganizationExists(client, orgId);
      if (!exists) return json({ error: 'organization not found' }, 404);

      const metrics = await gatherMetrics(client, orgId, start, end);
      const result = await upsertReport(client, orgId, start, end, metrics);
      return json(result, result.action === 'inserted' ? 201 : 200);
    } finally {
      await client.end();
    }
  } catch (e) {
    return json({ error: 'internal_error', message: e?.message ?? String(e) }, 500);
  }
});