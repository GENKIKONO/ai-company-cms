// supabase/functions/reports-api/index.ts
// Implements:
// - GET /reports-api/my/reports/monthly?org=...&year=...&month=...
// - POST /reports-api/my/reports/monthly/regenerate { org_id, year, month }
// Notes:
// - Requires auth token (anon key OK but should be authenticated in app). For DB, RLS should enforce org membership.
// - Enforces plan features and regeneration caps.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const url = Deno.env.get("SUPABASE_URL")!;
const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function respond(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" }, ...init });
}

function parseIntStrict(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function withUser(req: Request) {
  const supa = createClient(url, anon, { auth: { persistSession: false } });
  const auth = req.headers.get("Authorization");
  if (!auth) return { supa, user: null };
  const token = auth.replace(/^Bearer\s+/i, "");
  const { data: { user }, error } = await supa.auth.getUser(token);
  if (error) return { supa, user: null };
  return { supa, user };
}

async function getPlanFeatures(org_id: string) {
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data, error } = await admin.rpc("get_plan_features", { p_org_id: org_id });
  if (error) throw error;
  return data as any;
}

async function ensureRegenCap(org_id: string, period_start: string, period_end: string) {
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: cnt, error } = await admin.rpc("count_report_regenerations", { p_org_id: org_id, p_period_start: period_start, p_period_end: period_end });
  if (error) throw error;
  if ((cnt ?? 0) >= 3) {
    return { ok: false, message: "今月の再生成回数上限に達しました。" };
  }
  return { ok: true };
}

function toPeriod(year: number, month: number) {
  const s = new Date(Date.UTC(year, month - 1, 1));
  const e = new Date(Date.UTC(year, month, 0));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(s), end: iso(e) };
}

Deno.serve(async (req) => {
  try {
    const { supa, user } = await withUser(req);
    const urlObj = new URL(req.url);

    // GET monthly report
    if (req.method === "GET" && urlObj.pathname.endsWith("/reports-api/my/reports/monthly")) {
      const org = urlObj.searchParams.get("org");
      const year = parseIntStrict(urlObj.searchParams.get("year"));
      const month = parseIntStrict(urlObj.searchParams.get("month"));
      if (!org || !year || !month) return respond({ error: "org/year/month are required" }, { status: 400 });
      const { start, end } = toPeriod(year, month);

      // Plan features
      const features = await getPlanFeatures(org);
      if (!features?.monthlyReport) {
        return respond({ error: "ご利用のプランではこの機能は利用できません。プラン変更をご検討ください。" }, { status: 403 });
      }

      // Fetch report (RLS should allow only org members)
      const { data, error } = await supa
        .from("ai_monthly_reports")
        .select("plan_id, level, status, summary_text, metrics, sections, suggestions, period_start, period_end")
        .eq("organization_id", org)
        .eq("period_start", start)
        .eq("period_end", end)
        .maybeSingle();
      if (error) throw error;

      // Hide advanced sections if not allowed
      if (data && features && !features.advancedAnalytics) {
        const clone = structuredClone(data);
        if (clone.sections && typeof clone.sections === "object") {
          delete clone.sections.advanced;
        }
        return respond({ ...clone, plan_id: data.plan_id, level: data.level });
      }
      return respond(data ?? null);
    }

    // POST regenerate
    if (req.method === "POST" && urlObj.pathname.endsWith("/reports-api/my/reports/monthly/regenerate")) {
      const body = await req.json().catch(() => ({}));
      const org = body.org_id as string;
      const year = Number(body.year);
      const month = Number(body.month);
      if (!org || !Number.isFinite(year) || !Number.isFinite(month)) return respond({ error: "org_id/year/month are required" }, { status: 400 });
      const { start, end } = toPeriod(year, month);

      // Plan features
      const features = await getPlanFeatures(org);
      if (!features?.monthlyReport) {
        return respond({ error: "ご利用のプランではこの機能は利用できません。プラン変更をご検討ください。" }, { status: 403 });
      }

      // Regen cap (3 times / month)
      const cap = await ensureRegenCap(org, start, end);
      if (!cap.ok) return respond({ error: cap.message }, { status: 429 });

      // Enqueue job into job_runs_v2 as pending
      const admin = createClient(url, service, { auth: { persistSession: false } });
      const meta = { organization_id: org, period_start: start, period_end: end };
      const { error: insErr } = await admin.from("job_runs_v2").insert({ job_name: "monthly_report_regen", status: "pending", meta });
      if (insErr) throw insErr;

      // Log regeneration
      await admin.from("report_regeneration_logs").insert({ organization_id: org, period_start: start, period_end: end }).throwOnError();

      return respond({ status: "queued" }, { status: 202 });
    }

    return new Response("Not Found", { status: 404 });
  } catch (e) {
    return respond({ error: e?.message ?? "unexpected" }, { status: 500 });
  }
});