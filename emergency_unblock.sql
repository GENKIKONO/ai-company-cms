-- 緊急対応: foundedカラムを追加してエラーをunblock
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS founded DATE NULL;