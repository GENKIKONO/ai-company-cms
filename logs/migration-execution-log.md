# 🔧 DB契約同期マイグレーション実行ログ

**日時**: 2025/10/7  
**対象**: 本番Supabase DB (aiohub.jp)  
**ファイル**: `supabase/migrations/20251007_aio_contract_sync.sql`

## 📋 実行前検証結果

### ❌ 欠損カラム確認（500エラー原因）

| テーブル | カラム | エラーメッセージ |
|----------|--------|------------------|
| services | category | `column services.category does not exist` |
| faqs | sort_order | `column faqs.sort_order does not exist` |
| case_studies | result | `column case_studies.result does not exist` |
| posts | organization_id | RSS 500エラーの原因 |

### ✅ 正常稼働エンドポイント

| エンドポイント | ステータス | Content-Type |
|---------------|-----------|--------------|
| `/sitemap-images.xml` | 200 | `application/xml` |
| `/sitemap-news.xml` | 200 | `application/xml` |
| `/api/public/openapi.json` | 200 | `application/json` |

## 🚀 実行待ちSQL（Supabase Dashboard）

```sql
-- ステップ1: カラム追加
ALTER TABLE services ADD COLUMN IF NOT EXISTS category TEXT;
UPDATE services SET category = 'general' WHERE category IS NULL;

ALTER TABLE faqs ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL;
UPDATE faqs SET sort_order = COALESCE(sort_order, 0) WHERE sort_order IS NULL;

ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS result TEXT;

ALTER TABLE posts ADD COLUMN IF NOT EXISTS organization_id uuid;

-- ステップ2: 外部キー制約
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_organization_id_fkey' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE posts 
        ADD CONSTRAINT posts_organization_id_fkey 
        FOREIGN KEY (organization_id) 
        REFERENCES public.organizations(id) 
        ON UPDATE CASCADE 
        ON DELETE SET NULL;
    END IF;
END $$;

-- ステップ3: インデックス追加
CREATE INDEX IF NOT EXISTS idx_posts_organization_id ON posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON faqs(sort_order);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

-- ステップ4: RLSポリシー更新
DROP POLICY IF EXISTS "Posts are viewable by organization members" ON posts;
CREATE POLICY "Posts are viewable by organization members" ON posts
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE id = organization_id
        ) OR
        status = 'published'
    );

DROP POLICY IF EXISTS "Services are viewable by category" ON services;
CREATE POLICY "Services are viewable by category" ON services
    FOR SELECT USING (
        status = 'published' OR
        org_id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- ステップ5: 統計情報更新
ANALYZE posts;
ANALYZE services;
ANALYZE faqs;
ANALYZE case_studies;

-- ステップ6: 検証
DO $$
DECLARE
    missing_columns TEXT := '';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'category') THEN
        missing_columns := missing_columns || 'services.category ';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faqs' AND column_name = 'sort_order') THEN
        missing_columns := missing_columns || 'faqs.sort_order ';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'case_studies' AND column_name = 'result') THEN
        missing_columns := missing_columns || 'case_studies.result ';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'organization_id') THEN
        missing_columns := missing_columns || 'posts.organization_id ';
    END IF;
    
    IF missing_columns = '' THEN
        RAISE NOTICE 'マイグレーション成功: 全カラムが正常に追加されました';
    ELSE
        RAISE EXCEPTION 'マイグレーション失敗: 未追加カラム: %', missing_columns;
    END IF;
END $$;
```

## 📊 実行後検証予定

### 期待される結果
- **すべての500エラー解消**
- **AIO適合率: 100%**
- **全エンドポイント200応答**

### 検証項目
1. ✅ 4カラム存在確認
2. ✅ 外部キー制約確認
3. ✅ RSS/API動作確認
4. ✅ E2E適合率計測

---

**⏳ ステータス**: マイグレーション実行待ち  
**次アクション**: Supabase Dashboard SQL実行完了後、全検証開始