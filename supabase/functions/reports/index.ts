// reports Edge Function
// Routes:
//  - GET /reports/ai-citation/kpis?org_id&from&to
//  - GET /reports/ai-citation/integrity?org_id&from&to  (admin only)
//
// Guidelines followed:
// - Deno.serve
// - No bare specifiers; external via npm with versions
// - Uses SUPABASE_URL/SUPABASE_ANON_KEY (no service role)
// - Writes only to public.ops_audit_simple (SELECT-only otherwise)
// - Rate limit via Postgres advisory locks + counters in tmp table (ephemeral) alternative using in-memory Map with 60s window
//
// Assumptions (explicit):
// - Tables/Views: public.ai_citation_kpis_daily(day, organization_id, answers, cited_answers, zero_cite_answers, orphan_items)
//                 public.ai_citation_integrity_daily(day, organization_id, responses_without_items, orphan_items, duplicate_pairs)
// - Admin table: public.site_admins(user_id uuid primary key)
// - Audit table: public.ops_audit_simple(id bigserial, ts timestamptz default now(), action text, endpoint text, status text, reason text,
//               actor_id uuid, entity_kind text, entity_ids text[], request_id text, ip text, ua text)
// If ops_audit_simple differs, adjust column names accordingly.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

console.info("reports function starting");

// Simple fixed-window (60s) rate limiter per (user_id|ip, org_id, path)
// Note: Edge instance local memory resets on cold start; acceptable for basic protection.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

interface BucketKey { k: string }
const buckets = new Map<string, { count: number; resetAt: number }>();

function rlKey(userId: string | null, ip: string, orgId: string | null, path: string) {
  const uid = userId ?? 'anon';
  const org = orgId ?? 'none';
  return `${uid}|${ip}|${org}|${path}`;
}

function checkRateLimit(userId: string | null, ip: string, orgId: string | null, path: string) {
  const key = rlKey(userId, ip, orgId, path);
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  const remaining = Math.max(0, RATE_LIMIT_MAX - bucket.count);
  const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
  const limited = bucket.count > RATE_LIMIT_MAX;
  return { limited, remaining, retryAfter };
}

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', ...init.headers }, status: init.status });
}

function isUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function isISODate(v: string) {
  // YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function parseDates(from: string, to: string) {
  const d1 = new Date(from + 'T00:00:00Z');
  const d2 = new Date(to + 'T23:59:59Z');
  return { d1, d2 };
}

async function audit(supabase: ReturnType<typeof createClient>, row: {
  action: string; endpoint: string; status: 'success'|'failed'; reason?: string; actor_id?: string|null; entity_kind?: string; entity_ids?: string[]; request_id?: string|null; ip?: string|null; ua?: string|null;
}) {
  const payload = { ...row, entity_kind: row.entity_kind ?? 'org' } as any;
  // Fire and forget
  EdgeRuntime.waitUntil((async () => {
    await supabase.from('ops_audit_simple').insert(payload);
  })());
}

function getIP(req: Request) {
  const h = req.headers;
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('cf-connecting-ip') || h.get('x-real-ip') || '0.0.0.0';
}

function getUA(req: Request) {
  return req.headers.get('user-agent') || '';
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method.toUpperCase();
  const ip = getIP(req);
  const ua = getUA(req);
  const requestId = req.headers.get('x-request-id');

  // Only GET endpoints are supported here
  if (method !== 'GET') {
    return json({ code: 'method_not_allowed' }, { status: 405 });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') || '' } }
  });

  // Auth: get user and JWT claims
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user || null;
  const userId = user?.id ?? null;
  const jwt = (await supabase.auth.getSession()).data.session?.access_token || null;
  let orgClaim: string | null = null;
  try {
    if (jwt) {
      const payload = JSON.parse(atob(jwt.split('.')[1] || ''));
      // Custom claim key examples: organization_id or org_id
      orgClaim = (payload['organization_id'] || payload['org_id'] || null) as string | null;
    }
  } catch (_) {}

  // Query params
  const orgId = url.searchParams.get('org_id');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  // Input validation
  if (!orgId || !isUUID(orgId)) {
    return json({ code: 'bad_request', field: 'org_id' }, { status: 400 });
  }
  if (!from || !to || !isISODate(from) || !isISODate(to)) {
    return json({ code: 'bad_request', field: 'from_to' }, { status: 400 });
  }
  const { d1, d2 } = parseDates(from, to);
  if (d1.getTime() > d2.getTime()) {
    return json({ code: 'bad_request', field: 'date_range' }, { status: 400 });
  }
  const maxRangeMs = 90 * 24 * 3600 * 1000;
  if ((d2.getTime() - d1.getTime()) > maxRangeMs) {
    return json({ code: 'bad_request', field: 'date_range_too_wide' }, { status: 400 });
  }

  // Rate limit
  const { limited, remaining, retryAfter } = checkRateLimit(userId, ip, orgId, path);
  if (limited) {
    return json({ code: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Remaining': String(remaining) } });
  }

  // Admin check
  const { data: adminRows, error: adminErr } = await supabase
    .from('site_admins')
    .select('user_id')
    .eq('user_id', userId)
    .limit(1);
  const isAdmin = !!(adminRows && adminRows.length > 0);

  // Scope enforcement
  if (!isAdmin) {
    if (!orgClaim || orgClaim !== orgId) {
      await audit(supabase, { action: 'reports.scope_check', endpoint: path, status: 'failed', reason: 'org_mismatch', actor_id: userId, entity_ids: [orgId], request_id: requestId, ip, ua });
      return json({ code: 'forbidden', reason: 'org_mismatch' }, { status: 403 });
    }
  }

  try {
    if (path.endsWith('/reports/ai-citation/kpis')) {
      const { data, error } = await supabase
        .from('ai_citation_kpis_daily')
        .select('day, organization_id, answers, cited_answers, zero_cite_answers, orphan_items')
        .eq('organization_id', orgId)
        .gte('day', from)
        .lte('day', to)
        .order('day');
      if (error) throw error;

      const body = (data || []).map((r: any) => ({
        day: r.day,
        answers: r.answers,
        cited_answers: r.cited_answers,
        citation_rate_pct: r.answers > 0 ? Math.round((r.cited_answers / r.answers) * 10000) / 100 : 0,
        zero_cite_answers: r.zero_cite_answers,
        orphan_items: isAdmin ? r.orphan_items : undefined,
      }));

      await audit(supabase, { action: 'reports.kpi', endpoint: path, status: 'success', actor_id: userId, entity_ids: [orgId], request_id: requestId, ip, ua });
      return json({ items: body }, { status: 200, headers: { 'X-RateLimit-Remaining': String(remaining) } });
    }

    if (path.endsWith('/reports/ai-citation/integrity')) {
      if (!isAdmin) {
        await audit(supabase, { action: 'reports.integrity', endpoint: path, status: 'failed', reason: 'admin_only', actor_id: userId, entity_ids: [orgId], request_id: requestId, ip, ua });
        return json({ code: 'forbidden', reason: 'admin_only' }, { status: 403 });
      }

      const { data, error } = await supabase
        .from('ai_citation_integrity_daily')
        .select('day, organization_id, responses_without_items, orphan_items, duplicate_pairs')
        .eq('organization_id', orgId)
        .gte('day', from)
        .lte('day', to)
        .order('day');
      if (error) throw error;

      await audit(supabase, { action: 'reports.integrity', endpoint: path, status: 'success', actor_id: userId, entity_ids: [orgId], request_id: requestId, ip, ua });
      return json({ items: data || [] }, { status: 200, headers: { 'X-RateLimit-Remaining': String(remaining) } });
    }

    return json({ code: 'not_found' }, { status: 404 });
  } catch (e: any) {
    console.error('reports error', e?.message || e);
    await audit(supabase, { action: 'reports.error', endpoint: path, status: 'failed', reason: 'internal', actor_id: userId, entity_ids: [orgId], request_id: requestId, ip, ua });
    return json({ code: 'internal_error' }, { status: 500 });
  }
});