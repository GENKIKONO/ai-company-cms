/**
 * reports-api Edge Function
 *
 * エンドポイント:
 * - GET /reports-api/my/reports/monthly?org=...&year=...&month=...
 * - POST /reports-api/my/reports/monthly/regenerate { org_id, year, month }
 *
 * 依存RPC (DB実装済み):
 * - get_plan_features(p_org_id uuid) RETURNS jsonb
 * - count_report_regenerations(p_org_id uuid, p_period_start date, p_period_end date) RETURNS int
 */

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const url = Deno.env.get('SUPABASE_URL')!;
const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// =====================================================
// Types
// =====================================================

interface PlanFeatures {
  monthlyReport: boolean;
  advancedAnalytics: boolean;
  [key: string]: unknown;
}

interface RegenCapResult {
  ok: boolean;
  message?: string;
  count?: number;
}

// =====================================================
// Helpers
// =====================================================

function respond(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

function parseIntStrict(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function withUser(req: Request) {
  const supa = createClient(url, anon, { auth: { persistSession: false } });
  const auth = req.headers.get('Authorization');
  if (!auth) return { supa, user: null };
  const token = auth.replace(/^Bearer\s+/i, '');
  const {
    data: { user },
    error,
  } = await supa.auth.getUser(token);
  if (error) return { supa, user: null };
  return { supa, user };
}

function toPeriod(year: number, month: number) {
  const s = new Date(Date.UTC(year, month - 1, 1));
  const e = new Date(Date.UTC(year, month, 0));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(s), end: iso(e) };
}

// =====================================================
// RPC Wrappers (DB実装済み)
// =====================================================

/**
 * 組織のプラン機能を取得
 * RPC: get_plan_features(p_org_id uuid) RETURNS jsonb
 *
 * 返却例: { monthly_report: true, advanced_analytics: false, ... }
 */
async function getPlanFeatures(orgId: string): Promise<PlanFeatures> {
  const admin = createClient(url, service, { auth: { persistSession: false } });

  const { data, error } = await admin.rpc('get_plan_features', {
    p_org_id: orgId,
  });

  if (error) {
    console.warn('[get_plan_features] RPC error (fallback to defaults):', {
      orgId,
      error: error.message,
      code: error.code,
    });
    // RPC失敗時は安全側に倒す（基本機能のみ許可）
    return { monthlyReport: true, advancedAnalytics: false };
  }

  // DBから返却されるjsonbをパース
  // DB側の命名規則 (snake_case) → コード側 (camelCase)
  const features = data as Record<string, unknown> | null;

  if (!features) {
    console.warn('[get_plan_features] No features returned for org:', orgId);
    return { monthlyReport: true, advancedAnalytics: false };
  }

  return {
    monthlyReport: Boolean(features.monthly_report ?? features.monthlyReport ?? true),
    advancedAnalytics: Boolean(features.advanced_analytics ?? features.advancedAnalytics ?? false),
    ...features,
  };
}

/**
 * レポート再生成回数をチェック
 * RPC: count_report_regenerations(p_org_id uuid, p_period_start date, p_period_end date) RETURNS int
 *
 * 上限: 3回/月
 */
async function ensureRegenCap(
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<RegenCapResult> {
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const MAX_REGENERATIONS = 3;

  const { data: count, error } = await admin.rpc('count_report_regenerations', {
    p_org_id: orgId,
    p_period_start: periodStart,
    p_period_end: periodEnd,
  });

  if (error) {
    console.error('[count_report_regenerations] RPC error:', {
      orgId,
      periodStart,
      periodEnd,
      error: error.message,
      code: error.code,
    });
    // RPC失敗時は許可（機能をブロックしない）
    // ただしログに記録
    return { ok: true, count: -1 };
  }

  const regenCount = typeof count === 'number' ? count : 0;

  console.info('[count_report_regenerations] Result:', {
    orgId,
    periodStart,
    periodEnd,
    count: regenCount,
    limit: MAX_REGENERATIONS,
  });

  if (regenCount >= MAX_REGENERATIONS) {
    return {
      ok: false,
      message: `今月の再生成回数上限（${MAX_REGENERATIONS}回）に達しました。`,
      count: regenCount,
    };
  }

  return { ok: true, count: regenCount };
}

// =====================================================
// Main Handler
// =====================================================

Deno.serve(async (req) => {
  try {
    const { supa, user } = await withUser(req);
    const urlObj = new URL(req.url);

    // =========================================================
    // GET: 月次レポート取得
    // =========================================================
    if (req.method === 'GET' && urlObj.pathname.endsWith('/reports-api/my/reports/monthly')) {
      const org = urlObj.searchParams.get('org');
      const year = parseIntStrict(urlObj.searchParams.get('year'));
      const month = parseIntStrict(urlObj.searchParams.get('month'));

      if (!org || !year || !month) {
        return respond({ error: 'org/year/month are required' }, { status: 400 });
      }

      const { start } = toPeriod(year, month);

      // 1. プラン機能チェック
      const features = await getPlanFeatures(org);
      if (!features.monthlyReport) {
        return respond(
          {
            error: 'ご利用のプランではこの機能は利用できません。プラン変更をご検討ください。',
            code: 'FEATURE_NOT_AVAILABLE',
          },
          { status: 403 }
        );
      }

      // 2. レポート取得 (RLSが組織メンバーのみに制限)
      const { data, error } = await supa
        .from('ai_monthly_reports')
        .select(
          'id, plan_id, level, status, summary_text, metrics, sections, suggestions, period_start, period_end'
        )
        .eq('organization_id', org)
        .eq('period_start', start)
        .maybeSingle();

      if (error) {
        console.error('[GET monthly report] Query error:', error);
        throw error;
      }

      // 3. 高度な分析機能が無効な場合、advancedセクションを除外
      if (data && !features.advancedAnalytics) {
        const clone = structuredClone(data);
        if (clone.sections && typeof clone.sections === 'object') {
          delete (clone.sections as Record<string, unknown>).advanced;
        }
        return respond(clone);
      }

      return respond(data ?? null);
    }

    // =========================================================
    // POST: レポート再生成リクエスト
    // =========================================================
    if (req.method === 'POST' && urlObj.pathname.endsWith('/reports-api/my/reports/monthly/regenerate')) {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      const org = body.org_id as string;
      const year = Number(body.year);
      const month = Number(body.month);

      if (!org || !Number.isFinite(year) || !Number.isFinite(month)) {
        return respond({ error: 'org_id/year/month are required' }, { status: 400 });
      }

      const { start, end } = toPeriod(year, month);

      // 1. プラン機能チェック
      const features = await getPlanFeatures(org);
      if (!features.monthlyReport) {
        return respond(
          {
            error: 'ご利用のプランではこの機能は利用できません。プラン変更をご検討ください。',
            code: 'FEATURE_NOT_AVAILABLE',
          },
          { status: 403 }
        );
      }

      // 2. 再生成回数チェック (3回/月)
      const cap = await ensureRegenCap(org, start, end);
      if (!cap.ok) {
        return respond(
          {
            error: cap.message,
            code: 'REGENERATION_LIMIT_EXCEEDED',
            current_count: cap.count,
          },
          { status: 429 }
        );
      }

      // 3. ジョブをキューに追加
      const admin = createClient(url, service, { auth: { persistSession: false } });
      const meta = { organization_id: org, period_start: start, period_end: end };

      const { error: insErr } = await admin
        .from('job_runs_v2')
        .insert({ job_name: 'monthly_report_regen', status: 'pending', meta });

      if (insErr) {
        console.error('[POST regenerate] Job insert error:', insErr);
        throw insErr;
      }

      // 4. 再生成ログを記録
      const { error: logErr } = await admin
        .from('report_regeneration_logs')
        .insert({ organization_id: org, period_start: start, period_end: end });

      if (logErr) {
        console.error('[POST regenerate] Log insert error:', logErr);
        // ログ記録失敗は致命的でないため続行
      }

      console.info('[POST regenerate] Job queued:', {
        orgId: org,
        period: { start, end },
        regenerationCount: (cap.count ?? 0) + 1,
      });

      return respond(
        {
          status: 'queued',
          regeneration_count: (cap.count ?? 0) + 1,
        },
        { status: 202 }
      );
    }

    return new Response('Not Found', { status: 404 });
  } catch (e) {
    console.error('[reports-api] Unhandled error:', e);
    return respond(
      {
        error: e instanceof Error ? e.message : 'unexpected error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
});
