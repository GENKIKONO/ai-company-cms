-- organizations_with_owner view
-- 目的: PGRST201 FK曖昧性エラーを回避し、owner情報を明示的な列で提供
-- 対象: src/lib/organizations.ts の created_by:users(full_name, email) embed を置換

-- 既存viewがあれば削除
DROP VIEW IF EXISTS public.organizations_with_owner;

-- View作成: Security Invoker（呼び出し元の権限で実行、RLS適用）
CREATE VIEW public.organizations_with_owner
WITH (security_invoker = on)
AS
SELECT 
    -- Organizations テーブル全カラム
    o.id,
    o.name,
    o.slug,
    o.description,
    o.website,
    o.industry,
    o.founded_year,
    o.employee_count,
    o.headquarters,
    o.logo_url,
    o.status,
    o.contact_email,
    o.contact_phone,
    o.address_prefecture,
    o.address_city,
    o.address_line1,
    o.address_line2,
    o.address_postal_code,
    o.subscription_status,
    o.partner_id,
    o.created_by,
    o.created_at,
    o.updated_at,
    o.meta_title,
    o.meta_description,
    o.meta_keywords,
    
    -- Owner情報（明示的列、FK曖昧性なし）
    u.email as owner_email,
    u.full_name as owner_full_name,
    u.avatar_url as owner_avatar_url,
    u.role as owner_role
    
FROM public.organizations o
LEFT JOIN public.users u ON o.created_by = u.id;

-- RLS有効化（基表のポリシーを継承）
ALTER VIEW public.organizations_with_owner ENABLE ROW LEVEL SECURITY;

-- View説明
COMMENT ON VIEW public.organizations_with_owner IS 
'Organizations with owner details - resolves PGRST201 FK ambiguity error. 
Security Invoker ensures RLS policies from base tables are applied.';

-- PostgRESTにスキーマ変更を通知
SELECT pg_notify('pgrst', 'reload schema');