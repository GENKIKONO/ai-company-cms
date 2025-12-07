-- P1-5: idempotency key 管理テーブル作成
-- Edge Functions での重複実行防止用

create table if not exists public.idempotency_keys (
  id text primary key,                    -- idempotency key (UUID or external event_id)
  scope text not null default 'default', -- scope分離 ('stripe:webhook', 'ai:interview' 等)
  function_name text not null,            -- 実行したEdge Function名
  user_id uuid,                           -- 実行ユーザー (authenticated時)
  organization_id uuid,                   -- 組織ID (組織コンテキストでの実行時)
  request_data jsonb,                     -- リクエストデータのハッシュまたは重要部分
  response_data jsonb,                    -- 初回実行結果
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'), -- TTL (24時間)
  
  -- 複合UNIQUE制約でscope+id重複防止
  unique(scope, id)
);

-- インデックス: 有効期限による自動クリーンアップ用
create index if not exists idx_idempotency_keys_expires_at 
on public.idempotency_keys (expires_at);

-- インデックス: function_name + created_at でのパフォーマンス向上
create index if not exists idx_idempotency_keys_function_created 
on public.idempotency_keys (function_name, created_at desc);

-- RLS有効化 (service_role_auditに合わせる)
alter table public.idempotency_keys enable row level security;

-- RLS Policy: authenticated ユーザーは自分のレコードのみ参照可能
create policy "Users can view own idempotency keys" on public.idempotency_keys
  for select to authenticated
  using (auth.uid() = user_id);

-- RLS Policy: service_role は全権限 (Edge Functions での操作用)
create policy "Service role full access" on public.idempotency_keys
  for all to service_role
  using (true)
  with check (true);

-- 期限切れレコードの自動削除用関数 (cron job用)
create or replace function public.cleanup_expired_idempotency_keys()
returns void
language sql
security definer
as $$
  delete from public.idempotency_keys 
  where expires_at < now();
$$;

-- 更新時刻自動更新のトリガー
create or replace function public.update_idempotency_keys_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_idempotency_keys_updated_at on public.idempotency_keys;
create trigger update_idempotency_keys_updated_at
  before update on public.idempotency_keys
  for each row execute function public.update_idempotency_keys_updated_at();