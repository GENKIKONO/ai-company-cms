-- 修正: foundedカラムの完全削除
-- 作成日: 2025-10-04
-- 説明: UIに存在しないfoundedフィールドをDBからも完全除去してDATABASE_ERROR根絶

-- foundedカラムを削除
ALTER TABLE public.organizations 
DROP COLUMN IF EXISTS founded;

-- コメント追加
COMMENT ON TABLE public.organizations IS 'Enterprise information table - founded column removed as not used in UI';