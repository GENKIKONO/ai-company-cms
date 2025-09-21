-- Test Users Creation Script
-- テストユーザー作成用スクリプト
-- 本番環境でのテスト用

-- 1. Admin User (管理者)
-- まずauth.usersテーブルに追加
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    email_change_token_new,
    recovery_token
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    '00000000-0000-0000-0000-000000000000',
    'admin@luxucare.com',
    crypt('AdminPass123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    '',
    '',
    ''
);

-- 対応するpublic.usersレコード
INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@luxucare.com',
    'システム管理者',
    'admin',
    NOW(),
    NOW()
);

-- 2. Editor User (編集者)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    email_change_token_new,
    recovery_token
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    '00000000-0000-0000-0000-000000000000',
    'editor@luxucare.com',
    crypt('EditorPass123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    '',
    '',
    ''
);

INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'editor@luxucare.com',
    '企業情報編集者',
    'editor',
    NOW(),
    NOW()
);

-- 3. Viewer User (閲覧者)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    email_change_token_new,
    recovery_token
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    '00000000-0000-0000-0000-000000000000',
    'viewer@luxucare.com',
    crypt('ViewerPass123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    '',
    '',
    ''
);

INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'viewer@luxucare.com',
    '一般ユーザー',
    'viewer',
    NOW(),
    NOW()
);

-- 確認用クエリ
SELECT 
    u.email,
    u.role,
    u.created_at,
    au.email_confirmed_at IS NOT NULL as email_confirmed
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.email LIKE '%luxucare.com'
ORDER BY u.role;