-- 組織の認証済みフラグ追加
-- 作成日: 2025-10-07
-- 目的: 法人番号認証済み組織にverifiedフラグを付与し、JSON-LD出力に反映

-- verifiedフラグを追加
ALTER TABLE public.organizations 
ADD COLUMN verified BOOLEAN DEFAULT FALSE;

-- finalized: organization_verified flag now official under RLS
-- 法人番号が登録されている場合は認証済みとして扱う（正式化）
UPDATE public.organizations 
SET verified = TRUE 
WHERE corporate_number IS NOT NULL 
AND LENGTH(corporate_number) = 13;

-- インデックス追加（認証済み組織の検索用）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_verified 
ON public.organizations(verified) 
WHERE verified = TRUE;

-- コメント追加
COMMENT ON COLUMN public.organizations.verified IS '認証済み法人フラグ（法人番号確認済み）';