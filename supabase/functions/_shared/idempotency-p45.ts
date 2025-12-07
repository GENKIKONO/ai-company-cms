/**
 * P4-5: Idempotency Key Management (Differential Updates)
 * Supabaseアシスタント提供の統一キー生成ルール実装
 */

export type IdempotencyBase = {
  orgId: string;
  operation: 'translate' | 'embed' | 'public_sync' | string;
  sourceTable: string;
  sourceId: string | '-'; // '-' allowed for non-record jobs
  sourceField: string;
  langOrDash?: string; // '-' when N/A
  contentHash: string;
};

export function buildKey(b: IdempotencyBase): string {
  const lang = (b.langOrDash && b.langOrDash.length > 0) ? b.langOrDash : '-';
  return [
    `org:${b.orgId}`,
    b.operation,
    b.sourceTable,
    b.sourceId,
    b.sourceField,
    lang,
    b.contentHash,
  ].join(':');
}

export function buildTranslateKey(params: {
  orgId: string;
  sourceTable: string;
  sourceId: string;
  sourceField: string;
  sourceLang: string;
  targetLang: string;
  contentHash: string;
}) {
  const langPart = `${params.sourceLang}->${params.targetLang}`;
  return buildKey({
    orgId: params.orgId,
    operation: 'translate',
    sourceTable: params.sourceTable,
    sourceId: params.sourceId,
    sourceField: params.sourceField,
    langOrDash: langPart,
    contentHash: params.contentHash,
  });
}

export function buildEmbeddingKey(params: {
  orgId: string;
  sourceTable: string;
  sourceId: string;
  sourceField: string;
  lang: string;
  contentHash: string;
}) {
  return buildKey({
    orgId: params.orgId,
    operation: 'embed',
    sourceTable: params.sourceTable,
    sourceId: params.sourceId,
    sourceField: params.sourceField,
    langOrDash: params.lang,
    contentHash: params.contentHash,
  });
}

export async function registerIdempotencyKey(input: {
  functionName: string;
  key: string;
  requestHash?: string;
}): Promise<void> {
  const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/idempotency_keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      key: input.key,
      function_name: input.functionName,
      request_hash: input.requestHash ?? null,
      status: 'pending',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    // UNIQUE制約違反は正常なidempotencyスキップとして扱う
    if (res.status === 409 || res.status === 422) {
      return; // スキップ処理として成功扱い
    }
    throw new Error(`registerIdempotencyKey failed: ${res.status} ${text}`);
  }
}

export async function completeIdempotencyKey(input: {
  functionName: string;
  key: string;
  response?: unknown;
}): Promise<void> {
  const url = new URL(`${Deno.env.get('SUPABASE_URL')}/rest/v1/idempotency_keys`);
  url.searchParams.set('function_name', `eq.${input.functionName}`);
  url.searchParams.set('key', `eq.${input.key}`);

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      status: 'completed',
      response: input.response ?? null
    }),
  });

  if (!res.ok) {
    throw new Error(`completeIdempotencyKey failed: ${res.status}`);
  }
}

export async function failIdempotencyKey(input: {
  functionName: string;
  key: string;
  errorCode?: string;
  errorMessage?: string;
}): Promise<void> {
  const url = new URL(`${Deno.env.get('SUPABASE_URL')}/rest/v1/idempotency_keys`);
  url.searchParams.set('function_name', `eq.${input.functionName}`);
  url.searchParams.set('key', `eq.${input.key}`);

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      status: 'failed',
      error_code: input.errorCode ?? null,
      error_message: input.errorMessage ?? null,
    }),
  });

  if (!res.ok) {
    throw new Error(`failIdempotencyKey failed: ${res.status}`);
  }
}