# 制裁システム自動非公開機能 動作確認手順

## 前提条件
- Supabase マイグレーション `20251114_add_auto_unpublish_to_deadlines.sql` が適用済み
- `unpublish_org_public_content_for_user(p_user_id uuid)` 関数が Supabase 側に実装済み
- 管理者権限でのアクセスが可能

## テストシナリオ1: suspend アクション実行による自動非公開

### 1. テストユーザーで公開コンテンツを作成

1. テストユーザー（Genkikono Kochi さんなど）でダッシュボードにログイン
2. 以下の公開コンテンツを1件以上作成・公開：
   - **サービス**: `/dashboard/services/new` から作成、`is_published = true` で保存
   - **ブログ投稿**: `/dashboard/posts/new` から作成、`status = 'published'` で保存
   - **事例**: `/dashboard/case-studies/new` から作成、`is_published = true` で保存

3. 作成したコンテンツが公開状態で表示されることを確認：
   ```sql
   -- 確認用クエリ（管理者として実行）
   SELECT 
     'services' as content_type, id, title, is_published, created_by
   FROM services WHERE created_by = 'テストユーザーのID'
   UNION ALL
   SELECT 
     'posts' as content_type, id, title::text, (status = 'published')::boolean, author_id
   FROM posts WHERE author_id = 'テストユーザーのID';
   ```

### 2. Enforcement Actions API で suspend を実行

1. 管理画面 `/admin/enforcement` にアクセス
2. テストユーザーを検索・選択
3. 「一時停止」アクションを実行：
   ```json
   POST /api/enforcement/actions/suspend
   {
     "userId": "テストユーザーのID",
     "message": "テスト用の一時停止処分",
     "deadline": "2025-11-17T10:00:00.000Z"
   }
   ```

### 3. 自動非公開の実行確認

1. **account_status の変更確認**：
   ```sql
   SELECT id, email, account_status 
   FROM profiles 
   WHERE id = 'テストユーザーのID';
   -- 結果: account_status = 'suspended'
   ```

2. **公開コンテンツの非公開化確認**：
   ```sql
   SELECT 
     'services' as content_type, id, title, is_published, created_by
   FROM services WHERE created_by = 'テストユーザーのID'
   UNION ALL
   SELECT 
     'posts' as content_type, id, title::text, (status = 'published')::boolean, author_id
   FROM posts WHERE author_id = 'テストユーザーのID';
   -- 結果: すべて is_published = false または status != 'published'
   ```

3. **ログの確認**：
   - アプリケーションログで以下のメッセージが出力されることを確認：
   ```
   [INFO] auto_unpublished_public_content: { userId: "テストユーザーのID", component: "enforcement-auto-unpublish" }
   ```

## テストシナリオ2: warn アクション + 期限到達による自動処理

### 1. 新しいテストユーザーで warn アクション実行

1. 別のテストユーザーで公開コンテンツを作成（シナリオ1と同様）
2. 管理画面で「警告」アクションを実行（短い期限付き）：
   ```json
   POST /api/enforcement/actions/warn
   {
     "userId": "テストユーザー2のID", 
     "message": "警告処分",
     "deadline": "2025-11-14T02:10:00.000Z"  // 10分後など
   }
   ```

3. 実行直後の状態確認：
   ```sql
   SELECT id, account_status FROM profiles WHERE id = 'テストユーザー2のID';
   -- 結果: account_status = 'warned'（まだ公開コンテンツは表示されている）
   ```

### 2. 期限到達処理の手動実行

1. **期限が過ぎたら** `process_enforcement_deadlines()` を手動実行：
   ```sql
   SELECT process_enforcement_deadlines();
   -- または API から: POST /api/enforcement/jobs/process
   ```

2. **自動状態変更の確認**：
   ```sql
   SELECT id, account_status FROM profiles WHERE id = 'テストユーザー2のID';
   -- 結果: account_status = 'suspended'
   ```

3. **自動非公開の確認**：
   ```sql
   -- コンテンツが自動で非公開になっていることを確認
   SELECT 'services' as type, title, is_published 
   FROM services WHERE created_by = 'テストユーザー2のID'
   UNION ALL  
   SELECT 'posts' as type, title, (status = 'published')::boolean
   FROM posts WHERE author_id = 'テストユーザー2のID';
   ```

### 3. ログの確認

PostgreSQL ログで以下のメッセージが出力されることを確認：
```
LOG: process_enforcement_deadlines: user_id=テストユーザー2のID, action=warn, new_status=suspended, auto_unpublish=executed
```

## テストシナリオ3: freeze → deleted の自動処理

### 1. freeze アクションの実行
```json
POST /api/enforcement/actions/freeze  
{
  "userId": "テストユーザー3のID",
  "message": "アカウント凍結",
  "deadline": "2025-11-14T02:20:00.000Z"  // 20分後
}
```

### 2. 期限到達時の処理確認
```sql
-- 期限後に実行
SELECT process_enforcement_deadlines();

-- 結果確認  
SELECT id, account_status FROM profiles WHERE id = 'テストユーザー3のID';
-- 結果: account_status = 'deleted'
```

## 期待される結果

✅ **API レベルでの自動非公開**:
- `suspend` / `freeze` / `delete` アクション実行時に即座に非公開処理が実行される

✅ **期限処理での自動非公開**:
- `warn` 期限到達で `suspended` になり、自動非公開が実行される
- `suspend` → `frozen`、`freeze` → `deleted` でも自動非公開が実行される

✅ **冪等性**:
- 既に非公開のコンテンツに対して重複実行されてもエラーにならない

✅ **ログ出力**:
- すべての自動非公開処理でログが適切に出力される

## トラブルシューティング

### 自動非公開が実行されない場合
1. `unpublish_org_public_content_for_user` 関数が Supabase 側に存在するか確認
2. Service Role の権限で RPC 実行可能か確認  
3. アプリケーションログでエラーメッセージを確認

### 期限処理が動作しない場合
1. マイグレーション `20251114_add_auto_unpublish_to_deadlines.sql` が適用されているか確認
2. `deadline` が過去の時刻に設定されているか確認
3. PostgreSQL ログレベルが `LOG` 以上に設定されているか確認

この手順により、制裁システムと公開コンテンツの連携が運用レベルで完結していることを保証できます。