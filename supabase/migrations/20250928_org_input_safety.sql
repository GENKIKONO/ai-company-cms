-- Migration: 企業作成安全化 + サイト文言CMS
-- 実行日: 2025-09-28
-- 目的: 空文字入力対応、サイト設定テーブル追加、RLS強化

-- =========================================
-- A. 企業作成安全化
-- =========================================

-- 1. establishment_date を nullable に変更（空文字対応）
alter table public.organizations
  alter column establishment_date drop not null;

-- 2. slug の一意制約確保（冪等）
create unique index if not exists organizations_slug_key
  on public.organizations(slug);

-- 3. その他日付系フィールドも nullable に（将来対応）
-- 必要に応じて追加のフィールドも drop not null

-- =========================================
-- B. サイト文言CMSテーブル作成
-- =========================================

-- 1. site_settings テーブル作成
create table if not exists public.site_settings (
  id                    uuid primary key default uuid_generate_v4(),
  hero_title           text,
  hero_subtitle        text,
  representative_message text,
  footer_links         jsonb default '[]'::jsonb,
  created_at           timestamp with time zone default now(),
  updated_at           timestamp with time zone default now()
);

-- 2. updated_at トリガー設定
create trigger trg_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- 3. RLS有効化
alter table public.site_settings enable row level security;

-- 4. RLSポリシー: 全員読み取り可能
create policy site_select_all on public.site_settings
  for select using (true);

-- 5. RLSポリシー: 管理者のみ書き込み可能
-- 注意: app.admin_email は実行時にセットされることを前提
create policy site_admin_write on public.site_settings
  for all to authenticated
  using (
    auth.jwt() ->> 'email' = lower(
      coalesce(
        current_setting('app.admin_email', true),
        'admin@aiohub.jp'  -- fallback
      )
    )
  )
  with check (
    auth.jwt() ->> 'email' = lower(
      coalesce(
        current_setting('app.admin_email', true),
        'admin@aiohub.jp'  -- fallback
      )
    )
  );

-- 6. 初期データ挿入（デフォルト文言）
insert into public.site_settings (
  hero_title,
  hero_subtitle,
  representative_message
) values (
  'AIO Hub AI企業CMS',
  'AI技術を活用した企業情報の統合管理プラットフォーム',
  '私たちは、AI技術を通じて企業の情報発信を支援し、より良いビジネス成果の実現をお手伝いします。'
) on conflict (id) do nothing;

-- =========================================
-- C. 管理者設定の安全化
-- =========================================

-- 管理者メール設定のためのヘルパー関数（セキュリティ向上）
create or replace function public.set_admin_email_context()
returns void as $$
begin
  -- ADMIN_EMAIL 環境変数から設定
  perform set_config('app.admin_email', current_setting('ADMIN_EMAIL', true), true);
exception
  when others then
    -- エラー時はデフォルト値設定
    perform set_config('app.admin_email', 'admin@aiohub.jp', true);
end;
$$ language plpgsql security definer;

-- =========================================
-- D. 診断用ビュー（オプション）
-- =========================================

-- 組織作成状態の診断用ビュー
create or replace view public.organization_health as
select 
  count(*) as total_orgs,
  count(*) filter (where establishment_date is not null) as orgs_with_date,
  count(*) filter (where establishment_date is null) as orgs_without_date,
  count(distinct slug) as unique_slugs,
  max(created_at) as latest_created
from public.organizations;

-- サイト設定状態の診断用ビュー
create or replace view public.site_settings_health as
select 
  count(*) as settings_count,
  case when count(*) > 0 then 'configured' else 'default' end as status,
  max(updated_at) as last_updated
from public.site_settings;

-- =========================================
-- E. 実行確認用クエリ
-- =========================================

-- 実行後の確認クエリ（コメントアウト）
/*
-- 1. テーブル構造確認
\d public.organizations;
\d public.site_settings;

-- 2. RLS状態確認
select schemaname, tablename, rowsecurity 
from pg_tables 
where tablename in ('organizations', 'site_settings');

-- 3. 初期データ確認
select * from public.site_settings;

-- 4. 診断ビュー確認
select * from public.organization_health;
select * from public.site_settings_health;
*/