-- 修正: APIとDBスキーマの不整合解消
-- 作成日: 2025-10-05
-- 説明: established_at カラム追加、establishment_date 削除でAPI層との完全整合を実現

-- 現状確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='organizations'
  AND column_name IN ('founded','established_at','establishment_date');

-- 1. API整合用カラムを追加
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS established_at DATE NULL;

-- 2. 不要な旧カラムを削除
ALTER TABLE public.organizations
DROP COLUMN IF EXISTS establishment_date;

-- 3. コメントでドキュメント化
COMMENT ON COLUMN public.organizations.established_at IS 'Company establishment date - aligned with API layer (replaces founded/establishment_date)';

-- 4. インデックス追加（パフォーマンス）
CREATE INDEX IF NOT EXISTS idx_organizations_established_at 
ON public.organizations(established_at);

-- 5. 確認クエリ
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='organizations'
  AND column_name LIKE '%establish%' OR column_name = 'founded';