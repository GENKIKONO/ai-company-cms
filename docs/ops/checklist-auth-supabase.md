# Supabase認証設定チェックリスト（商用レベル完全版）

## 実行前の確認事項

- [ ] Supabaseプロジェクトにアクセス可能（https://supabase.com/dashboard/project/chyicolujwhkycpkxbej）
- [ ] Organization Owner または Database Admin 権限あり
- [ ] 本番ドメイン（https://aiohub.jp）の所有者確認済み
- [ ] SQLエディター実行権限確認済み

## 1. Authentication URL設定

**画面遷移**: Supabase Dashboard → 左サイドバー「Authentication」→「URL Configuration」タブ

### 設定項目と合格基準

**Site URL**
- [ ] フィールド値: `https://aiohub.jp`（末尾スラッシュなし）
- [ ] 合格基準: 入力後にグリーンのチェックマークが表示される
- [ ] NG例: localhost, http://, 末尾スラッシュあり

**Redirect URLs**
- [ ] フィールド値: `https://aiohub.jp/*`（ワイルドカード必須）
- [ ] 合格基準: 「Valid redirect URL」と表示される
- [ ] NG例: 複数のlocalhost URL、http://、ワイルドカードなし

**Default redirect URL after logout**
- [ ] フィールド値: `https://aiohub.jp`
- [ ] 合格基準: Site URLと同一値

**画面UI確認**
- [ ] 「Save」ボタンクリック後、緑色の成功メッセージ表示
- [ ] ページリロード後も設定値が保持されている
- [ ] 警告・エラーメッセージが表示されていない

## 2. Email Templates設定

**画面遷移**: Supabase Dashboard → 左サイドバー「Authentication」→「Email Templates」タブ

### Confirm signup（メールアドレス確認）

**操作手順**
- [ ] "Confirm signup" カードをクリック
- [ ] Subject フィールドに入力: `【AIO Hub】メールアドレスの確認をお願いします`
- [ ] Message (HTML) フィールドに以下をコピペ:

```html
<h2>AIO Hubへのご登録ありがとうございます</h2>
<p>下記のリンクをクリックして、メールアドレスの確認を完了してください：</p>
<p><a href="{{ .ConfirmationURL }}" style="background:#4f46e5; color:white; padding:12px 24px; text-decoration:none; border-radius:6px;">メールアドレスを確認する</a></p>
<p>このリンクは24時間有効です。</p>
<hr>
<p><small>AIO Hub チーム<br>https://aiohub.jp</small></p>
```

**合格基準**
- [ ] 「Save」ボタンクリック後、緑色成功メッセージ
- [ ] Preview機能で {{ .ConfirmationURL }} が実際のリンクになることを確認
- [ ] リンクが https://aiohub.jp/auth/confirm で始まることを確認

### Reset password（パスワードリセット）

**操作手順**
- [ ] "Reset password" カードをクリック
- [ ] Subject: `【AIO Hub】パスワードリセットのご案内`
- [ ] Message (HTML):

```html
<h2>パスワードリセットのご案内</h2>
<p>パスワードリセットのご依頼を受け付けました。</p>
<p>下記のリンクをクリックして、新しいパスワードを設定してください：</p>
<p><a href="{{ .ConfirmationURL }}" style="background:#dc2626; color:white; padding:12px 24px; text-decoration:none; border-radius:6px;">パスワードをリセットする</a></p>
<p>このリンクは1時間有効です。お心当たりがない場合は、このメールを無視してください。</p>
<hr>
<p><small>AIO Hub チーム<br>https://aiohub.jp</small></p>
```

**合格基準**
- [ ] 保存成功メッセージ確認
- [ ] Preview確認（リンク形式チェック）

### Invite user（招待）

**操作手順**
- [ ] "Invite user" カードをクリック  
- [ ] Subject: `【AIO Hub】チームへの招待`
- [ ] Message (HTML):

```html
<h2>チームへの招待</h2>
<p>{{ .SiteURL }}への招待が届いています。</p>
<p>下記のリンクをクリックして、アカウントを作成してください：</p>
<p><a href="{{ .ConfirmationURL }}" style="background:#059669; color:white; padding:12px 24px; text-decoration:none; border-radius:6px;">アカウントを作成する</a></p>
<p>このリンクは72時間有効です。</p>
<hr>
<p><small>AIO Hub チーム<br>https://aiohub.jp</small></p>
```

**合格基準**  
- [ ] 保存成功確認
- [ ] {{ .SiteURL }} が https://aiohub.jp に展開されることを確認

## 3. SMTP設定確認

**画面遷移**: Supabase Dashboard → 左サイドバー「Authentication」→「Settings」タブ → 「SMTP Settings」セクション

**設定確認**
- [ ] Enable custom SMTP: **チェックOFF**（無効状態を維持）
- [ ] 「Use Supabase SMTP」の表示を確認
- [ ] Custom SMTP設定フィールドがグレーアウトされていること

**合格基準**
- [ ] カスタムSMTP設定は無効状態（Resendは補助通知のみ使用）
- [ ] Supabaseデフォルトメール配信が有効
- [ ] Test connection ボタンは使用不可状態

## 4. DBトリガー・RLS実行

**画面遷移**: Supabase Dashboard → 左サイドバー「SQL Editor」→「New query」

### 4.1 メインSQL実行

**操作手順**
- [ ] プロジェクトローカルの `supabase/sql/auth-trigger-setup.sql` をエディタで開く
- [ ] 全コンテンツをコピー（Ctrl+A → Ctrl+C）
- [ ] Supabase SQL Editorの新しいクエリにペースト
- [ ] 「RUN」ボタンをクリック（Ctrl+Enter）

**実行結果の合格基準**
- [ ] 実行完了: "Success. No rows returned" または "Query executed successfully"
- [ ] エラー表示なし（赤色のエラーメッセージが出ていない）
- [ ] 最下部に「商用レベルDBトリガー設定完了」のメッセージが表示される

### 4.2 検証クエリ実行

**トリガー確認**
- [ ] 新しいクエリタブで以下を実行:
```sql
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```
- [ ] 結果: 1件取得、tgenabled = 'O' (enabled)

**テーブル構造確認**
- [ ] 以下を実行:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='app_users'
ORDER BY ordinal_position;
```
- [ ] 結果: id, email, role, partner_id, created_at, updated_at の6列存在

### 4.3 RLSポリシー確認

**RLS有効化確認**
- [ ] 以下を実行:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'app_users';
```
- [ ] 合格基準: rowsecurity = true

**ポリシー確認**
- [ ] 以下を実行:
```sql
SELECT policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'app_users'
ORDER BY policyname;
```
- [ ] 合格基準: 3件のポリシーが存在
  - "Service role can manage all profiles"
  - "Users can update own profile"  
  - "Users can view own profile"

**インデックス確認**
- [ ] 以下を実行:
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'app_users';
```
- [ ] 合格基準: 5件以上のインデックス（app_users_*_idx）

## 5. 環境変数・APIキー確認

**画面遷移**: Supabase Dashboard → 左サイドバー「Settings」→「API」タブ

### 5.1 Project URL確認
- [ ] Project URL: `https://chyicolujwhkycpkxbej.supabase.co`
- [ ] コピーボタンでクリップボードにコピー
- [ ] フォーマット確認: https://で始まり.supabase.coで終わる

### 5.2 API Keys取得
**anon / public key**
- [ ] "anon public" セクションでコピーアイコンクリック
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY としてメモ（表示された値）
- [ ] フォーマット確認: eyJで始まる長い文字列

**service_role key** 
- [ ] "service_role secret" セクションでコピーアイコンクリック
- [ ] SUPABASE_SERVICE_ROLE_KEY としてメモ（表示された値）
- [ ] フォーマット確認: eyJで始まり、anon keyとは異なる値

### 5.3 セキュリティ確認
- [ ] JWT Secret: 表示のみ（アプリでは未使用）
- [ ] service_role key のSecretアイコンが赤色（注意表示）であること

## 6. 事前テスト実行（SQLエディターで）

### 6.1 トリガー動作テスト

**テスト用ユーザー作成**
- [ ] 新しいSQLクエリタブで以下を実行:
```sql
-- テスト用ユーザー作成(トリガー動作テスト)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'trigger-test@example.com', NOW(), NOW(), NOW())
RETURNING id, email;
```
- [ ] 結果: 1行が挿入されるidがUUID形式で返される

**トリガー自動作成確認**
- [ ] 以下を実行:
```sql
-- app_usersに自動作成されたか確認
SELECT au.id, au.email, au.role, au.created_at
FROM auth.users u
JOIN app_users au ON u.id = au.id
WHERE u.email = 'trigger-test@example.com';
```
- [ ] 合格基準: 1件取得、role = 'org_owner'、emailが正しく設定

**クリーンアップ**
- [ ] テストデータ削除:
```sql
-- テストデータ削除
DELETE FROM auth.users WHERE email = 'trigger-test@example.com';
```

### 6.2 RLSポリシーテスト

- [ ] 以下でポリシー動作をテスト:
```sql
-- サービスロールで全データ取得可能か確認
SELECT COUNT(*) FROM app_users; -- 管理者権限で実行
```
- [ ] 結果: エラーなしで件数が返される

### 6.3 最終確認

- [ ] 全テストSQLでエラーなし
- [ ] トリガー自動作成動作確認済み
- [ ] RLSポリシーが正常動作

## 7. 最終確認チェックリスト

### 7.1 URL設定再確認
- [ ] Site URL: `https://aiohub.jp` (末尾スラッシュなし)
- [ ] Redirect URLs: `https://aiohub.jp/*` (ワイルドカードあり)
- [ ] localhost を含むURL設定が存在しないこと
- [ ] 「Save」ボタンがグレーアウトされている（保存済み）

### 7.2 メールテンプレート再確認
- [ ] 3つのテンプレート全てに `https://aiohub.jp` が含まれている
- [ ] {{ .ConfirmationURL }} 、{{ .SiteURL }} が正しく記載されている
- [ ] HTMLタグが正しく閉じられている

### 7.3 データベース設定総点検
- [ ] app_users テーブルが存在しRLSが有効
- [ ] on_auth_user_created トリガーが有効状態
- [ ] 3つのRLSポリシーが存在
- [ ] 必要インデックスが作成済み

### 7.4 環境変数チェック
- [ ] Project URL: `https://chyicolujwhkycpkxbej.supabase.co`
- [ ] anon key: eyJで始まる長い文字列
- [ ] service_role key: anon keyと異なる長い文字列

### 7.5 セキュリティ確認
- [ ] Custom SMTP が無効状態（Resendは別系統）
- [ ] service_role key の秘匙性が維持されている
- [ ] テストSQLでエラーが発生していない

## 8. トラブルシューティング

### 8.1 よくある設定エラーと対処法

**Error: Invalid redirect URL**
- [ ] 原因: Redirect URLsに localhost や http:// が混入
- [ ] 対処: https://aiohub.jp/* のみに修正
- [ ] 確認: 設定画面で緑のチェックマーク表示

**Error: Trigger not found**
- [ ] 原因: SQL実行が完全に完了していない
- [ ] 対処: supabase/sql/auth-trigger-setup.sql を再実行
- [ ] 確認: SELECT tgname FROM pg_trigger で検索

**Error: Permission denied for relation app_users**
- [ ] 原因: RLSポリシーが正しく設定されていない
- [ ] 対処: RLS設定部分のSQLを再実行
- [ ] 確認: service_role権限でのアクセステスト

**Warning: メール送信されない**
- [ ] 原因: Email Templateの{{ .ConfirmationURL }}が欠落
- [ ] 対処: テンプレート再設定、プレビューで確認
- [ ] 確認: テスト送信でリンク確認

### 8.2 緊急時の確認手順

**設定値の緊急確認**
```sql
-- Supabase SQL Editorで実行
SELECT 
  'app_users exists' as check_item,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='app_users') as result
UNION ALL
SELECT 
  'trigger exists' as check_item,
  EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='on_auth_user_created') as result
UNION ALL  
SELECT
  'RLS enabled' as check_item,
  (SELECT rowsecurity FROM pg_tables WHERE tablename='app_users') as result;
```

### 8.3 システム管理者への連絡時の必要情報

- [ ] 実行した手順番号（例：「4.2 検証クエリ実行」で失敗）
- [ ] エラーメッセージの全文（スクリーンショット推奨）
- [ ] Supabaseプロジェクト URL：chyicolujwhkycpkxbej
- [ ] 実行したSQLクエリ（該当する場合）

---

## ✅ 完了条件

**このチェックリストの全項目（1-7セクション）を完了することで、商用レベルの認証システムが構築されます**

**次のステップ**: 
1. Vercel環境変数設定（`docs/deploy/production-runbook.md`参照）
2. 本番E2Eテスト実行（`docs/e2e/auth-three-scenarios.md`参照）