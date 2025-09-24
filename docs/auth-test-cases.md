# 認証フロー テストケース (P0最小スコープ)

## 🎯 テスト目標
P0要件定義に沿って、3つの認証パターンが正常動作することを確認

## Test Case 1: 新規ユーザー登録フロー

### 手順
1. `/auth/signup` で新規ユーザー登録
2. 確認メールを受信
3. メール内リンクをクリック
4. `/auth/confirm` で確認完了
5. `/auth/login` でログイン
6. `/dashboard` にリダイレクト

### 期待結果
- ✅ 確認メール送信成功
- ✅ リンククリックで `/auth/confirm` 表示
- ✅ DBトリガーで `app_users` テーブルに `role: 'org_owner'` で自動作成
- ✅ ログイン成功後、`/dashboard` へリダイレクト
- ✅ `/api/auth/sync` の呼び出しなし
- ✅ セッション保持される

### 確認ポイント
```sql
-- app_users テーブルにレコードが自動作成されているか確認
SELECT id, role, created_at FROM app_users WHERE id = 'USER_ID';
```

## Test Case 2: 既存ユーザー（重複登録）

### 手順
1. 既に登録済みのメールアドレスで `/auth/signup`
2. エラーメッセージ確認
3. 「ログイン」リンクで `/auth/login` へ遷移
4. 正常ログイン

### 期待結果
- ✅ 「このメールアドレスは既に登録されています」日本語メッセージ
- ✅ ログイン導線が表示される
- ✅ ログイン成功後、`/dashboard` へリダイレクト

## Test Case 3: 期限切れ・メール未確認

### 手順
1. 24時間以上前に登録したが未確認のユーザーでログイン
2. エラーメッセージ確認
3. 「確認メールを再送信」ボタンクリック
4. 新しい確認メール受信
5. メール確認 → ログイン

### 期待結果
- ✅ 「メールアドレスが確認されていません」日本語メッセージ
- ✅ 再送信ボタンが表示される
- ✅ `/api/auth/resend-confirmation` で新しいメール送信
- ✅ 確認後、正常ログイン可能

## 🔍 共通確認事項

### ブラウザ Developer Tools
- Network タブで `/api/auth/sync` への リクエストが**発生しないこと**
- Console にエラーログが出力されないこと
- Session Storage に Supabase セッション情報が保存されること

### データベース
```sql
-- 新規ユーザー作成時にトリガーが動作しているか確認
SELECT 
  u.email,
  au.id,
  au.role,
  au.created_at
FROM auth.users u
JOIN app_users au ON u.id = au.id
WHERE u.email = 'test@example.com';
```

### URL 遷移フロー
```
新規: /signup → メール → /auth/confirm → /auth/login → /dashboard
既存: /signup → エラー → /auth/login → /dashboard  
期限: /auth/login → エラー → 再送信 → メール → /auth/confirm → /auth/login → /dashboard
```

## 🚨 NGパターン
- `/api/auth/sync` への リクエストが発生する
- 「Auth session missing」エラーが表示される
- リダイレクトループが発生する
- セッションが保持されない
- ダッシュボードから強制ログアウトされる

## 📊 成功基準
- 全3ケースでダッシュボード表示まで完了
- `/api/auth/sync` 非依存で動作
- 日本語エラーメッセージが適切に表示
- DBトリガーでプロフィール自動作成される