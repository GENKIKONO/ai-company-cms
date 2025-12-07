-- =========================================================
-- RLS Tester 初期テストデータサンプル
-- AIOHub Phase 3 - EPIC 3-2
--
-- 【重要】これは実際のマイグレーションではなく、サンプル・ドキュメントです
-- 本番環境での使用前に、UUIDや組織ID等を実際の値に差し替えてください
-- 
-- 使用方法:
-- 1. 実環境のUUID値に合わせてサンプルデータを修正
-- 2. psql や Supabase SQL Editor で手動実行
-- 3. RLSルールの期待動作を事前に文書化してレビュー
-- =========================================================

-- =========================================================
-- 1. テストユーザー定義サンプル
-- =========================================================

-- 【注意】organization_id と sub は実環境の値に差し替えること
-- 組織IDは organization テーブル、sub は app_users.id から取得

INSERT INTO public.rls_test_users (role_name, organization_id, user_role, jwt_template, description)
VALUES
  -- システム管理者（全システムアクセス可能）
  ('system_super_admin', NULL, 'system_admin', 
    jsonb_build_object(
      'sub', '00000000-0000-0000-0000-000000000001',
      'role', 'admin', 
      'email', 'super-admin@example.com',
      'user_role', 'admin'
    ),
    'System-level super administrator with global access'
  ),

  -- 組織A関連ユーザー
  ('orgA_owner', '11111111-1111-1111-1111-111111111111', 'owner',
    jsonb_build_object(
      'sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'role', 'user',
      'email', 'owner-a@org-a.example.com',
      'org_id', '11111111-1111-1111-1111-111111111111',
      'user_role', 'owner'
    ),
    'Organization A owner - full access to org A data'
  ),

  ('orgA_admin', '11111111-1111-1111-1111-111111111111', 'admin',
    jsonb_build_object(
      'sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaabb', 
      'role', 'user',
      'email', 'admin-a@org-a.example.com',
      'org_id', '11111111-1111-1111-1111-111111111111',
      'user_role', 'admin'
    ),
    'Organization A admin - administrative access to org A'
  ),

  ('orgA_member', '11111111-1111-1111-1111-111111111111', 'member',
    jsonb_build_object(
      'sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaccc',
      'role', 'user', 
      'email', 'member-a@org-a.example.com',
      'org_id', '11111111-1111-1111-1111-111111111111',
      'user_role', 'member'
    ),
    'Organization A regular member - limited access'
  ),

  -- 組織B関連ユーザー
  ('orgB_admin', '22222222-2222-2222-2222-222222222222', 'admin',
    jsonb_build_object(
      'sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'role', 'user',
      'email', 'admin-b@org-b.example.com', 
      'org_id', '22222222-2222-2222-2222-222222222222',
      'user_role', 'admin'
    ),
    'Organization B admin - administrative access to org B'
  ),

  ('orgB_viewer', '22222222-2222-2222-2222-222222222222', 'viewer',
    jsonb_build_object(
      'sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbcc',
      'role', 'user',
      'email', 'viewer-b@org-b.example.com',
      'org_id', '22222222-2222-2222-2222-222222222222', 
      'user_role', 'viewer'
    ),
    'Organization B viewer - read-only access'
  ),

  -- 未所属ユーザー（検証用）
  ('unaffiliated_user', NULL, 'member',
    jsonb_build_object(
      'sub', 'unaffiliated-user-uuid-here-1234567',
      'role', 'user',
      'email', 'unaffiliated@example.com'
    ),
    'User not affiliated with any organization'
  );

-- =========================================================
-- 2. テストシナリオ定義サンプル
-- =========================================================

INSERT INTO public.rls_test_scenarios 
(scenario_name, target_table, target_schema, operation, expected_result, test_data, category, priority, description)
VALUES
  
  -- ===== app_users テーブル（自身の行のみアクセス可能を想定）=====
  ('app_users_select_super_admin', 'app_users', 'public', 'SELECT', 'ALLOW', 
    NULL, 
    'user_access', 1,
    'Super admin should be able to view all user records'
  ),

  ('app_users_select_member_self', 'app_users', 'public', 'SELECT', 'ALLOW',
    jsonb_build_object('where_clause', 'id = auth.uid()'),
    'user_access', 1, 
    'Regular users should see their own record via RLS'
  ),

  -- ===== organization_members テーブル（所属組織のみアクセス可能）=====
  ('org_members_select_orgA_owner', 'organization_members', 'public', 'SELECT', 'ALLOW',
    jsonb_build_object('where_clause', 'organization_id = ''11111111-1111-1111-1111-111111111111'''),
    'organization_access', 1,
    'Organization A owner should access org A member records'
  ),

  ('org_members_select_orgA_cross_access', 'organization_members', 'public', 'SELECT', 'DENY',
    jsonb_build_object('where_clause', 'organization_id = ''22222222-2222-2222-2222-222222222222'''),
    'organization_access', 1,
    'Organization A users should NOT access org B member records'
  ),

  ('org_members_insert_orgA_admin', 'organization_members', 'public', 'INSERT', 'ALLOW',
    jsonb_build_object(
      'columns', 'organization_id, user_id, role',
      'values', '''11111111-1111-1111-1111-111111111111'', ''new-user-uuid'', ''member'''
    ),
    'organization_access', 2,
    'Organization A admin should be able to add new members'
  ),

  ('org_members_insert_orgA_member_denied', 'organization_members', 'public', 'INSERT', 'DENY',
    jsonb_build_object(
      'columns', 'organization_id, user_id, role', 
      'values', '''11111111-1111-1111-1111-111111111111'', ''new-user-uuid-2'', ''member'''
    ),
    'organization_access', 2,
    'Organization A regular member should NOT be able to add new members'
  ),

  -- ===== alert_events テーブル（Super Admin専用を想定）=====
  ('alert_events_select_super_admin', 'alert_events', 'public', 'SELECT', 'ALLOW',
    NULL,
    'admin_only', 1,
    'Super admin should access all alert events'
  ),

  ('alert_events_select_regular_user', 'alert_events', 'public', 'SELECT', 'ERROR', 
    NULL,
    'admin_only', 1,
    'Regular users should be denied access to alert events'
  ),

  -- ===== job_runs テーブル（Super Admin専用を想定）=====
  ('job_runs_select_super_admin', 'job_runs', 'public', 'SELECT', 'ALLOW',
    NULL,
    'admin_only', 1,
    'Super admin should access all job run records'
  ),

  ('job_runs_select_member_denied', 'job_runs', 'public', 'SELECT', 'ERROR',
    NULL, 
    'admin_only', 1,
    'Regular members should be denied access to job runs'
  ),

  -- ===== qa_entries テーブル（組織内データアクセス）=====
  ('qa_entries_select_orgA_admin', 'qa_entries', 'public', 'SELECT', 'ALLOW',
    jsonb_build_object('where_clause', 'organization_id = ''11111111-1111-1111-1111-111111111111'''),
    'qa_access', 1,
    'Organization A admin should access org A Q&A entries'
  ),

  ('qa_entries_select_cross_org_denied', 'qa_entries', 'public', 'SELECT', 'DENY',
    jsonb_build_object('where_clause', 'organization_id = ''22222222-2222-2222-2222-222222222222'''),
    'qa_access', 1,
    'Organization A users should not see org B Q&A entries'
  ),

  ('qa_entries_insert_owner_allowed', 'qa_entries', 'public', 'INSERT', 'ALLOW',
    jsonb_build_object(
      'columns', 'organization_id, category_id, question, answer, created_by',
      'values', '''11111111-1111-1111-1111-111111111111'', ''default-category-uuid'', ''Test Question'', ''Test Answer'', auth.uid()'
    ),
    'qa_access', 2,
    'Organization owner should be able to create Q&A entries'
  ),

  ('qa_entries_insert_viewer_denied', 'qa_entries', 'public', 'INSERT', 'DENY',
    jsonb_build_object(
      'columns', 'organization_id, category_id, question, answer, created_by',
      'values', '''22222222-2222-2222-2222-222222222222'', ''default-category-uuid'', ''Test Question 2'', ''Test Answer 2'', auth.uid()'
    ),
    'qa_access', 2,
    'Organization viewer should not be able to create Q&A entries'
  ),

  -- ===== material_contents テーブル（組織内教材アクセス）=====
  ('materials_select_orgA_member', 'material_contents', 'public', 'SELECT', 'ALLOW',
    jsonb_build_object('where_clause', 'organization_id = ''11111111-1111-1111-1111-111111111111'''),
    'materials_access', 1,
    'Organization A member should access org A materials'
  ),

  ('materials_update_admin_only', 'material_contents', 'public', 'UPDATE', 'ALLOW',
    jsonb_build_object(
      'set_clause', 'updated_at = now()',
      'where_clause', 'organization_id = ''11111111-1111-1111-1111-111111111111'' AND id = ''material-test-uuid'''
    ),
    'materials_access', 2,
    'Organization admin should be able to update materials'
  ),

  ('materials_delete_owner_only', 'material_contents', 'public', 'DELETE', 'ALLOW',
    jsonb_build_object(
      'where_clause', 'organization_id = ''11111111-1111-1111-1111-111111111111'' AND id = ''material-delete-test-uuid'''
    ),
    'materials_access', 3,
    'Organization owner should be able to delete materials'
  ),

  -- ===== case_studies テーブル（組織内症例アクセス）=====
  ('case_studies_select_viewer_allowed', 'case_studies', 'public', 'SELECT', 'ALLOW',
    jsonb_build_object('where_clause', 'organization_id = ''22222222-2222-2222-2222-222222222222'''),
    'case_studies_access', 1,
    'Organization B viewer should be able to read case studies'
  ),

  ('case_studies_insert_member_denied', 'case_studies', 'public', 'INSERT', 'DENY',
    jsonb_build_object(
      'columns', 'organization_id, title, content, created_by',
      'values', '''11111111-1111-1111-1111-111111111111'', ''Test Case'', ''Test Content'', auth.uid()'
    ),
    'case_studies_access', 2,
    'Regular member should not be able to create case studies'
  );

-- =========================================================
-- 3. テストデータ投入後の確認クエリ（参考）
-- =========================================================

/*
-- テストユーザー確認
SELECT role_name, organization_id, user_role, description 
FROM rls_test_users 
ORDER BY organization_id NULLS FIRST, user_role;

-- テストシナリオ確認  
SELECT category, target_table, operation, expected_result, COUNT(*) as scenario_count
FROM rls_test_scenarios
WHERE is_active = true
GROUP BY category, target_table, operation, expected_result  
ORDER BY category, target_table, operation;

-- テスト組み合わせ数確認
SELECT 
  (SELECT COUNT(*) FROM rls_test_users WHERE is_active = true) as total_users,
  (SELECT COUNT(*) FROM rls_test_scenarios WHERE is_active = true) as total_scenarios,
  (SELECT COUNT(*) FROM rls_test_users WHERE is_active = true) * 
  (SELECT COUNT(*) FROM rls_test_scenarios WHERE is_active = true) as total_combinations;
*/

-- =========================================================
-- 4. 実環境適用時の注意事項
-- =========================================================

/*
【実環境での使用前チェックリスト】

1. **UUID の差し替え**
   ✓ organization_id を実際の組織UUIDに変更
   ✓ jwt_template.sub を実際のユーザーUUIDに変更  
   ✓ jwt_template.org_id を organization_id と一致させる
   ✓ テストデータ内のUUID（category_id, material_id等）を実際の値に変更

2. **RLS ポリシーの事前確認**
   ✓ 各テーブルのRLSポリシーが想定通りに設定されているか確認
   ✓ expected_result（ALLOW/DENY）が実際のポリシー動作と一致するか検証
   ✓ 特にクロス組織アクセスが適切に禁止されているか確認

3. **テーブル存在確認** 
   ✓ target_table で指定したテーブルが実際に存在するか確認
   ✓ test_data で指定した列名が正しいか確認
   ✓ 外部キー制約に違反しないテストデータになっているか確認

4. **段階的テスト実行**
   ✓ 最初は少数のシナリオで動作確認
   ✓ カテゴリ別（user_access, organization_access等）に分けて実行
   ✓ 失敗シナリオの原因分析と修正

5. **RLS テストの期待動作ドキュメント化**
   各テーブルで以下を文書化：
   - どのロールがアクセス可能か
   - クロス組織アクセスの制限
   - CRUD操作の権限マトリックス
   - 特別な制約やビジネスルール

【よくある設定ミス】
- organization_id と jwt_template.org_id の不一致
- 存在しないUUIDを test_data で参照
- RLSポリシーの想定と expected_result の不一致
- テーブル名の typo や schema 指定ミス
- 外部キー制約違反によるINSERT/UPDATE失敗

【デバッグのヒント】
- まず Super Admin ユーザーで全テーブルへのアクセステスト
- RLSエラー時は error_code='42501' (insufficient_privilege) を確認
- SQL ログで実際に実行されたクエリを確認
- auth.uid() の値がjwt_template.sub と一致しているか確認
*/