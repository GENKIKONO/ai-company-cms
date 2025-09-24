-- P0最小スコープ: プロフィール自動作成トリガー
-- auth.usersに新規ユーザーが作成されたら、自動的にapp_usersに行を追加

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.app_users (id, role)
  values (new.id, 'org_owner')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 既存のトリガーがあれば削除
drop trigger if exists on_auth_user_created on auth.users;

-- 新しいトリガーを作成
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- トリガー確認用クエリ
-- select tgname, tgrelid::regclass, tgfoid::regproc from pg_trigger where tgname = 'on_auth_user_created';