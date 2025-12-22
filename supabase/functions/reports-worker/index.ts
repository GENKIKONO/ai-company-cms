// supabase/functions/reports-worker/index.ts
// Worker: monthly_report_regen processor (poll job_runs_v2)
// Routes:
// - POST /reports-worker/run { limit?: number }
//
// Notes:
// - Uses service role; ensure this function is locked behind dashboard or internal call
// - Dummy processor updates ai_monthly_reports to ready and writes success in job_runs_v2

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" }, ...init });
const bad = (m: string) => json({ error: m }, { status: 400 });

async function fetchPending(limit = 5) {
  const { data, error } = await admin
    .from("job_runs_v2")
    .select("id, job_name, status, meta, created_at")
    .eq("job_name", "monthly_report_regen")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

async function markRunning(id: string) {
  const { error } = await admin.from("job_runs_v2").update({ status: "running", started_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

async function markDone(id: string) {
  const { error } = await admin.from("job_runs_v2").update({ status: "succeeded", finished_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

async function markFailed(id: string, code?: string, message?: string) {
  const { error } = await admin.from("job_runs_v2").update({ status: "failed", error_code: code ?? null, error_message: message ?? null, finished_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

async function processMonthlyReport(job: any) {
  const meta = job.meta || {};
  const org_id = meta.organization_id as string;
  const period_start = meta.period_start as string;
  const period_end = meta.period_end as string;
  if (!org_id || !period_start || !period_end) throw new Error("missing meta");

  // Dummy: upsert a ready report
  const { data: existing, error: selErr } = await admin
    .from("ai_monthly_reports")
    .select("id")
    .eq("organization_id", org_id)
    .eq("period_start", period_start)
    .eq("period_end", period_end)
    .maybeSingle();
  if (selErr) throw selErr;

  const payload = {
    organization_id: org_id,
    plan_id: "starter",
    level: "standard",
    period_start,
    period_end,
    status: "ready",
    summary_text: "Auto generated (dummy)",
    metrics: {},
    sections: { overview: { kpis: [] } },
    suggestions: [],
  };

  if (existing) {
    const { error } = await admin.from("ai_monthly_reports").update(payload).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await admin.from("ai_monthly_reports").insert(payload);
    if (error) throw error;
  }
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (req.method !== "POST" || !url.pathname.endsWith("/reports-worker/run")) return new Response("Not Found", { status: 404 });
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit ?? 5), 20);

    const jobs = await fetchPending(limit);
    const results: any[] = [];

    for (const j of jobs) {
      try {
        await markRunning(j.id);
        await processMonthlyReport(j);
        await markDone(j.id);
        results.push({ id: j.id, ok: true });
      } catch (e) {
        await markFailed(j.id, e?.code, e?.message);
        results.push({ id: j.id, ok: false, error: e?.message });
      }
    }

    return json({ processed: results.length, results });
  } catch (e) {
    return json({ error: e?.message ?? "unexpected" }, { status: 500 });
  }
});