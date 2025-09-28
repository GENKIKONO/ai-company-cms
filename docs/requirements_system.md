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
// 統一認証ミドルウェア
export async function requireAuth(request: NextRequest): Promise<AuthContext | Response> {
  // Supabase Authでユーザー認証
  // フロー判定（self_serve / partner / admin）
  // 権限計算・アクセス可能組織リスト生成
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

**準拠義務**: すべての実装はこのシステム要件に厳密に従うこと。要件逸脱はPRで却下します。