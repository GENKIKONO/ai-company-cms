-- 必須拡張（gen_random_uuid / 大文字小文字無視のuniqueに備えたcitext）
create extension if not exists pgcrypto;
create extension if not exists citext;

-- Organizations（企業）
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  legal_form text,
  representative_name text,
  founded date,
  capital numeric,
  employees integer,
  description text not null,
  address_country text not null default 'JP',
  address_region text not null,
  address_locality text not null,
  street_address text,
  postal_code text,
  telephone text not null,
  email text,
  email_public boolean default false,
  url text not null,
  logo_url text,
  same_as jsonb default '[]'::jsonb,
  gbp_url text,
  industries jsonb default '[]'::jsonb,
  eeat text,
  status text not null default 'draft' check (status in ('draft','waiting_approval','published','paused','archived')),
  owner_user_id uuid,
  partner_id uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Services（提供サービス/商品）
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  summary text not null,
  features jsonb default '[]'::jsonb,
  price text,
  category text,
  media jsonb default '[]'::jsonb,
  cta_url text,
  status text default 'draft' check (status in ('draft','published')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- CaseStudies（導入事例）
create table if not exists case_studies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  client_type text,
  client_name text,
  problem text,
  solution text,
  outcome text,
  metrics jsonb default '[]'::jsonb,
  published_at date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- FAQs
create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ContactPoints
create table if not exists contact_points (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  area_served jsonb default '[]'::jsonb,
  contact_type text not null check (contact_type in ('sales','support')),
  telephone text,
  email text,
  available_language jsonb default '["ja"]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Users (app-level)
create table if not exists app_users (
  id uuid primary key,        -- supabase.auth.users.id と一致
  role text not null check (role in ('admin','partner','org_owner','org_editor','viewer')),
  partner_id uuid,
  created_at timestamp with time zone default now()
);

-- Partners（代理店）
create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text not null,
  brand_logo_url text,
  subdomain text unique,
  commission_rate_init numeric default 0,
  commission_rate_mrr numeric default 0,
  created_at timestamp with time zone default now()
);

-- Subscriptions
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  plan text not null check (plan in ('basic','pro')),
  status text not null check (status in ('active','paused','cancelled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- AuditLogs
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  entity text not null,
  entity_id uuid not null,
  action text not null check (action in ('create','update','publish','approve')),
  diff jsonb,
  created_at timestamp with time zone default now()
);

-- Redirects（301用・任意）
create table if not exists redirects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  from_path text not null,
  to_path text not null,
  created_at timestamp with time zone default now()
);

-- よく使う外部キー/状態にインデックス
create index if not exists idx_services_org_id on services (org_id);
create index if not exists idx_case_studies_org_id on case_studies (org_id);
create index if not exists idx_faqs_org_id on faqs (org_id);
create index if not exists idx_contact_points_org_id on contact_points (org_id);
create index if not exists idx_subscriptions_org_id on subscriptions (org_id);
create index if not exists idx_organizations_status on organizations (status);
create index if not exists idx_organizations_partner_id on organizations (partner_id);
create index if not exists idx_organizations_owner_user_id on organizations (owner_user_id);
create index if not exists idx_app_users_partner_id on app_users (partner_id);

-- slug 自動生成（name変更時など）
create or replace function gen_slug_from_name(n text) returns text language sql immutable as $$
  select regexp_replace(lower(n), '[^a-z0-9]+', '-', 'g')
$$;

create or replace function organizations_set_slug()
returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := gen_slug_from_name(new.name);
  end if;
  return new;
end $$;

create trigger tg_org_set_slug before insert or update of name, slug on organizations
for each row execute procedure organizations_set_slug();

-- updated_at trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger tg_org_updated before update on organizations for each row execute procedure set_updated_at();
create trigger tg_srv_updated before update on services for each row execute procedure set_updated_at();
create trigger tg_cs_updated  before update on case_studies for each row execute procedure set_updated_at();
create trigger tg_faq_updated before update on faqs for each row execute procedure set_updated_at();
create trigger tg_cp_updated  before update on contact_points for each row execute procedure set_updated_at();
create trigger tg_sub_updated before update on subscriptions for each row execute procedure set_updated_at();

-- 監査ログ自動挿入トリガー
create or replace function audit_log_trigger()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    insert into audit_logs (actor_user_id, entity, entity_id, action, diff)
    values (auth.uid(), TG_TABLE_NAME, new.id, 'create', to_jsonb(new));
    return new;
  elsif TG_OP = 'UPDATE' then
    insert into audit_logs (actor_user_id, entity, entity_id, action, diff)
    values (auth.uid(), TG_TABLE_NAME, new.id, 'update', 
      jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new)));
    return new;
  elsif TG_OP = 'DELETE' then
    insert into audit_logs (actor_user_id, entity, entity_id, action, diff)
    values (auth.uid(), TG_TABLE_NAME, old.id, 'delete', to_jsonb(old));
    return old;
  end if;
  return null;
end $$;

-- 監査ログトリガーを主要テーブルに適用
create trigger audit_organizations after insert or update or delete on organizations
for each row execute procedure audit_log_trigger();

create trigger audit_services after insert or update or delete on services
for each row execute procedure audit_log_trigger();

create trigger audit_case_studies after insert or update or delete on case_studies
for each row execute procedure audit_log_trigger();

create trigger audit_faqs after insert or update or delete on faqs
for each row execute procedure audit_log_trigger();

-- RLS有効化
alter table organizations enable row level security;
alter table services enable row level security;
alter table case_studies enable row level security;
alter table faqs enable row level security;
alter table contact_points enable row level security;
alter table subscriptions enable row level security;
alter table app_users enable row level security;
alter table partners enable row level security;
alter table audit_logs enable row level security;
alter table redirects enable row level security;

-- RLSポリシー: Organizations
-- admin: 全権限
create policy org_admin_select on organizations
for select using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy org_admin_insert on organizations
for insert with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy org_admin_update on organizations
for update using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'))
with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy org_admin_delete on organizations
for delete using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

-- partner: 自社配下のみ
create policy org_partner_select on organizations
for select using (partner_id in (select partner_id from app_users where id = auth.uid()));

create policy org_partner_insert on organizations
for insert with check (partner_id in (select partner_id from app_users where id = auth.uid()));

create policy org_partner_update on organizations
for update using (partner_id in (select partner_id from app_users where id = auth.uid()))
with check (partner_id in (select partner_id from app_users where id = auth.uid()));

-- org_owner: 自社Orgのみ更新可
create policy org_owner_select on organizations
for select using (owner_user_id = auth.uid());

create policy org_owner_update on organizations
for update using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- RLSポリシー: Services
-- admin: 全権限
create policy svc_admin_select on services
for select using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy svc_admin_insert on services
for insert with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy svc_admin_update on services
for update using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'))
with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy svc_admin_delete on services
for delete using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

-- owner/partner: 親orgの権限に基づく
create policy svc_owner_partner_select on services
for select using (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

create policy svc_owner_partner_insert on services
for insert with check (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

create policy svc_owner_partner_update on services
for update using (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

create policy svc_owner_partner_delete on services
for delete using (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

-- RLSポリシー: Case Studies
create policy cs_admin_select on case_studies
for select using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy cs_admin_insert on case_studies
for insert with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy cs_admin_update on case_studies
for update using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'))
with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy cs_admin_delete on case_studies
for delete using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy cs_owner_partner_select on case_studies
for select using (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

create policy cs_owner_partner_insert on case_studies
for insert with check (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

create policy cs_owner_partner_update on case_studies
for update using (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

create policy cs_owner_partner_delete on case_studies
for delete using (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

-- RLSポリシー: FAQs
create policy faq_admin_select on faqs
for select using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy faq_admin_insert on faqs
for insert with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy faq_admin_update on faqs
for update using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'))
with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy faq_admin_delete on faqs
for delete using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy faq_owner_partner_select on faqs
for select using (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

create policy faq_owner_partner_insert on faqs
for insert with check (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

create policy faq_owner_partner_update on faqs
for update using (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

create policy faq_owner_partner_delete on faqs
for delete using (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

-- RLSポリシー: Contact Points
create policy cp_admin_select on contact_points
for select using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy cp_admin_insert on contact_points
for insert with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy cp_admin_update on contact_points
for update using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'))
with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy cp_admin_delete on contact_points
for delete using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy cp_owner_partner_select on contact_points
for select using (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

create policy cp_owner_partner_insert on contact_points
for insert with check (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

create policy cp_owner_partner_update on contact_points
for update using (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

create policy cp_owner_partner_delete on contact_points
for delete using (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

-- RLSポリシー: App Users
create policy app_users_self_admin on app_users
for all using (id = auth.uid() or exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'))
with check (id = auth.uid() or exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

-- RLSポリシー: Partners
create policy partners_admin on partners
for all using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'))
with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy partners_self on partners
for select using (id in (select partner_id from app_users where id = auth.uid()));

-- RLSポリシー: Subscriptions
create policy sub_admin_select on subscriptions
for select using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy sub_admin_insert on subscriptions
for insert with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy sub_admin_update on subscriptions
for update using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'))
with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy sub_owner_partner_select on subscriptions
for select using (org_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

-- RLSポリシー: Audit Logs
create policy audit_admin_select on audit_logs
for select using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

-- RLSポリシー: Redirects
create policy redirect_admin_select on redirects
for select using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy redirect_admin_insert on redirects
for insert with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy redirect_admin_update on redirects
for update using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'))
with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy redirect_admin_delete on redirects
for delete using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

-- Approval History（承認履歴）
create table if not exists approval_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  action text not null check (action in ('request_sent','approved','rejected')),
  actor_user_id uuid,
  actor_email text not null,
  recipient_email text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Stripe Products（Stripe商品管理）
create table if not exists stripe_products (
  id uuid primary key default gen_random_uuid(),
  stripe_product_id text unique not null,
  stripe_price_id text unique not null,
  product_type text not null check (product_type in ('setup_fee','monthly_fee')),
  name text not null,
  description text,
  amount integer not null,
  currency text not null default 'jpy',
  recurring_interval text check (recurring_interval in ('month','year')),
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Stripe Customers（Stripe顧客管理）
create table if not exists stripe_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid unique not null references organizations(id) on delete cascade,
  stripe_customer_id text unique not null,
  email text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Webhook Events（Webhook イベント処理履歴）
create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  event_type text not null,
  processed boolean default false,
  retry_count integer default 0,
  last_attempt timestamp with time zone default now(),
  processed_at timestamp with time zone,
  error_message text,
  event_data jsonb,
  created_at timestamp with time zone default now()
);

-- approval_historyのRLS有効化
alter table approval_history enable row level security;
alter table stripe_products enable row level security;
alter table stripe_customers enable row level security;
alter table webhook_events enable row level security;

-- RLSポリシー: Approval History
create policy approval_admin_select on approval_history
for select using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy approval_admin_insert on approval_history
for insert with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy approval_owner_partner_select on approval_history
for select using (organization_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

-- RLSポリシー: Stripe Products
create policy stripe_products_admin_select on stripe_products
for select using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy stripe_products_admin_insert on stripe_products
for insert with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy stripe_products_admin_update on stripe_products
for update using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'))
with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy stripe_products_admin_delete on stripe_products
for delete using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

-- RLSポリシー: Stripe Customers
create policy stripe_customers_admin_select on stripe_customers
for select using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy stripe_customers_admin_insert on stripe_customers
for insert with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy stripe_customers_admin_update on stripe_customers
for update using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'))
with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy stripe_customers_owner_partner_select on stripe_customers
for select using (organization_id in (
  select id from organizations 
  where owner_user_id = auth.uid() 
     or partner_id in (select partner_id from app_users where id = auth.uid())
));

-- RLSポリシー: Webhook Events
create policy webhook_events_admin_select on webhook_events
for select using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy webhook_events_admin_insert on webhook_events
for insert with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

create policy webhook_events_admin_update on webhook_events
for update using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'))
with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

-- orgSlug 予約語チェック（推奨）
alter table organizations add constraint slug_not_reserved 
check (slug !~ '^(o|s|admin|api|assets|static|sitemap|robots|login|signup)$');