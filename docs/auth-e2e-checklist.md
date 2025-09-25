# 認証システムE2Eテストチェックリスト（商用レベル）

## 🎯 テスト目標
商用レベルの認証システムが完全に動作することを3パターンで検証

## 📋 テスト前準備

### 環境確認
- [ ] テスト環境: https://aiohub.jp または プレビューURL
- [ ] ブラウザ: Chrome最新版（開発者ツール使用）
- [ ] テスト用メールアドレス準備
- [ ] Supabase Dashboard アクセス権限

### 開発者ツール設定
1. F12 → **Network** タブ
2. **Preserve log** ☑️ ON
3. **Console** タブも同時表示

## ✅ Test Case A: 新規ユーザー登録フロー

### A-1. 新規登録
1. `https://aiohub.jp/auth/signup` にアクセス
2. 未使用のメールアドレス入力：`test+${timestamp}@example.com`
3. パスワード入力：`TestPass123!`
4. パスワード確認入力：同じパスワード  
5. **「アカウント作成」** ボタンクリック

**✅ 期待結果**:
- [ ] 「確認メールを送信しました」メッセージ表示
- [ ] 「メールが届かない場合は再送信」ボタン表示
- [ ] Network タブでエラーなし

### A-2. 確認メール受信・確認
1. テスト用メールボックス確認
2. **Subject**: 「【AIO Hub】メールアドレスの確認をお願いします」
3. メール内のリンクをクリック

**✅ 期待結果**:
- [ ] メール受信確認（5分以内）
- [ ] リンククリックで `https://aiohub.jp/auth/confirm` に遷移
- [ ] 「確認完了」メッセージ表示
- [ ] 3秒後に `/dashboard` へ自動リダイレクト

### A-3. ダッシュボード到達確認
**✅ 期待結果**:
- [ ] `/dashboard` ページ表示
- [ ] ユーザー情報表示
- [ ] ページリロード後もログイン状態保持

### A-4. データベース確認
Supabase Dashboard → SQL Editor で実行：
```sql
SELECT au.id, au.email, au.role, au.created_at
FROM auth.users u
JOIN app_users au ON u.id = au.id
WHERE u.email = 'YOUR_TEST_EMAIL'
ORDER BY au.created_at DESC
LIMIT 1;
```

**✅ 期待結果**:
- [ ] 1件のレコード存在
- [ ] `role = 'org_owner'`
- [ ] `email` 正しく設定
- [ ] `created_at` 現在時刻

### A-5. Network 確認
**✅ 期待結果**:
- [ ] `/api/auth/sync` リクエスト **発生しないこと**
- [ ] 認証関連のエラー（401, 403, 500）なし
- [ ] Console にエラーログなし

## ✅ Test Case B: 既存ユーザー（重複登録）

### B-1. 重複登録試行
1. `https://aiohub.jp/auth/signup` にアクセス
2. **Test Case A で使用したメールアドレス** を入力
3. パスワード入力：`AnotherPass456!`
4. **「アカウント作成」** ボタンクリック

**✅ 期待結果**:
- [ ] 「このメールアドレスはすでに登録されています」日本語エラー表示
- [ ] 「ログインページへ」「パスワードリセット」リンク表示
- [ ] エラーメッセージ色: 赤背景

### B-2. ログインページ遷移
1. 「ログインページへ」リンククリック
2. **Test Case A のメールアドレス・パスワード** でログイン

**✅ 期待結果**:
- [ ] `/auth/login` へ遷移
- [ ] ログイン成功
- [ ] `/dashboard` へリダイレクト
- [ ] セッション保持確認（リロード後も保持）

## ✅ Test Case C: パスワードリセットフロー

### C-1. パスワードリセット要求
1. `https://aiohub.jp/auth/login` にアクセス
2. 「パスワードを忘れた方はこちら」クリック
3. **Test Case A のメールアドレス** 入力
4. **「パスワードリセットメールを送信」** ボタンクリック

**✅ 期待結果**:
- [ ] `/auth/forgot-password` へ遷移
- [ ] 「パスワードリセットメールを送信しました」メッセージ表示
- [ ] ボタンが無効化される

### C-2. リセットメール確認・パスワード変更
1. テスト用メールボックス確認
2. **Subject**: 「【AIO Hub】パスワードリセットのご案内」
3. メール内リンククリック
4. 新しいパスワード入力：`NewPass789!`
5. パスワード確認入力：同じパスワード
6. **「パスワードを更新」** ボタンクリック

**✅ 期待結果**:
- [ ] メール受信確認（5分以内）
- [ ] `/auth/reset-password-confirm` へ遷移
- [ ] 「パスワードが正常に更新されました」メッセージ
- [ ] 2秒後に `/auth/login` へリダイレクト

### C-3. 新しいパスワードでログイン
1. 新しいパスワード（`NewPass789!`）でログイン

**✅ 期待結果**:
- [ ] ログイン成功
- [ ] `/dashboard` へリダイレクト
- [ ] セッション正常保持

## ✅ Test Case D: エラーハンドリング

### D-1. 無効なメールアドレス
1. サインアップで `invalid-email` 入力

**✅ 期待結果**:
- [ ] 「メールアドレスの形式が正しくありません」エラー

### D-2. パスワード不一致
1. サインアップでパスワード・確認パスワードを異なる値で入力

**✅ 期待結果**:
- [ ] 「パスワードが一致しません」エラー

### D-3. 弱いパスワード
1. サインアップで `123` 等の弱いパスワード入力

**✅ 期待結果**:
- [ ] 「パスワードは6文字以上で入力してください」エラー

## 🔍 補助通知テスト（Resend設定時のみ）

**注意**: RESEND_API_KEY が設定されている場合のみ実行

### 補助メール確認
Test Case A 実行後、メールボックス確認：

**✅ 期待結果**:
- [ ] Supabase認証メール受信（必須）
- [ ] Resend補助メール受信（オプション）：「🚀 【AIO Hub】ご登録ありがとうございます」

**重要**: 補助メール未受信でもテスト成功（Supabaseメール受信が重要）

## 📊 テスト完了条件

### 全テストケース成功基準
- [ ] **Test Case A, B, C すべて完了**
- [ ] **3パターンでダッシュボード到達**
- [ ] **データベースにプロフィール自動作成**
- [ ] **`/api/auth/sync` 非依存で動作**
- [ ] **日本語エラーメッセージ適切表示**
- [ ] **セッション安定保持確認**

### パフォーマンス基準
- [ ] 各ページ読み込み < 3秒
- [ ] 認証フロー完了 < 30秒（メール確認含む）
- [ ] ダッシュボードリダイレクト < 2秒

## 🚨 失敗時の対応

### 即座に開発チームに報告すべきエラー
- ❌ `/api/auth/sync` リクエスト発生
- ❌ 「Auth session missing」エラー表示
- ❌ リダイレクトループ発生
- ❌ セッション切れ頻発
- ❌ データベースにプロフィール未作成
- ❌ メール完全未受信（24時間経過後）

### デバッグ情報収集
失敗時は以下を記録：

**ブラウザ情報**:
```javascript
// Console で実行
console.log({
  userAgent: navigator.userAgent,
  url: location.href,
  localStorage: localStorage.getItem('supabase.auth.token'),
  sessionStorage: sessionStorage.getItem('supabase.auth.token')
});
```

**Network情報**:
- 失敗したリクエストのURL
- レスポンスステータスコード
- エラーメッセージ

**Database確認**:
```sql
-- 最新のユーザー作成状況確認
SELECT u.id, u.email, u.created_at as auth_created,
       au.id as app_user_id, au.role, au.created_at as profile_created
FROM auth.users u
LEFT JOIN app_users au ON u.id = au.id
ORDER BY u.created_at DESC
LIMIT 10;
```

---

**✅ このE2Eテストをすべて通過することで、商用レベルの認証システムが完成します**