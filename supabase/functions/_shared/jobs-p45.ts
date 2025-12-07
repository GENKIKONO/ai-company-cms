/**
 * P4-5: Job Runs Integration Helpers
 * job_runs_v2 テーブル連携の統一実装
 */

type Meta = {
  job_type?: string;
  diff_strategy?: 'content_hash' | 'updated_at' | 'version';
  items_total?: number;
  items_processed?: number;
  items_skipped?: number;
  items_failed?: number;
  tables?: string[];
  langs?: string[];
  source_fields?: string[];
  idempotency_scope?: string;
  [k: string]: unknown;
};

/**
 * job_runs_v2 レコード更新の共通ヘルパー
 */
async function patchJob(id: string, body: Partial<{
  status: string;
  started_at: string | null;
  finished_at: string | null;
  retry_count: number;
  error_code: string | null;
  error_message: string | null;
  meta: Meta;
}>): Promise<void> {
  const url = new URL(`${Deno.env.get('SUPABASE_URL')}/rest/v1/job_runs_v2?id=eq.${id}`);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`job_runs_v2 patch failed: ${res.status}`);
  }
}

/**
 * ジョブ開始
 */
export async function startJob(id: string, meta?: Meta): Promise<void> {
  await patchJob(id, {
    status: 'running',
    started_at: new Date().toISOString(),
    meta
  });
}

/**
 * ジョブ成功完了
 */
export async function succeedJob(id: string, meta?: Meta): Promise<void> {
  await patchJob(id, {
    status: 'succeeded',
    finished_at: new Date().toISOString(),
    meta
  });
}

/**
 * ジョブ失敗完了
 */
export async function failJob(id: string, error: { code?: string; message?: string }, meta?: Meta): Promise<void> {
  await patchJob(id, {
    status: 'failed',
    finished_at: new Date().toISOString(),
    error_code: error.code ?? null,
    error_message: error.message ?? null,
    meta,
  });
}

/**
 * ジョブ進捗更新
 */
export async function updateProgress(id: string, meta: Meta): Promise<void> {
  await patchJob(id, { meta });
}

/**
 * 標準メタデータ生成ヘルパー
 */
export function createJobMeta(params: {
  jobType: string;
  diffStrategy: 'content_hash' | 'updated_at' | 'version';
  itemsTotal?: number;
  tables?: string[];
  langs?: string[];
  sourceFields?: string[];
  idempotencyScope?: string;
}): Meta {
  return {
    job_type: params.jobType,
    diff_strategy: params.diffStrategy,
    items_total: params.itemsTotal || 0,
    items_processed: 0,
    items_skipped: 0,
    items_failed: 0,
    tables: params.tables || [],
    langs: params.langs || [],
    source_fields: params.sourceFields || [],
    idempotency_scope: params.idempotencyScope,
  };
}

/**
 * メタデータカウンター更新ヘルパー
 */
export function updateJobMetaCounters(
  meta: Meta,
  updates: {
    processed?: number;
    skipped?: number;
    failed?: number;
  }
): Meta {
  return {
    ...meta,
    items_processed: (meta.items_processed || 0) + (updates.processed || 0),
    items_skipped: (meta.items_skipped || 0) + (updates.skipped || 0),
    items_failed: (meta.items_failed || 0) + (updates.failed || 0),
  };
}