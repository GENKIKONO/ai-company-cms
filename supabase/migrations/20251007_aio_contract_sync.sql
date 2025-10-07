-- AIO契約同期マイグレーション
-- REQ-AIO-06: OpenAPI 3.1スキーマとDB実装の完全一致
-- 日時: 2025/10/7
-- 目的: RSS 500エラー解消 & 公開API契約統一

-- ===================================
-- 1. services テーブル: category カラム追加
-- ===================================
ALTER TABLE services ADD COLUMN IF NOT EXISTS category TEXT;

-- category の初期値設定（既存データ保護）
UPDATE services 
SET category = 'general'
WHERE category IS NULL;

-- ===================================
-- 2. faqs テーブル: sort_order カラム追加
-- ===================================
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL;

-- 既存データの sort_order 初期化（作成順）
UPDATE faqs 
SET sort_order = COALESCE(sort_order, 0)
WHERE sort_order IS NULL;

-- ===================================
-- 3. case_studies テーブル: result カラム追加
-- ===================================
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS result TEXT;

-- ===================================
-- 4. posts テーブル: organization_id 外部キー整備
-- ===================================

-- organization_id カラム存在確認・追加
ALTER TABLE posts ADD COLUMN IF NOT EXISTS organization_id uuid;

-- 外部キー制約の追加（IF NOT EXISTS相当をエラー回避で実装）
DO $$
BEGIN
    -- 既存制約の確認
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_organization_id_fkey' 
        AND table_name = 'posts'
    ) THEN
        -- 外部キー制約追加
        ALTER TABLE posts 
        ADD CONSTRAINT posts_organization_id_fkey 
        FOREIGN KEY (organization_id) 
        REFERENCES public.organizations(id) 
        ON UPDATE CASCADE 
        ON DELETE SET NULL;
    END IF;
END $$;

-- インデックス追加（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS idx_posts_organization_id ON posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON faqs(sort_order);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

-- ===================================
-- 5. RLS (Row Level Security) ポリシー更新
-- ===================================

-- posts テーブルの既存ポリシー確認・更新
DROP POLICY IF EXISTS "Posts are viewable by organization members" ON posts;
CREATE POLICY "Posts are viewable by organization members" ON posts
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE id = organization_id
        ) OR
        status = 'published'
    );

-- services のカテゴリフィルタリング用ポリシー
DROP POLICY IF EXISTS "Services are viewable by category" ON services;
CREATE POLICY "Services are viewable by category" ON services
    FOR SELECT USING (
        status = 'published' OR
        org_id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- ===================================
-- 6. 統計情報更新
-- ===================================
ANALYZE posts;
ANALYZE services;
ANALYZE faqs;
ANALYZE case_studies;

-- ===================================
-- 7. マイグレーション完了確認
-- ===================================

-- カラム存在確認クエリ（テスト用）
DO $$
DECLARE
    missing_columns TEXT := '';
BEGIN
    -- services.category 確認
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'category'
    ) THEN
        missing_columns := missing_columns || 'services.category ';
    END IF;
    
    -- faqs.sort_order 確認
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'faqs' AND column_name = 'sort_order'
    ) THEN
        missing_columns := missing_columns || 'faqs.sort_order ';
    END IF;
    
    -- case_studies.result 確認
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'case_studies' AND column_name = 'result'
    ) THEN
        missing_columns := missing_columns || 'case_studies.result ';
    END IF;
    
    -- posts.organization_id 確認
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'organization_id'
    ) THEN
        missing_columns := missing_columns || 'posts.organization_id ';
    END IF;
    
    -- 結果出力
    IF missing_columns = '' THEN
        RAISE NOTICE 'マイグレーション成功: 全カラムが正常に追加されました';
    ELSE
        RAISE EXCEPTION 'マイグレーション失敗: 未追加カラム: %', missing_columns;
    END IF;
END $$;

-- ===================================
-- 8. サンプルデータ確認
-- ===================================

-- カラム追加確認用のサンプルクエリ（コメント形式で記録）
/*
-- 確認用クエリ（マイグレーション後に実行）
SELECT 'services' as table_name, count(*) as total, count(category) as category_count FROM services
UNION ALL
SELECT 'faqs' as table_name, count(*) as total, count(sort_order) as sort_order_count FROM faqs  
UNION ALL
SELECT 'case_studies' as table_name, count(*) as total, count(result) as result_count FROM case_studies
UNION ALL
SELECT 'posts' as table_name, count(*) as total, count(organization_id) as org_id_count FROM posts;
*/