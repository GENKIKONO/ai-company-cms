-- Production Database Verification Script
-- 本番環境での設定確認用SQL

-- 1. Tables existence check
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. RLS policies check
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Helper functions check
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('user_role', 'is_admin', 'is_editor_or_admin');

-- 4. Test users verification
SELECT 
    u.id,
    u.email,
    u.role,
    u.created_at,
    au.email_confirmed_at IS NOT NULL as email_confirmed
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.email LIKE '%luxucare.com'
ORDER BY u.role;

-- 5. Sample data check
SELECT 
    'organizations' as table_name,
    COUNT(*) as record_count
FROM public.organizations
UNION ALL
SELECT 
    'services' as table_name,
    COUNT(*) as record_count
FROM public.services
UNION ALL
SELECT 
    'case_studies' as table_name,
    COUNT(*) as record_count
FROM public.case_studies
UNION ALL
SELECT 
    'partners' as table_name,
    COUNT(*) as record_count
FROM public.partners;

-- 6. Indexes verification
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('organizations', 'services', 'case_studies', 'faqs', 'partnerships', 'news')
ORDER BY tablename, indexname;

-- 7. Extensions check
SELECT 
    extname,
    extversion
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- 8. Custom types check
SELECT 
    typname,
    typtype
FROM pg_type 
WHERE typname IN ('organization_status', 'user_role', 'partnership_type');

-- 9. Row level security status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;

-- 10. Grants verification for anon and authenticated roles
SELECT 
    table_schema,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public'
AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;