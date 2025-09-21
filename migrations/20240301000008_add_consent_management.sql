-- 同意管理テーブル
create table if not exists consent_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  organization_id uuid references organizations(id) on delete set null,
  consent_type text not null check (consent_type in ('terms', 'privacy', 'disclaimer', 'marketing')),
  version text not null,
  granted boolean not null default false,
  granted_at timestamptz not null,
  revoked_at timestamptz,
  ip_address inet,
  user_agent text,
  context text not null check (context in ('registration', 'publication', 'subscription', 'general')),
  metadata jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- インデックス
create index if not exists idx_consent_records_user_id on consent_records(user_id);
create index if not exists idx_consent_records_org_id on consent_records(organization_id);
create index if not exists idx_consent_records_type_version on consent_records(consent_type, version);
create index if not exists idx_consent_records_granted_at on consent_records(granted_at);

-- RLS有効化
alter table consent_records enable row level security;

-- RLSポリシー：ユーザーは自分の同意記録のみ参照可能
create policy "Users can view own consent records" on consent_records
  for select using (auth.uid() = user_id);

-- RLSポリシー：ユーザーは自分の同意記録のみ作成可能
create policy "Users can create own consent records" on consent_records
  for insert with check (auth.uid() = user_id);

-- RLSポリシー：管理者は全ての同意記録を参照可能
create policy "Admins can view all consent records" on consent_records
  for select using (
    exists (
      select 1 from app_users 
      where id = auth.uid() 
      and role = 'admin'
    )
  );

-- updated_at自動更新
create trigger update_consent_records_updated_at
  before update on consent_records
  for each row execute function update_updated_at_column();

-- 法的文書バージョン管理テーブル
create table if not exists legal_documents (
  id uuid default gen_random_uuid() primary key,
  document_type text not null check (document_type in ('terms', 'privacy', 'disclaimer', 'marketing')),
  version text not null,
  title text not null,
  content text not null,
  effective_date timestamptz not null,
  created_by uuid references auth.users(id),
  is_active boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(document_type, version)
);

-- インデックス
create index if not exists idx_legal_documents_type_active on legal_documents(document_type, is_active);
create index if not exists idx_legal_documents_effective_date on legal_documents(effective_date);

-- RLS有効化
alter table legal_documents enable row level security;

-- RLSポリシー：全ユーザーが有効な法的文書を参照可能
create policy "Everyone can view active legal documents" on legal_documents
  for select using (is_active = true);

-- RLSポリシー：管理者のみが法的文書を管理可能
create policy "Admins can manage legal documents" on legal_documents
  for all using (
    exists (
      select 1 from app_users 
      where id = auth.uid() 
      and role = 'admin'
    )
  );

-- updated_at自動更新
create trigger update_legal_documents_updated_at
  before update on legal_documents
  for each row execute function update_updated_at_column();

-- 初期データ：現在の法的文書バージョンを挿入
insert into legal_documents (document_type, version, title, content, effective_date, is_active) values
('terms', '1.1', '利用規約', '## LuxuCare利用規約

### 第1条（目的）
本規約は、株式会社LuxuCare（以下「当社」）が提供するAI対応企業情報管理システム「LuxuCare」（以下「本サービス」）の利用条件を定めるものです。

[以下省略...]', '2024-03-01T00:00:00Z', true),

('privacy', '1.1', 'プライバシーポリシー', '## プライバシーポリシー

### 1. 個人情報の利用目的
当社は、以下の目的で個人情報を利用します：
- 本サービスの提供・運営
[以下省略...]', '2024-03-01T00:00:00Z', true),

('disclaimer', '1.1', '免責事項', '## 免責事項

### 1. サービスの提供
- 本サービスは「現状有姿」で提供されます
[以下省略...]', '2024-03-01T00:00:00Z', true),

('marketing', '1.1', 'マーケティング利用', '## マーケティング利用に関する同意

### 1. マーケティング活動
お客様により良いサービスを提供するため、以下の活動を行う場合があります：
[以下省略...]', '2024-03-01T00:00:00Z', true);