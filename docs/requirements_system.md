# 要件定義（システム/技術要件）

## アーキテクチャ概要

### システム構成
- **フロントエンド**: Next.js 15 + TypeScript + Tailwind CSS
- **バックエンド**: Next.js API Routes + Supabase
- **データベース**: PostgreSQL (Supabase)
- **認証**: Supabase Auth
- **課金**: Stripe
- **デプロイ**: Vercel
- **監視**: Sentry + Vercel Analytics

### セキュリティモデル
- **Row Level Security (RLS)**: マルチテナント分離
- **認証フロー**: Supabase Auth (email/password)
- **権限管理**: role-based access control
- **API保護**: 統一認証ミドルウェア

## 🚨 Supabase 運用方針および開発禁止事項

### 重要: Supabase Auth スキーマ操作の厳格な禁止

**背景**: 前回プロジェクトでauth スキーマへの不適切な操作により認証機能が破損し、プロジェクト全体の再構築が必要となった。同様の障害を防ぐため、以下のルールを厳守すること。

#### 1. auth スキーマ操作の完全禁止

**絶対に実行してはいけない操作:**
```sql
-- ❌ 禁止: auth配下のテーブルへのALTER操作
ALTER TABLE auth.users ADD COLUMN ...;
ALTER TABLE auth.identities ...;
ALTER TABLE auth.sessions ...;

-- ❌ 禁止: auth配下へのRLS設定
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY ... ON auth.users ...;

-- ❌ 禁止: auth配下への独自ビュー作成
CREATE VIEW auth.custom_view ...;

-- ❌ 禁止: auth配下への関数作成
CREATE FUNCTION auth.custom_function() ...;
```

#### 2. 認証データ構造の安全な設計方針

**✅ 推奨構造:**
- **認証**: Supabase Auth (`auth.users`, `auth.sessions`) をそのまま利用
- **プロフィール**: `public.profiles` テーブルで管理
- **権限**: `public.profiles.role` または `auth.users.app_metadata` で分岐

```sql
-- ✅ 正しい: profilesテーブルでユーザー情報管理
CREATE TABLE public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text default 'viewer',
  created_at timestamp with time zone default now()
);

-- ✅ 正しい: トリガーで自動同期
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3. Supabase API 設定の安全な運用

**Dashboard設定で厳守すべき項目:**
- **Exposed schemas**: `public` のみ。`auth` は含めない
- **Data API**: public スキーマのみ expose
- **GraphQL API**: public スキーマのみ expose

**Security Advisor 警告への対応:**
- `Exposed Auth Users` 警告 → 修正せず、開発責任者に相談
- `Security Definer View` 警告 → 修正せず、開発責任者に相談

#### 4. 開発・運用ルール

**コードレビュー必須項目:**
- SQL/マイグレーションファイルで `auth.` が含まれる場合
- Claude や AI が生成したスクリプトで認証関連の操作
- RLS ポリシーで `auth` スキーマを参照する場合

**障害発生時の対応方針:**
- 認証トラブル時は **再構築（新プロジェクト作成）** を優先
- 破損した auth テーブルの直接修復は行わない
- データ移行時も auth スキーマには触れない

#### 5. 禁止パターンの具体例

**❌ やってはいけない操作例:**
```sql
-- auth.usersの直接操作
UPDATE auth.users SET email = ...;
DELETE FROM auth.users WHERE ...;

-- auth配下のRLS操作
ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_audit" ON auth.audit_log_entries ...;

-- authビューへの手動変更
ALTER VIEW auth._auth_audit OWNER TO ...;
```

**✅ 正しい代替手段:**
```typescript
// プロフィール情報は public.profiles から取得
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// 認証情報は Supabase Auth API を使用
const { data: { user } } = await supabase.auth.getUser();

// 権限チェックは app_metadata または profiles.role
const isAdmin = user.app_metadata?.role === 'admin';
```

#### 6. トラブル回避のための確認事項

**デプロイ前チェックリスト:**
- [ ] マイグレーションファイルに `auth.` の記述がないか
- [ ] RLS ポリシーが `public` スキーマのみ対象か
- [ ] API Routes で `auth` スキーマに直接クエリしていないか
- [ ] Supabase Dashboard の Exposed schemas が正しいか

---

**⚠️ 重要**: この運用方針に違反した場合、認証機能の破損により **プロジェクト全体の再構築** が必要となる可能性があります。不明な点は必ず開発責任者に確認してください。

## データモデル

### 共通仕様
- すべて `uuid` PK、`created_at` / `updated_at` 付与
- RLS：role・org_idベースで厳格制御
- Migration冒頭に `CREATE EXTENSION IF NOT EXISTS pgcrypto;` 必須

### コアエンティティ

#### organizations（企業）
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  legal_form VARCHAR(100),
  representative_name VARCHAR(255),
  establishment_date DATE,
  capital BIGINT,
  employees INTEGER,
  
  -- 住所情報
  address_country VARCHAR(2) DEFAULT 'JP',
  address_region VARCHAR(100),
  address_locality VARCHAR(100),
  address_postal_code VARCHAR(10),
  address_street TEXT,
  
  -- 連絡先
  telephone VARCHAR(20),
  email VARCHAR(255),
  url TEXT,
  logo_url TEXT,
  
  -- SEO・構造化データ
  meta_title VARCHAR(60),
  meta_description VARCHAR(160),
  industries TEXT[], -- JSON配列
  keywords TEXT,
  
  -- 公開管理
  status VARCHAR(20) DEFAULT 'draft' 
    CHECK (status IN ('draft', 'published', 'archived')),
  is_published BOOLEAN DEFAULT false,
  
  -- 権限管理
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  -- タイムスタンプ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### services（サービス/商品）
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  features TEXT[], -- JSON配列
  price_text VARCHAR(100), -- "月額5,000円〜" など
  category VARCHAR(100),
  image_url TEXT,
  cta_url TEXT,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### case_studies（導入事例）
```sql
CREATE TABLE case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  client_type VARCHAR(100),
  client_name VARCHAR(255),
  problem TEXT,
  solution TEXT,
  outcome TEXT,
  metrics JSONB, -- {metric: value} 形式
  published_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### faqs（よくある質問）
```sql
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### posts（記事/ニュース）
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  excerpt VARCHAR(500),
  published_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 権限管理テーブル

#### profiles（ユーザープロフィール）
```sql
-- ✅ Supabase Auth連携の安全なプロフィール管理
CREATE TABLE public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- RLS設定
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- プロフィール自分のみアクセス可能
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 新規ユーザー自動同期トリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

#### organization_profiles（ユーザー・組織関連）
```sql
CREATE TABLE organization_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'org_owner' 
    CHECK (role IN ('org_owner', 'org_editor', 'viewer')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, organization_id)
);
```

### Stripe連携テーブル

#### stripe_customers
```sql
CREATE TABLE stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security (RLS) ポリシー

### セルフサーブモード（1ユーザー=1組織）

```sql
-- organizations: セルフサーブユーザーは自分が作成した組織のみ
CREATE POLICY "selfserve_organizations_policy" ON organizations
  FOR ALL USING (
    auth.uid() = created_by AND
    (auth.jwt()->>'user_metadata'->>'role' IS NULL OR 
     auth.jwt()->>'user_metadata'->>'role' IN ('org_owner', 'org_editor'))
  );

-- services: 組織オーナーのみ
CREATE POLICY "selfserve_services_policy" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organizations o 
      WHERE o.id = organization_id 
      AND o.created_by = auth.uid()
    )
  );
```

### 代理店モード（partner ロール）

```sql
-- organizations: partner権限で管理組織へのアクセス
CREATE POLICY "partner_organizations_policy" ON organizations
  FOR ALL USING (
    auth.jwt()->>'user_metadata'->>'role' = 'partner' AND
    EXISTS (
      SELECT 1 FROM organization_profiles op
      WHERE op.organization_id = id 
      AND op.user_id = auth.uid()
      AND op.role IN ('org_owner', 'org_editor')
    )
  );
```

### 管理者モード（admin ロール）

```sql
-- 全テーブル: admin権限で全アクセス
CREATE POLICY "admin_full_access" ON organizations
  FOR ALL USING (auth.jwt()->>'user_metadata'->>'role' = 'admin');
```

## API設計

### エンドポイント体系

#### セルフサーブ専用API
```
GET/POST/PUT/DELETE /api/my/organization
GET/POST/PUT/DELETE /api/my/services
GET/POST/PUT/DELETE /api/my/case-studies
GET/POST/PUT/DELETE /api/my/faqs
GET/POST/PUT/DELETE /api/my/posts
```

#### 代理店専用API
```
GET/POST /api/organizations
GET/POST/PUT/DELETE /api/organizations/[id]
GET/POST/PUT/DELETE /api/organizations/[id]/services
GET/POST/PUT/DELETE /api/organizations/[id]/case-studies
GET/POST/PUT/DELETE /api/organizations/[id]/faqs
GET/POST/PUT/DELETE /api/organizations/[id]/posts
```

#### 公開API（認証不要）
```
GET /api/public/organizations
GET /api/public/organizations/[slug]
GET /api/public/health
```

#### 管理者API
```
GET /ops/verify
GET /ops/probe
POST /ops/actions/[action]
```

### 認証・認可フロー

```typescript
// 統一認証ミドルウェア（✅ profilesテーブル対応）
export async function requireAuth(request: NextRequest): Promise<AuthContext | Response> {
  // 1. Supabase Authでユーザー認証
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // 2. プロフィール情報取得（public.profilesから）
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  // 3. 権限判定（app_metadataまたはprofiles.roleから）
  const userRole = user.app_metadata?.role || 'viewer';
  
  // 4. フロー判定（self_serve / partner / admin）
  // 5. 権限計算・アクセス可能組織リスト生成
}

// ✅ 安全なユーザー情報取得パターン
export async function getCurrentUser(): Promise<AppUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // プロフィール情報は public.profiles から取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, created_at')
    .eq('id', user.id)
    .single();
    
  // auth.users + profiles の結合でAppUserを構築
  return {
    id: profile.id,
    email: user.email || '',
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    role: user.app_metadata?.role || 'viewer',
    created_at: profile.created_at,
    updated_at: profile.created_at
  };
}

// 権限チェック関数
export function requireSelfServeAccess(authContext: AuthContext): Response | null
export function requirePartnerAccess(authContext: AuthContext): Response | null  
export function requireOrgOwner(authContext: AuthContext, orgId: string): Response | null
```

### エラーレスポンス統一

```typescript
interface ApiErrorResponse {
  error: {
    code: string;        // 'VALIDATION_ERROR', 'UNAUTHORIZED', etc.
    message: string;     // ユーザー向けメッセージ
    details?: any;       // 詳細情報（バリデーションエラー等）
    timestamp: string;   // ISO 8601形式
  };
}

// HTTPステータス責務分離
// 400番台: クライアントエラー（修正可能）
// 500番台: サーバーエラー（システム異常）
```

### データ正規化

```typescript
// 全APIで統一適用
function normalizePayload(data: any) {
  // 空文字 → null 変換
  // トリム処理
  // URL正規化（https:// 補完）
  // Email正規化（小文字化）
}
```

## 環境変数管理

### 必須環境変数

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_BASIC_PRICE_ID=
STRIPE_WEBHOOK_SECRET=

# 管理者
ADMIN_EMAIL=
ADMIN_OPS_PASSWORD=

# アプリケーション
NEXT_PUBLIC_APP_URL=
```

### フィーチャーフラグ

```bash
# 本番設定
SHOW_BUILD_BADGE=false      # 本番ではコミットバッジ非表示
ENABLE_PARTNER_FLOW=true    # 代理店機能有効
```

## 診断・監視

### ヘルスチェックエンドポイント

- **`/api/health`**: 基本的なシステム稼働確認
- **`/api/diag/session`**: 認証・セッション診断
- **`/ops/verify`**: 総合診断（両モード健全性）
- **`/ops/probe`**: 詳細診断（DB・Stripe・公開ページ）

### 監視項目

- **レスポンス時間**: P95 < 2秒
- **エラー率**: < 1%
- **JSON-LD検証**: エラー0件
- **Stripe webhook**: 成功率 > 98%

---

## 準拠義務・重要事項

**✅ 必須遵守事項:**
1. **すべての実装はこのシステム要件に厳密に従うこと**
2. **Supabase Auth スキーマ操作の禁止事項を厳守すること**
3. **認証関連のコードレビューを必ず実施すること**
4. **要件逸脱・禁止事項違反はPRで却下します**

**🚨 特に重要**: auth スキーマへの操作は **プロジェクト破損** の原因となるため、不明な場合は必ず開発責任者に相談してください。