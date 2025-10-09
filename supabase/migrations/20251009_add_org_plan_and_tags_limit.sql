-- organizations に plan（free/starter/business/enterprise）を追加。既存は free に。

-- まず既存のplan列のconstraintを確認し、必要に応じて更新
do $$
begin
  -- 既存のplan列のconstraintを削除（存在する場合）
  if exists (
    select 1 from information_schema.check_constraints 
    where constraint_name like '%plan%' 
    and table_name = 'organizations'
  ) then
    alter table organizations drop constraint if exists organizations_plan_check;
  end if;
end $$;

-- plan列が存在しない場合は追加、存在する場合は制約を更新
alter table organizations
  add column if not exists plan text not null default 'free';

-- 新しい制約を追加
alter table organizations
  add constraint organizations_plan_check 
  check (plan in ('free','starter','business','enterprise'));

-- 既存データで 'basic' -> 'starter', 'pro' -> 'business' に変換
update organizations 
set plan = case 
  when plan = 'basic' then 'starter'
  when plan = 'pro' then 'business'
  else 'free'
end
where plan in ('basic', 'pro') or plan is null;

-- タグ数は UI/サーバー両方で制御するため DB 制約は付けない（既存データ壊さないため）
-- 参考: organizations.tags が jsonb[] / text[] / jsonb のいずれかであるはず。存在しなければ UI 側で無視。

-- インデックスを追加してパフォーマンス向上
create index if not exists idx_organizations_plan on organizations(plan);
create index if not exists idx_organizations_is_published_plan on organizations(is_published, plan) where is_published = true;