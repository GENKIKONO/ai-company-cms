-- 法人番号フィールド追加
-- 作成日: 2025-10-07
-- 目的: 組織の信頼性向上のため法人番号フィールドを追加

ALTER TABLE public.organizations 
ADD COLUMN corporate_number TEXT;

-- インデックス追加（重複チェック用）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_corporate_number 
ON public.organizations(corporate_number) 
WHERE corporate_number IS NOT NULL;

-- 法人番号制約（13桁数字のみ、NULL許可）
ALTER TABLE public.organizations 
ADD CONSTRAINT chk_corporate_number_format 
CHECK (corporate_number IS NULL OR corporate_number ~ '^[0-9]{13}$');

-- コメント追加
COMMENT ON COLUMN public.organizations.corporate_number IS '法人番号（13桁、国税庁発行）';