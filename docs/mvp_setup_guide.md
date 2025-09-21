# MVP骨格セットアップガイド（Cursor + Claude Code）

> **前提**: Next.js(App Router) + TypeScript + Supabase + Stripe + Resend + Vercel / ローカルはNode 18+

## 0) リポジトリ作成 & 開発環境

### 0-1. 新規リポジトリ & 初期化

```bash
# 任意の作業フォルダで
mkdir ai-company-cms && cd ai-company-cms
git init

# Node
pnpm init -y  # （npm派はnpmでもOK）
pnpm dlx create-next-app@latest . \
  --typescript --app --eslint --tailwind --src-dir --import-alias "@/*" --use-pnpm

# 必要パッケージ
pnpm add @supabase/supabase-js zod class-variance-authority clsx
pnpm add stripe @types/stripe
pnpm add resend
pnpm add next-sitemap
pnpm add sharp          # 画像最適化
pnpm add plausible-tracker
pnpm add jose           # 署名トークン（承認URL）
pnpm add date-fns

# dev
pnpm add -D supabase @types/node dotenv ts-node
pnpm add -D prettier @trivago/prettier-plugin-sort-imports
```

### 0-2. .editorconfig / .gitignore / .prettierrc

```bash
cat > .editorconfig <<'EOF'
root = true
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
EOF

cat > .gitignore <<'EOF'
node_modules
.next
.env*
supabase/.temp
.vercel
.DS_Store
EOF

cat > .prettierrc <<'EOF'
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "es5",
  "plugins": ["@trivago/prettier-plugin-sort-imports"],
  "importOrder": ["^react$", "^next(.*)$", "^@/(.*)$", "^[./]"]
}
EOF
```

## 1) Supabase 初期化（DB/認証/RLS）

### 1-1. Supabase CLI セットアップ

```bash
pnpm dlx supabase init
# プロンプトに従ってローカル開発用を初期化
```

### 1-2. スキーマ（MVP最小）

`supabase/migrations/0001_init.sql` を作成（カーソルで新規ファイル→貼付）

```sql
-- 必須拡張（gen_random_uuid / 大文字小文字無視のuniqueに備えたcitext）
create extension if not exists pgcrypto;
create extension if not exists citext;

-- Organizations
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  legal_form text,
  representative_name text,
  founded date,
  capital numeric,
  employees integer,
  description text not null,
  address_country text default 'JP',
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

-- Services
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

-- Case Studies
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

-- Partners
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

-- Redirects
create table if not exists redirects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  from_path text not null,
  to_path text not null,
  created_at timestamp with time zone default now()
);

-- Audit Log
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  entity text not null,
  entity_id uuid not null,
  action text not null,
  diff jsonb,
  created_at timestamp with time zone default now()
);

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

-- RLS
alter table organizations enable row level security;
alter table services enable row level security;
alter table case_studies enable row level security;
alter table faqs enable row level security;
alter table contact_points enable row level security;
alter table subscriptions enable row level security;
alter table app_users enable row level security;

-- admin: 全権限（organizations）
create policy org_admin_select on organizations
for select using (exists (select 1 from app_users au where au.id = auth.uid() and au.role = 'admin'));
create policy org_admin_insert on organizations
for insert with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role = 'admin'));
create policy org_admin_update on organizations
for update using (exists (select 1 from app_users au where au.id = auth.uid() and au.role = 'admin'));
create policy org_admin_delete on organizations
for delete using (exists (select 1 from app_users au where au.id = auth.uid() and au.role = 'admin'));

-- partner: 自社配下のみ（organizations）
create policy org_partner_select on organizations
for select using (partner_id in (select partner_id from app_users where id = auth.uid()));
create policy org_partner_insert on organizations
for insert with check (partner_id in (select partner_id from app_users where id = auth.uid()));
create policy org_partner_update on organizations
for update using (partner_id in (select partner_id from app_users where id = auth.uid()));

-- org_owner: 自社Orgのみ更新可（organizations）
create policy org_owner_select on organizations
for select using (owner_user_id = auth.uid());
create policy org_owner_update on organizations
for update using (owner_user_id = auth.uid());

-- 子テーブルは親orgのRLSを参照（services）
create policy svc_admin_all on services
for all using (exists (select 1 from app_users au where au.id = auth.uid() and au.role = 'admin'));
create policy svc_access on services
for all using (org_id in (select id from organizations where owner_user_id = auth.uid() or partner_id in (select partner_id from app_users where id = auth.uid())));

-- case_studies
create policy cs_admin_all on case_studies
for all using (exists (select 1 from app_users au where au.id = auth.uid() and au.role = 'admin'));
create policy cs_access on case_studies
for all using (org_id in (select id from organizations where owner_user_id = auth.uid() or partner_id in (select partner_id from app_users where id = auth.uid())));

-- faqs
create policy faq_admin_all on faqs
for all using (exists (select 1 from app_users au where au.id = auth.uid() and au.role = 'admin'));
create policy faq_access on faqs
for all using (org_id in (select id from organizations where owner_user_id = auth.uid() or partner_id in (select partner_id from app_users where id = auth.uid())));

-- contact_points
create policy cp_admin_all on contact_points
for all using (exists (select 1 from app_users au where au.id = auth.uid() and au.role = 'admin'));
create policy cp_access on contact_points
for all using (org_id in (select id from organizations where owner_user_id = auth.uid() or partner_id in (select partner_id from app_users where id = auth.uid())));

-- app_users: 本人とadminのみ
create policy app_users_self_admin on app_users
for all using (id = auth.uid() or exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));
```

### 1-3. slug列とインデックス追加

`supabase/migrations/0002_slug_and_ext.sql` を作成（slug対応とパフォーマンス最適化）

```sql
-- organizations に slug を追加（ユニーク・NOT NULL）
alter table organizations add column if not exists slug text;
update organizations set slug = regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g') where slug is null;
alter table organizations alter column slug set not null;
create unique index if not exists idx_org_slug_unique on organizations (slug);

-- よく使う外部キー/状態にインデックス
create index if not exists idx_services_org_id on services (org_id);
create index if not exists idx_case_studies_org_id on case_studies (org_id);
create index if not exists idx_faqs_org_id on faqs (org_id);
create index if not exists idx_contact_points_org_id on contact_points (org_id);
create index if not exists idx_org_status on organizations (status);

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

drop trigger if exists tg_org_set_slug on organizations;
create trigger tg_org_set_slug before insert or update of name, slug on organizations
for each row execute procedure organizations_set_slug();

-- orgSlug 予約語チェック（推奨）
-- alter table organizations add constraint slug_not_reserved check (slug !~ '^(o|s|admin|api|assets|static|sitemap|robots|login|signup)$');
```

### 1-4. RLSポリシーを操作別に分割（推奨）

`supabase/migrations/0003_rls_split.sql` を作成（デバッグしやすいポリシー分割）

```sql
-- 既存のポリシーを削除して操作別に分割
drop policy if exists org_admin_all on organizations;
drop policy if exists org_partner_rw on organizations;
drop policy if exists org_owner_rw on organizations;

-- admin: 全権限（organizations）
create policy org_admin_select on organizations for select using (
  exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin')
);
create policy org_admin_insert on organizations for insert with check (
  exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin')
);
create policy org_admin_update on organizations for update using (
  exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin')
) with check (
  exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin')
);
create policy org_admin_delete on organizations for delete using (
  exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin')
);

-- partner: 自社配下のみ（organizations）
create policy org_partner_select on organizations for select using (
  partner_id in (select partner_id from app_users where id = auth.uid())
);
create policy org_partner_insert on organizations for insert with check (
  partner_id in (select partner_id from app_users where id = auth.uid())
);
create policy org_partner_update on organizations for update using (
  partner_id in (select partner_id from app_users where id = auth.uid())
) with check (
  partner_id in (select partner_id from app_users where id = auth.uid())
);

-- org_owner: 自社Orgのみ更新可（organizations）
create policy org_owner_select on organizations for select using (owner_user_id = auth.uid());
create policy org_owner_update on organizations for update using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- 子テーブルも同様に分割（例：services）
drop policy if exists svc_admin_all on services;
drop policy if exists svc_access on services;

create policy svc_admin_select on services for select using (
  exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin')
);
create policy svc_admin_insert on services for insert with check (
  exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin')
);
create policy svc_admin_update on services for update using (
  exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin')
);
create policy svc_admin_delete on services for delete using (
  exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin')
);

create policy svc_owner_partner_select on services for select using (
  org_id in (select id from organizations where owner_user_id = auth.uid() or partner_id in (select partner_id from app_users where id = auth.uid()))
);
create policy svc_owner_partner_insert on services for insert with check (
  org_id in (select id from organizations where owner_user_id = auth.uid() or partner_id in (select partner_id from app_users where id = auth.uid()))
);
create policy svc_owner_partner_update on services for update using (
  org_id in (select id from organizations where owner_user_id = auth.uid() or partner_id in (select partner_id from app_users where id = auth.uid()))
);
```

適用：

```bash
pnpm dlx supabase start   # ローカルDB起動（初回はDocker必要）
pnpm dlx supabase db reset
```

## 2) .env 設定

### 2-1. .env.example

```bash
cat > .env.example <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_SETUP=

RESEND_API_KEY=
APP_BASE_URL=http://localhost:3000
PLAUSIBLE_DOMAIN=localhost

JWT_SECRET=replace-with-long-random # 承認URL署名用（jose）
EOF
```

`.env.local` を作り、Supabaseプロジェクト作成後のURL/AnonKey等を投入。 Stripeはダッシュボードで製品/価格を作ってIDを入れる。

## 3) Supabase クライアント & ユーザー同期

### src/lib/supabase.ts

```typescript
import { createBrowserClient, createServerClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';

export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export const supabaseServer = () =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        }
      },
      headers
    }
  );
```

### 初回ログイン時に app_users へ同期するAPI（簡易版）

`src/app/api/auth/sync/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export const POST = async (req: NextRequest) => {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // 既存チェック
  const { data: au } = await supabase.from('app_users').select('*').eq('id', user.id).maybeSingle();
  if (!au) {
    await supabase.from('app_users').insert({
      id: user.id,
      role: 'org_owner'  // 初期はorg_owner等。後でadminが昇格
    });
  }
  return NextResponse.json({ ok: true });
};
```

## 4) JSON-LD 生成ユーティリティ（空キー省略）

### src/lib/jsonld.ts

```typescript
type Org = {
  name: string; url: string; logoUrl?: string; description: string;
  founded?: string; streetAddress?: string; addressLocality: string;
  addressRegion: string; postalCode?: string; telephoneE164: string;
  email?: string; areaServed?: string[]; sameAs?: string[];
};

const omitEmpty = (obj: any) =>
  Object.fromEntries(Object.entries(obj).filter(([_, v]) =>
    v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0) && v !== ''
  ));

export const orgJsonLd = (o: Org) => omitEmpty({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: o.name,
  url: o.url,
  logo: o.logoUrl,
  description: o.description,
  foundingDate: o.founded,
  inLanguage: 'ja',
  address: omitEmpty({
    '@type': 'PostalAddress',
    streetAddress: o.streetAddress,
    addressLocality: o.addressLocality,
    addressRegion: o.addressRegion,
    postalCode: o.postalCode,
    addressCountry: 'JP'
  }),
  contactPoint: [{
    '@type': 'ContactPoint',
    contactType: 'sales',
    telephone: o.telephoneE164,
    email: o.email,
    areaServed: o.areaServed,
    availableLanguage: ['ja']
  }],
  sameAs: o.sameAs
});
```

公開ページで`<script type="application/ld+json">`に埋め込む。

## 5) App Router：公開ページひな形

### src/app/(public)/o/[org]/page.tsx

```typescript
import { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabase';
import { orgJsonLd } from '@/lib/jsonld';

type Props = { params: { org: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // ここでOGP生成時のタイトル等を返す
  return { title: `${params.org} | Company` };
}

export default async function OrgPage({ params }: Props) {
  const sb = supabaseServer();
  const { data: org } = await sb
    .from('organizations')
    .select('*')
    .eq('slug', params.org)  // slugで検索（decodeURIComponentは不要）
    .eq('status', 'published')  // 公開済みのみ
    .maybeSingle();

  if (!org) return <div>Not found</div>;

  const telephoneE164 = toE164(org.telephone); // 実装して使う
  const jsonLd = orgJsonLd({
    name: org.name,
    url: org.url,
    logoUrl: org.logo_url ?? undefined,
    description: org.description,
    founded: org.founded ?? undefined,
    streetAddress: org.street_address ?? undefined,
    addressLocality: org.address_locality,
    addressRegion: org.address_region,
    postalCode: org.postal_code ?? undefined,
    telephoneE164,
    email: org.email_public ? org.email : undefined,
    areaServed: (org.area_served as string[]) ?? undefined,
    sameAs: (org.same_as as string[]) ?? undefined
  });

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="prose mx-auto p-6">
        <h1 className="text-2xl font-bold">{org.name}</h1>
        <p>{org.description}</p>
        {/* 住所/連絡先/サービス一覧などを後続で */}
      </main>
    </>
  );
}

// 超簡易版（本番はちゃんと実装）
function toE164(tel: string) {
  const digits = tel.replace(/[^\d]/g, '');
  if (digits.startsWith('0')) return `+81${digits.slice(1)}`;
  if (digits.startsWith('81')) return `+${digits}`;
  if (digits.startsWith('+')) return digits;
  return `+81${digits}`;
}
```

## 6) 認証UI（簡易） & 同期呼び出し

### src/app/(auth)/login/page.tsx

```typescript
'use client';
import { supabaseBrowser } from '@/lib/supabase';
import { useState } from 'react';

export default function Login() {
  const sb = supabaseBrowser();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const onLogin = async () => {
    const { error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (!error) {
      await fetch('/api/auth/sync', { method: 'POST' });
      location.href = '/dashboard';
    } else {
      alert(error.message);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Login</h1>
      <input className="border p-2 w-full mb-2" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="border p-2 w-full mb-4" placeholder="password" type="password" value={pw} onChange={e=>setPw(e.target.value)} />
      <button className="bg-black text-white px-4 py-2" onClick={onLogin}>Login</button>
    </div>
  );
}
```

## 7) 承認URL（署名トークン）API

### src/app/api/approve/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: NextRequest) {
  const { orgId } = await req.json();
  const token = await new SignJWT({ orgId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .sign(secret);
  const url = `${process.env.APP_BASE_URL}/api/approve/confirm?token=${token}`;
  return NextResponse.json({ url });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const { payload } = await jwtVerify(token, secret);
    const orgId = (payload as any).orgId as string;
    const sb = supabaseServer();

    // ここでサブスク/ドメインなどのPublish Gateは後段でまとめて判定
    const { error } = await sb.from('organizations')
      .update({ status: 'published' })
      .eq('id', orgId);
    if (error) throw error;

    // TODO: サイトマップ更新キック

    return NextResponse.redirect(`${process.env.APP_BASE_URL}/o/${orgId}`);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
```

## 8) Stripe Webhook スタブ

### src/app/api/stripe/webhook/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';        // 重要：Nodeランタイム明示
export const dynamic = 'force-dynamic'; // キャッシュ無効化（保険）

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const raw = await req.text(); // 必ず raw ボディ

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // TODO: イベントごとに subscriptions/org の状態更新
  // checkout.session.completed, invoice.payment_failed, customer.subscription.deleted

  return NextResponse.json({ received: true });
}
```

## 9) サイトマップ & robots

### next-sitemap.config.js

```javascript
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [{ userAgent: '*', allow: '/' }]
  }
};
```

package.json にスクリプト：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build && next-sitemap",
    "start": "next start",
    "supabase:start": "supabase start",
    "supabase:reset": "supabase db reset"
  }
}
```

## 10) 画像最適化 & OGP 自動生成（叩き台）

### src/app/api/og/route.ts（超簡易スタブ）

```typescript
import { ImageResponse } from 'next/og';
export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('t') ?? 'Company';
  return new ImageResponse(
    (
      <div style={{ 
        fontSize: 64, 
        background: '#111', 
        color: '#fff', 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        {title}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

## 11) 動作確認チェック（追試）

```bash
# 基本動作
pnpm supabase:start && pnpm supabase:reset  # エラーなく完走
pnpm dev  # http://localhost:3000 でアクセス

# Stripe Webhook テスト
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 確認項目
# ✓ organizations.slug が自動生成される（INSERT/UPDATE）
# ✓ /o/{slug} で表示できる（script の JSON-LD も出力OK）
# ✓ Stripe Webhook で 400 が出ない（署名検証を通す）
# ✓ RLS：partner A から partner B の org にアクセス不可
```

### 次の一手（Cursor/Claude への指示例）

```
「0002_slug_and_ext.sql と 0003_rls_split.sql を作成して、上記SQLを追加。公開ページでは slug を使って取得するよう修正。Stripe webhook には runtime='nodejs' と dynamic='force-dynamic' を追加。完了後に pnpm supabase:reset → pnpm dev → Stripe CLI で webhook の署名検証まで通す E2E テスト用スクリプトを作成して。」
```

## 12) Cursor / Claude Code の使い方（このプロジェクト向け）

### Cursor
- 左ペインで`supabase/migrations/0001_init.sql`を開き「Fix policy to allow admin all ops for all tables」など自然言語で要望 → 差分プレビューで確認。
- 「Generate form component for Organization with zod validation」→ `src/app/(dash)/org/[id]/edit/page.tsx` を自動生成。
- Pull Requestテンプレも作っておくと、会話→コミットまで一気通貫。

### Claude Code（またはClaude on Cursor）
- 「このJSON-LDテンプレに空キー出力禁止のテストを書いて」→ `__tests__/jsonld.test.ts` を生成。
- 「RLSのユニットテストをSQLで用意して」→ `supabase/tests/rls.sql`を生成。
- APIのI/O Contractをzodで自動生成→バリデーションを埋め込む。

**コツ**: 小さめの指示で段階的に。フォーム→API→テスト→UI文言の順で。 失敗してもすぐ差分ロールバック（CursorのDiffビュー）を活用。

## 13) 最初に動くまでの順番（チェックリスト）

1. **Supabase起動**: `pnpm supabase:start` → `pnpm supabase:reset`
2. **.env.local 設定**（Supabase URL/AnonKey、Stripe、Resend、APP_BASE_URL）
3. **Next起動**: `pnpm dev` → http://localhost:3000
4. **Authテスト**: `/login` でユーザー作成→ `/api/auth/sync` が叩かれる（自動）
5. **Org作成フォーム**（簡易でもOK）で1社投入→ `/o/{slug}` が表示
6. **`<script type="application/ld+json">`** が正しく出力（空キーなし）を確認
7. **承認URL**: `POST /api/approve` でURL発行→ `GET /api/approve/confirm` で published に
8. **サイトマップ**: `pnpm build` で sitemap.xml 生成されることを確認
9. **Stripe**: WebhookのエンドポイントをStripeダッシュボード登録（ローカルはStripe CLIでフォワード可）
10. **Cursor/Claude** でフォーム生成・Preflight・RLSテストを順次自動化

## 14) 追加：Preflight（Publish Gate）実装の骨

### src/lib/preflight.ts

```typescript
export type PreflightResult = { ok: boolean; errors: string[] };

export async function runPreflight(orgId: string): Promise<PreflightResult> {
  const errors: string[] = [];
  // 1) JSON-LD内部検証（必須キー/型）→ 実データを一式取得して関数に通す
  // 2) Subscription.active 確認（subscriptionsテーブル）
  // 3) ドメイン検証（CNAME / サブドメインOK）
  // 4) OGP生成API 200 OK
  // 5) 画像最適化済みフラグ
  // 失敗はerrors.push('...')

  return { ok: errors.length === 0, errors };
}
```

`/api/publish` で `runPreflight` を呼び、全PASSで `status=published` にする。

---

## ここまでで「土台」は完成

- プロジェクト構成・DB・RLS・Auth同期・公開ページ・JSON-LD出力の最低限が揃ってる。
- あとは Dashboard UI（代理店用） と Preflight、Stripe同期 を肉付け。
- Cursor/Claudeに「このIssueに沿って実装して」と食わせれば、一気に組み上がる。

必要になったら、代理店ダッシュボードのワイヤーとOrganizationフォームのzodスキーマもそのまま出すよ。