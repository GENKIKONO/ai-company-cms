# Supabase認証設定チェックリスト

## 実行前の確認事項

- [ ] Supabaseプロジェクトにアクセス可能（chyicolujwhkycpkxbej.supabase.co）
- [ ] データベースマイグレーション実行権限あり
- [ ] 本番ドメイン（https://aiohub.jp）の所有者確認済み

## 1. Authentication URL設定

**Supabase Dashboard** → **Authentication** → **URL Configuration**

- [ ] Site URL: `https://aiohub.jp` に設定
- [ ] Redirect URLs: `https://aiohub.jp/*` に設定  
- [ ] Default redirect URL: `https://aiohub.jp` に設定
- [ ] 設定保存後、画面表示で確認完了

## 2. Email Templates設定

**Supabase Dashboard** → **Authentication** → **Email Templates**

### Confirm signup
- [ ] Subject: 「【AIO Hub】メールアドレスの確認をお願いします」に設定
- [ ] Body: 日本語テンプレート貼り付け（`{{ .ConfirmationURL }}`含む）
- [ ] プレビューで表示確認
- [ ] 保存完了

### Reset password
- [ ] Subject: 「【AIO Hub】パスワードリセットのご案内」に設定
- [ ] Body: 日本語テンプレート貼り付け（`{{ .ConfirmationURL }}`含む）
- [ ] プレビューで表示確認
- [ ] 保存完了

### Invite user
- [ ] Subject: 「【AIO Hub】チームへの招待」に設定
- [ ] Body: 日本語テンプレート貼り付け（`{{ .ConfirmationURL }}`含む）
- [ ] プレビューで表示確認
- [ ] 保存完了

## 3. SMTP設定確認

**Supabase Dashboard** → **Authentication** → **Settings** → **SMTP Settings**

- [ ] Custom SMTP: **OFF** (未有効化)
- [ ] デフォルトのSupabaseメール配信を使用
- [ ] 「Test connection」は実行しない（カスタムSMTP無効のため）

## 4. DBトリガー実行

**Supabase Dashboard** → **SQL Editor**

- [ ] `supabase/sql/auth-trigger-setup.sql` をコピー&ペースト
- [ ] SQLの実行（Run）
- [ ] 実行結果でエラーなし確認
- [ ] トリガー確認SQL実行：
  ```sql
  SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```
  → 1件取得できること

## 5. RLSポリシー確認

**SQL Editor** で以下を実行：

- [ ] RLS有効化確認：
  ```sql
  SELECT schemaname, tablename, rowsecurity 
  FROM pg_tables 
  WHERE tablename = 'app_users';
  ```
  → `rowsecurity: true` であること

- [ ] ポリシー確認：
  ```sql
  SELECT policyname, roles, cmd, qual 
  FROM pg_policies 
  WHERE tablename = 'app_users';
  ```
  → 3件のポリシーが存在すること

## 6. 環境変数確認

**Supabase Dashboard** → **Settings** → **API**

- [ ] Project URL: `https://chyicolujwhkycpkxbej.supabase.co`
- [ ] anon key (public): コピーしてアプリ環境変数に設定済み
- [ ] service_role key: コピーしてアプリ環境変数に設定済み
- [ ] JWTシークレット: 確認のみ（アプリでは使用しない）

## 7. テスト実行

### 基本テスト
- [ ] テスト用メールアドレスで新規登録実行
- [ ] 確認メールが送信される
- [ ] メール内のConfirmationURLが `https://aiohub.jp/auth/confirm` 形式
- [ ] リンククリックで確認完了
- [ ] `app_users` テーブルにレコード自動作成確認

### SQL確認
```sql
-- 作成されたユーザー確認
SELECT au.id, au.email, au.role, au.created_at
FROM auth.users u
JOIN app_users au ON u.id = au.id
WHERE u.email = 'test@example.com';
```
- [ ] 1件のレコードが存在
- [ ] `role = 'org_owner'`
- [ ] `email` が正しく設定

## 8. 最終確認

- [ ] localhost を含むURL設定が存在しない
- [ ] 全てのテンプレートで `https://aiohub.jp` が使用される
- [ ] エラーログにauth関連のエラーなし
- [ ] 設定変更をすべて保存済み

## トラブルシューティング

### よくあるエラー
1. **Confirmation URLが404**: Redirect URLs設定を再確認
2. **メール未送信**: Email Templates設定とSMTP設定を確認
3. **トリガー未動作**: SQL実行結果を確認、権限エラーの可能性
4. **RLS拒否**: ポリシー設定とauth.uid()の動作確認

### 緊急時の連絡先
- 技術責任者: [連絡先情報]
- Supabaseサポート: [サポートチケット作成方法]

---

**✅ このチェックリストを全項目完了することで、商用レベルの認証システムが構築されます**