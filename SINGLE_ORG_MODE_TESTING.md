# Single-Org Mode 手動テスト手順

## 前提条件
- データベースマイグレーション（20250927_single_org_mode.sql）が適用済み
- アプリケーションが起動中（npm run dev）
- テスト用ユーザーアカウントでログイン済み

## テスト環境の準備

### 1. データベース状態の確認
```bash
# Supabase Studio または psql で実行
SELECT created_by, COUNT(*) as org_count 
FROM public.organizations 
WHERE created_by IS NOT NULL 
GROUP BY created_by;

# 制約の確認
SELECT conname, contype 
FROM pg_constraint 
WHERE conname = 'unique_organizations_created_by';
```

### 2. RLSポリシーの確認
```bash
# ポリシー一覧の確認
SELECT polname, polcmd 
FROM pg_policies 
WHERE tablename = 'organizations' 
AND polname LIKE '%own%';
```

## API エンドポイントテスト

### Test Case 1: GET /api/my/organization (初回・企業なし)

**手順:**
```bash
curl -X GET "http://localhost:3000/api/my/organization" \
  -H "Content-Type: application/json" \
  -b "sb-access-token=YOUR_SESSION_TOKEN"
```

**期待結果:**
- Status: 200 OK
- Response: `{"data": null, "message": "No organization found"}`

### Test Case 2: POST /api/my/organization (新規作成)

**手順:**
```bash
curl -X POST "http://localhost:3000/api/my/organization" \
  -H "Content-Type: application/json" \
  -b "sb-access-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "テスト企業株式会社",
    "slug": "test-company-001",
    "description": "テスト用の企業です",
    "address_country": "Japan",
    "address_region": "東京都",
    "address_locality": "渋谷区",
    "telephone": "03-1234-5678",
    "email": "info@test-company.co.jp",
    "url": "https://test-company.co.jp"
  }'
```

**期待結果:**
- Status: 201 Created
- Response: 作成された企業データ
- `created_by` が現在のユーザーIDに設定されている

### Test Case 3: GET /api/my/organization (企業作成後)

**手順:**
```bash
curl -X GET "http://localhost:3000/api/my/organization" \
  -H "Content-Type: application/json" \
  -b "sb-access-token=YOUR_SESSION_TOKEN"
```

**期待結果:**
- Status: 200 OK
- Response: 作成した企業データが返される

### Test Case 4: POST /api/my/organization (重複作成試行)

**手順:** Test Case 2と同じリクエストを再実行

**期待結果:**
- Status: 409 Conflict
- Response: `{"error": "Conflict", "message": "User already has an organization"}`

### Test Case 5: PUT /api/my/organization (更新)

**手順:**
```bash
curl -X PUT "http://localhost:3000/api/my/organization" \
  -H "Content-Type: application/json" \
  -b "sb-access-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "更新されたテスト企業株式会社",
    "description": "更新されたテスト用企業です",
    "telephone": "03-9876-5432"
  }'
```

**期待結果:**
- Status: 200 OK
- Response: 更新された企業データ
- `updated_at` が更新されている

### Test Case 6: POST /api/my/organization (重複slug)

**手順:** 別のユーザーアカウントで、既存のslugを使用して企業作成を試行

**期待結果:**
- Status: 409 Conflict
- Response: `{"error": "Conflict", "message": "Slug already exists"}`

### Test Case 7: DELETE /api/my/organization (削除)

**手順:**
```bash
curl -X DELETE "http://localhost:3000/api/my/organization" \
  -H "Content-Type: application/json" \
  -b "sb-access-token=YOUR_SESSION_TOKEN"
```

**期待結果:**
- Status: 200 OK
- Response: `{"message": "Organization deleted successfully"}`

### Test Case 8: 認証なしでのアクセス

**手順:** 認証トークンなしで各エンドポイントにアクセス

**期待結果:**
- Status: 401 Unauthorized
- Response: `{"error": "Unauthorized", "message": "Authentication required"}`

## データベース制約テスト

### Test Case 9: 直接DB挿入での制約確認

**手順:** PostgreSQL で直接実行
```sql
-- 同一ユーザーで2つ目の企業作成を試行
INSERT INTO public.organizations (name, slug, created_by) 
VALUES ('テスト企業2', 'test-company-002', 'USER_ID_HERE');
```

**期待結果:**
- エラー: unique constraint violation
- エラーメッセージに `unique_organizations_created_by` が含まれる

## RLSポリシーテスト

### Test Case 10: 他ユーザーの企業へのアクセス制限

**手順:**
1. ユーザーAで企業を作成
2. ユーザーBでログイン
3. ユーザーBでGET /api/my/organizationを実行

**期待結果:**
- ユーザーBには企業データが表示されない（data: null）

### Test Case 11: 他ユーザーの企業の更新試行

**手順:**
1. ユーザーAで企業を作成
2. ユーザーBでログイン  
3. ユーザーBで企業の更新を試行

**期待結果:**
- Status: 404 Not Found
- Response: `{"error": "Not Found", "message": "Organization not found"}`

## エラーハンドリングテスト

### Test Case 12: 必須フィールド不足

**手順:**
```bash
curl -X POST "http://localhost:3000/api/my/organization" \
  -H "Content-Type: application/json" \
  -b "sb-access-token=YOUR_SESSION_TOKEN" \
  -d '{
    "description": "名前がない企業"
  }'
```

**期待結果:**
- Status: 400 Bad Request
- Response: `{"error": "Validation error", "message": "Name and slug are required"}`

### Test Case 13: 不正なデータ型

**手順:**
```bash
curl -X POST "http://localhost:3000/api/my/organization" \
  -H "Content-Type: application/json" \
  -b "sb-access-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "テスト企業",
    "slug": "test-company",
    "capital": "invalid_number",
    "employees": "not_a_number"
  }'
```

**期待結果:**
- サーバーエラーまたは適切なバリデーションエラー

## 統合テスト

### Test Case 14: フロントエンドからの完全フロー

**手順:**
1. ログイン画面でユーザー認証
2. ダッシュボードで「企業を追加」をクリック
3. 企業情報フォームに入力
4. 保存ボタンをクリック
5. 企業編集画面で情報を更新
6. 保存ボタンをクリック

**期待結果:**
- 各ステップで適切なレスポンスとUI更新
- データベースに正しく保存される
- ユーザーは1つの企業のみ作成・管理可能

## パフォーマンステスト

### Test Case 15: 大量データでの制約確認

**手順:**
```sql
-- 1000件の企業データがある状態で制約のパフォーマンス確認
EXPLAIN ANALYZE SELECT * FROM organizations WHERE created_by = 'USER_ID';
```

**期待結果:**
- インデックスが使用されている
- 実行時間が適切（< 100ms）

## セキュリティテスト

### Test Case 16: SQLインジェクション耐性

**手順:**
```bash
curl -X POST "http://localhost:3000/api/my/organization" \
  -H "Content-Type: application/json" \
  -b "sb-access-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "テスト企業'\'''; DROP TABLE organizations; --",
    "slug": "test-sql-injection"
  }'
```

**期待結果:**
- SQLインジェクションが実行されない
- 適切にエスケープされて保存される

## クリーンアップ手順

テスト完了後、以下を実行：

```sql
-- テストデータの削除
DELETE FROM public.organizations WHERE name LIKE '%テスト%';

-- 制約の確認（削除しない）
SELECT COUNT(*) FROM public.organizations;
```

## チェックリスト

- [ ] 全てのAPI エンドポイントが期待通りの動作をする
- [ ] データベース制約が正しく機能する
- [ ] RLSポリシーがセキュリティを保証する
- [ ] エラーハンドリングが適切に実装されている
- [ ] TypeScript型定義が正しく機能する
- [ ] パフォーマンスが許容範囲内である
- [ ] セキュリティ脆弱性がない

## 注意事項

1. **本番環境では実行しない**: このテストは開発環境でのみ実行
2. **データバックアップ**: 重要なデータがある場合は事前にバックアップ
3. **セッショントークン**: 実際のセッショントークンは開発者ツールから取得
4. **エラーログ**: 各テスト実行時にサーバーログも確認