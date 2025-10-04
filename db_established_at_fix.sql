-- established_at カラムの修正SQL（問題が見つかった場合に実行）

-- 1) NOT NULL制約がある場合は削除
ALTER TABLE public.organizations ALTER COLUMN established_at DROP NOT NULL;

-- 2) founded カラムも同様に修正
ALTER TABLE public.organizations ALTER COLUMN founded DROP NOT NULL;

-- 3) 変なデフォルト値がある場合は削除
ALTER TABLE public.organizations ALTER COLUMN established_at DROP DEFAULT;
ALTER TABLE public.organizations ALTER COLUMN founded DROP DEFAULT;

-- 4) 型が正しいことを確認・修正
-- ALTER TABLE public.organizations ALTER COLUMN established_at TYPE DATE USING established_at::DATE;
-- ALTER TABLE public.organizations ALTER COLUMN founded TYPE DATE USING founded::DATE;