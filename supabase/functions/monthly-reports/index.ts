import { createClient } from "npm:@supabase/supabase-js@2.46.1";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  global: { headers: { 'X-Client-Info': 'monthly-reports-fn@1.2.0' } }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

function badRequest(message: string) {
  return json({ error: message }, 400);
}

async function getStarterCaps(orgId: string) {
  const { data, error } = await supabase
    .from('view_ai_starter_caps_current')
    .select('*')
    .eq('organization_id', orgId)
    .maybeSingle();
  if (error) throw error;
  return data || { organization_id: orgId, month_bucket: null, interview_count: 0, generation_count: 0, citation_count: 0 };
}

async function logUsage(orgId: string, usageType: 'interview'|'generation'|'citation', createdBy?: string) {
  const { error } = await supabase.from('ai_usage_events').insert({
    organization_id: orgId,
    usage_type: usageType,
    created_by: createdBy ?? null
  });
  if (error) throw error;
}

async function getRegenAllowance(orgId: string) {
  const { data, error } = await supabase
    .from('view_report_regen_limit_current')
    .select('*')
    .eq('organization_id', orgId)
    .maybeSingle();
  if (error) throw error;
  return data || { organization_id: orgId, month_bucket: null, regen_count: 0, can_regenerate: true };
}

async function logRegeneration(orgId: string, createdBy?: string) {
  const { error } = await supabase.from('report_regeneration_logs').insert({
    organization_id: orgId,
    created_by: createdBy ?? null,
  });
  if (error) throw error;
}

async function seedLastMonthViaRPC() {
  const { error } = await supabase.rpc('seed_ai_monthly_reports_last_month');
  if (error) throw error;
  return { ok: true };
}

async function markLatestReportPending(orgId: string) {
  const { data, error } = await supabase
    .from('ai_monthly_reports')
    .select('id')
    .eq('organization_id', orgId)
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { updated: 0 };
  const { error: upErr } = await supabase
    .from('ai_monthly_reports')
    .update({ status: 'pending' })
    .eq('id', data.id);
  if (upErr) throw upErr;
  return { updated: 1 };
}

async function processOneJob() {
  // pick one queued job
  const { data: jobRow, error: pickErr } = await supabase
    .from('report_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (pickErr) throw pickErr;
  if (!jobRow) return { processed: 0 };

  // move to processing (optimistic lock)
  const { error: toProcErr } = await supabase
    .from('report_jobs')
    .update({ status: 'processing', attempts: jobRow.attempts + 1 })
    .eq('id', jobRow.id)
    .eq('status', 'queued');
  if (toProcErr) throw toProcErr;

  try {
    // simulate generation
    const generated = {
      summary_text: 'This is an auto-generated monthly report summary.',
      sections: [{ title: 'Overview', content: 'Generated content...' }],
      suggestions: [{ type: 'tip', text: 'Try posting more case studies next month.' }]
    };

    const { error: upReportErr } = await supabase
      .from('ai_monthly_reports')
      .update({ 
        status: 'ready',
        summary_text: generated.summary_text,
        sections: generated.sections,
        suggestions: generated.suggestions
      })
      .eq('id', jobRow.report_id);
    if (upReportErr) throw upReportErr;

    // Realtime broadcast notify (private channel)
    await fetch(`${SUPABASE_URL}/realtime/v1/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: `report:${jobRow.organization_id}:monthly`,
        event: 'report_ready',
        payload: { report_id: jobRow.report_id },
        private: true
      })
    });

    const { error: doneErr } = await supabase
      .from('report_jobs')
      .update({ status: 'done', last_error: null })
      .eq('id', jobRow.id);
    if (doneErr) throw doneErr;

    return { processed: 1, report_id: jobRow.report_id };
  } catch (e) {
    const { error: failErr } = await supabase
      .from('report_jobs')
      .update({ status: 'failed', last_error: String(e?.message ?? e) })
      .eq('id', jobRow.id);
    if (failErr) console.error('mark failed err', failErr);
    throw e;
  }
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (req.method === 'POST' && pathname.endsWith('/check-and-log-usage')) {
      const { organization_id, usage_type, created_by } = await req.json();
      if (!organization_id || !usage_type) return badRequest('organization_id and usage_type are required');
      if (!['interview','generation','citation'].includes(usage_type)) return badRequest('invalid usage_type');

      const caps = await getStarterCaps(organization_id);
      if (usage_type === 'interview' && caps.interview_count >= 5)
        return json({ allowed: false, reason: 'interview cap reached (5/mon)' }, 403);
      if (usage_type === 'generation' && caps.generation_count >= 5)
        return json({ allowed: false, reason: 'generation cap reached (5/mon)' }, 403);
      if (usage_type === 'citation' && caps.citation_count >= 5)
        return json({ allowed: false, reason: 'citation cap reached (5/mon)' }, 403);

      await logUsage(organization_id, usage_type as any, created_by);
      return json({ allowed: true });
    }

    if (req.method === 'POST' && pathname.endsWith('/regenerate')) {
      const { organization_id, created_by } = await req.json();
      if (!organization_id) return badRequest('organization_id is required');

      const allow = await getRegenAllowance(organization_id);
      if (!allow.can_regenerate) return json({ allowed: false, reason: 'monthly regeneration limit reached (3)' }, 429);

      await logRegeneration(organization_id, created_by);
      const pending = await markLatestReportPending(organization_id).catch((e) => ({ error: e?.message ?? String(e) }));
      return json({ allowed: true, pending });
    }

    if (req.method === 'POST' && pathname.endsWith('/seed-last-month')) {
      const r = await seedLastMonthViaRPC();
      return json(r);
    }

    if (req.method === 'POST' && pathname.endsWith('/process-one')) {
      const r = await processOneJob();
      return json(r);
    }

    if (req.method === 'GET' && /\/monthly-reports\/.+\/current$/.test(pathname)) {
      const parts = pathname.split('/');
      const orgId = parts[2];
      if (!orgId) return badRequest('organization_id missing in path');

      const { data: planRow, error: planErr } = await supabase
        .from('view_org_plans')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();
      if (planErr) throw planErr;

      const { data: reportRows, error: reportErr } = await supabase
        .from('ai_monthly_reports')
        .select('*')
        .eq('organization_id', orgId)
        .order('period_start', { ascending: false })
        .limit(1);
      if (reportErr) throw reportErr;

      return json({ plan: planRow, report: reportRows?.[0] ?? null });
    }

    return json({ error: 'Not found' }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});