-- ========================================
-- P0最小スコープ安定版: 完全版SQLセットアップ
-- ========================================
-- 目的: auth.users → app_users 自動同期（email含む）+ RLSポリシー

-- 1. app_usersテーブル構造確認（既存前提）
-- create table if not exists public.app_users (
--   id uuid references auth.users(id) primary key,
--   email text,
--   role text not null default 'org_owner',
--   partner_id uuid references public.partners(id),
--   created_at timestamp with time zone default now(),
--   updated_at timestamp with time zone default now()
-- );

-- 2. プロフィール自動作成トリガー関数
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.app_users (id, email, role, created_at, updated_at)
  values (
    new.id, 
    new.email, 
    'org_owner',
    now(),
    now()
  )
  on conflict (id) do update set
    email = new.email,
    updated_at = now();
  
  return new;
end;
$$;

-- 3. 既存のトリガーがあれば削除
drop trigger if exists on_auth_user_created on auth.users;

-- 4. 新しいトリガーを作成
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 5. RLSポリシー設定（P0最小スコープ）
alter table public.app_users enable row level security;

-- ユーザーは自分のプロフィールのみ参照・更新可能
create policy "Users can view own profile"
  on public.app_users
  for select
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.app_users
  for update
  using (auth.uid() = id);

-- サービスロールは全アクセス可（トリガー実行用）
create policy "Service role can manage all profiles"
  on public.app_users
  for all
  using (auth.role() = 'service_role');

-- 6. 確認用クエリ（実行後にコメントアウト解除して確認）
-- select tgname, tgrelid::regclass, tgfoid::regproc from pg_trigger where tgname = 'on_auth_user_created';
-- select schemaname, tablename, policyname, roles, cmd, qual from pg_policies where tablename = 'app_users';

-- 7. テスト用サンプル（実行しない - 参考用）
-- insert into auth.users (id, email) values (gen_random_uuid(), 'test@example.com');
-- select * from public.app_users where email = 'test@example.com';