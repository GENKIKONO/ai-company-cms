# P1-6: RLS 検証・テスト基盤

## 目的

AIOHub の Row Level Security (RLS) ポリシーを人力ではなく体系的に検証するための「土台」を構築しました。

現在は手動テストの基盤として機能し、将来の自動化への拡張を可能にする設計になっています。

## 現在できること（MVP）

### 1. RLS ポリシーの一覧取得

Supabase ダッシュボードまたは SQL クライアントから以下のクエリを実行することで、現在の RLS ポリシー設定を確認できます：

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,           -- SELECT, INSERT, UPDATE, DELETE
  roles,         -- 適用されるロール
  using,         -- 条件式（SELECT/DELETE用）
  with_check     -- 条件式（INSERT/UPDATE用）
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 2. テスト結果の記録

`admin.rls_test_results` テーブルにテスト結果を保存できます：

```sql
-- テーブル構造
CREATE TABLE admin.rls_test_results (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name   text NOT NULL,
  table_name  text NOT NULL,
  actor       text NOT NULL,      -- テスト対象ユーザーの説明
  jwt_claims  jsonb,              -- JWTクレーム（将来用）
  operation   text NOT NULL,      -- SELECT, INSERT, UPDATE, DELETE
  expected    text,               -- 期待結果
  actual      text,               -- 実際の結果
  passed      boolean NOT NULL,   -- テスト成功/失敗
  details     jsonb,              -- 詳細情報
  created_at  timestamptz DEFAULT now()
);
```

### 3. 手動テストの例

以下は `public.organizations` テーブルに対する手動テストの例です：

```sql
-- 1. service_role で接続し、テストを実行
-- （実際のテストでは適切なJWTを使用する必要があります）

-- テスト例: 組織オーナーが自分の組織を読み取れるか
INSERT INTO admin.rls_test_results (
  test_name,
  table_name,
  actor,
  operation,
  expected,
  actual,
  passed,
  details
) VALUES (
  'org_owner_can_read_own_org',
  'organizations',
  'organization owner (user_id: xxx)',
  'SELECT',
  'allow',
  'allow',
  true,
  jsonb_build_object(
    'query', 'SELECT * FROM organizations WHERE id = $1',
    'result_count', 1,
    'test_timestamp', now()
  )
);

-- テスト例: 他組織のユーザーが組織データを読み取れないか
INSERT INTO admin.rls_test_results (
  test_name,
  table_name,
  actor,
  operation,
  expected,
  actual,
  passed,
  details
) VALUES (
  'cross_org_user_cannot_read_other_org',
  'organizations',
  'different org member (user_id: yyy)',
  'SELECT',
  'deny',
  'deny',
  true,
  jsonb_build_object(
    'query', 'SELECT * FROM organizations WHERE id = $1',
    'result_count', 0,
    'test_timestamp', now()
  )
);
```

### 4. テスト結果の確認

```sql
-- 最新のテスト結果を確認
SELECT 
  test_name,
  table_name,
  actor,
  operation,
  expected,
  actual,
  passed,
  created_at
FROM admin.rls_test_results
ORDER BY created_at DESC
LIMIT 20;

-- 失敗したテストのみ確認
SELECT 
  test_name,
  table_name,
  details
FROM admin.rls_test_results
WHERE passed = false
ORDER BY created_at DESC;
```

## 将来の拡張（TODO）

現在のMVPを基盤として、以下の機能を段階的に実装予定です：

### 自動テストランナー
- [ ] 擬似 JWT を生成してユーザーコンテキストを模擬
- [ ] TypeScript による自動テスト実行スクリプト
- [ ] 組織境界・ロール権限・コンテンツアクセスの体系的テスト
- [ ] テスト設定の外部ファイル化

### CI/CD 統合
- [ ] GitHub Actions での自動 RLS テスト実行
- [ ] migration 変更時の自動検証
- [ ] 前回結果との差分チェック
- [ ] Pull Request へのテスト結果レポート

### 管理画面
- [ ] Super Admin Console から `admin.rls_test_results` を閲覧
- [ ] テスト結果のダッシュボード表示
- [ ] RLS ポリシー変更履歴の可視化
- [ ] テスト失敗時のアラート機能

### 運用機能
- [ ] スケジュール実行（日次/週次のRLSチェック）
- [ ] カバレッジレポート（未テストのポリシー検出）
- [ ] パフォーマンス監視（RLSクエリ実行時間）

## 関連ファイル

### 実装済み
- `admin.rls_test_results` テーブル（Supabase本番DB適用済み）
- `docs/p1-6-rls-testing.md`（このファイル）
- `supabase/p1-6_rls_policies_snapshot.sql`（ポリシー一覧クエリ）
- `supabase/p1-6_admin_rls_test_results_ddl.sql`（テーブルDDL）

### 実験的実装（未使用）
- `scripts/experimental/rls-test-runner.ts`
- `scripts/experimental/rls-test-types.ts`
- `scripts/experimental/rls-test-config.ts`

これらのファイルは将来の自動化実装の参考として保持していますが、現在は使用されていません。

## 使用上の注意

1. **権限管理**: `admin.rls_test_results` テーブルは `admin` スキーマ内にあり、適切な権限設定が必要です。

2. **JWT 認証**: 現在の手動テストでは service_role を使用していますが、実際のRLS検証には適切なJWT生成が必要です。

3. **テストデータ**: 本番環境でテストを行う場合は、テスト用データの作成・削除を慎重に行ってください。

4. **パフォーマンス**: RLS ポリシーの複雑さによってはクエリ実行時間が長くなる可能性があります。