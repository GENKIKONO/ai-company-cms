# データベースマイグレーション手順書（商用レベル）

## 概要
商用認証システムのためのデータベーストリガー・RLS設定手順書

## 📋 実行前チェックリスト

- [ ] Supabaseプロジェクトへの管理者アクセス権限
- [ ] データベースのバックアップ完了
- [ ] 本番環境での実行許可取得
- [ ] ダウンタイムの事前通知完了（必要な場合）

## 🔧 実行手順

### Step 1: Supabase Dashboardアクセス
1. https://supabase.com/dashboard にアクセス
2. プロジェクト `chyicolujwhkycpkxbej` を選択
3. **SQL Editor** を開く

### Step 2: マイグレーションSQL実行
1. `supabase/sql/auth-trigger-setup.sql` の内容をコピー
2. SQL Editorに貼り付け
3. **Run** ボタンをクリック
4. 実行結果を確認

### Step 3: 実行結果確認

#### 成功ログの確認
以下のメッセージが表示されることを確認：
```
NOTICE: 商用レベルDBトリガー設定完了:
NOTICE: - プロフィール自動作成トリガー: on_auth_user_created
NOTICE: - RLSポリシー: 3件作成
NOTICE: - インデックス: 4件作成
```

#### エラーが発生した場合
- エラーメッセージをコピーして記録
- 実行を停止し、技術責任者に連絡
- 必要に応じてロールバック手順を実行

### Step 4: 動作検証

#### トリガー存在確認
```sql
SELECT tgname, tgrelid::regclass, tgfoid::regproc 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```
**期待結果**: 1件のレコード

#### RLSポリシー確認
```sql
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'app_users';
```
**期待結果**: 3件のポリシー
- Users can view own profile
- Users can update own profile  
- Service role can manage all profiles

#### テーブル構造確認
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'app_users'
ORDER BY ordinal_position;
```
**期待結果**: 
- id (uuid, not null)
- email (text, not null)
- role (text, not null, default: 'org_owner')
- partner_id (uuid, nullable)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

### Step 5: 機能テスト

#### 新規ユーザー作成テスト
**注意**: 本番環境では実際のユーザー登録で確認

1. テストユーザーでサインアップ実行
2. 以下のクエリでプロフィール自動作成を確認：

```sql
SELECT au.id, au.email, au.role, au.created_at
FROM auth.users u
JOIN app_users au ON u.id = au.id
WHERE u.email = 'TEST_EMAIL_ADDRESS'
ORDER BY au.created_at DESC
LIMIT 1;
```

**期待結果**:
- 1件のレコードが存在
- `role = 'org_owner'`
- `email` が正しく設定
- `created_at` が設定

## 🔄 ロールバック手順

緊急時のロールバック方法：

### Step 1: トリガー無効化
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

### Step 2: 関数削除
```sql
DROP FUNCTION IF EXISTS public.handle_new_user();
```

### Step 3: RLSポリシー削除
```sql
DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.app_users;  
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.app_users;

-- RLS完全無効化（データアクセスに注意）
-- ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;
```

### Step 4: インデックス削除（必要に応じて）
```sql
DROP INDEX IF EXISTS app_users_email_idx;
DROP INDEX IF EXISTS app_users_role_idx;
DROP INDEX IF EXISTS app_users_partner_id_idx;
DROP INDEX IF EXISTS app_users_created_at_idx;
```

## 🚨 トラブルシューティング

### よくあるエラーと対処法

#### 1. Permission denied for schema public
**原因**: 実行ユーザーの権限不足
**対処**: データベース管理者権限で実行

#### 2. relation "partners" does not exist
**原因**: partnersテーブルが存在しない
**対処**: partner_idカラムの外部キー制約を一時的に削除

#### 3. trigger "on_auth_user_created" already exists
**原因**: 既存トリガーの重複
**対処**: `DROP TRIGGER IF EXISTS` で既存を削除してから再作成

#### 4. RLS policy already exists
**原因**: 既存ポリシーの重複
**対処**: `DROP POLICY IF EXISTS` で既存を削除してから再作成

### 確認コマンド集

#### 現在のトリガー一覧
```sql
SELECT schemaname, tablename, triggername, actiontiming, actionstatement
FROM information_schema.triggers
WHERE schemaname = 'auth' OR schemaname = 'public';
```

#### 現在のRLSポリシー一覧  
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public';
```

#### 現在のインデックス一覧
```sql
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename = 'app_users';
```

## 📞 緊急連絡先

### 技術責任者
- 名前: [担当者名]
- 連絡先: [メール/Slack]
- 対応時間: [平日9-18時 等]

### データベース管理者
- 名前: [DBA担当者名]
- 連絡先: [メール/Slack]
- 緊急時連絡先: [電話番号]

---

**⚠️ 重要**: 本番環境での実行前に、必ずステージング環境で全手順をテストしてください。