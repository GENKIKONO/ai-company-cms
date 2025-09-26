# 🚀 本番デプロイ実行手順書（完全版）

## 🎯 実行の流れ（5ステップ完走）

**① Supabase設定** → **② SQL実行** → **③ Vercel環境変数** → **④ クリーンデプロイ** → **⑤ 検証・E2E**

**⏱️ 想定時間**: 1-2時間（初回）、30分（慣れた場合）  
**🔑 必要権限**: Supabase管理者 + Vercel管理者  
**🎯 完了条件**: 全5ステップ完了 + `npm run verify:prod-ready` がPASS

---

---

## ① Supabase設定 ⏱️ 15分

**🔗 アクセス**: https://supabase.com/dashboard/project/chyicolujwhkycpkxbej

### 1-A. Authentication URL設定 **（最重要）**
```
画面: Authentication → URL Configuration

Site URL: https://aiohub.jp
Redirect URLs: https://aiohub.jp/*  
Default redirect URL: https://aiohub.jp
```

**✅ 確認ポイント**: 
- localhostが含まれていない
- 末尾スラッシュなし
- 保存後に緑色成功メッセージ

### 1-B. Email Templates設定
```
画面: Authentication → Email Templates

▶ Confirm signup:
  Subject: 【AIO Hub】メールアドレスの確認をお願いします
  Message: {{ .ConfirmationURL }} を含む日本語HTML

▶ Reset password:
  Subject: 【AIO Hub】パスワードリセットのご案内
  Message: {{ .ConfirmationURL }} を含む日本語HTML
```

**⚙️ 詳細テンプレート**: `docs/ops/checklist-auth-supabase.md` 参照

### 1-C. APIキー取得
```
画面: Settings → API

メモする項目:
▶ Project URL: https://chyicolujwhkycpkxbej.supabase.co
▶ anon public key: eyJ... (コピーアイコンクリック)
▶ service_role key: eyJ... (コピーアイコンクリック)
```

---
**✅ ステップ1 完了確認**
- [ ] URL設定: https://aiohub.jp 統一
- [ ] テンプレート: 日本語2件
- [ ] APIキー: 2件取得
---

## ② SQL実行 ⏱️ 10分

**🔗 アクセス**: Supabase Dashboard → SQL Editor → New query

### 2-A. メインSQL実行 **（冪等性あり）**
```
ファイル: supabase/sql/auth-trigger-setup.sql

手順:
① ローカルファイルを開く
② 全内容コピー (Ctrl+A)
③ SQL Editor にペースト
④ RUN ボタン (Ctrl+Enter)
```

**✅ 成功確認**: 「商用レベルDBトリガー設定完了」メッセージ

### 2.2 検証クエリ実行
新しいクエリタブで以下を順番に実行:

**トリガー確認**
```sql
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```
期待結果: 1件取得、tgenabled = 'O'

**RLSポリシー確認**
```sql
SELECT policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'app_users'
ORDER BY policyname;
```
期待結果: 3件のポリシー取得

**テーブル構造確認**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='app_users'
ORDER BY ordinal_position;
```
期待結果: id, email, role, partner_id, created_at, updated_at の6列

**✅ ステップ2完了確認**
- [ ] メインSQL実行でエラーなし
- [ ] トリガーが1件存在
- [ ] RLSポリシーが3件存在
- [ ] app_usersテーブルが正しい構造

---

## ステップ3: Vercel環境変数設定

### 🕐 所要時間: 10分

**アクセス**: https://vercel.com/dashboard → プロジェクト選択 → Settings → Environment Variables

### 3.1 Production環境設定
以下の環境変数を設定:

```bash
# Required - App Configuration
NEXT_PUBLIC_APP_URL=https://aiohub.jp

# Required - Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://chyicolujwhkycpkxbej.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ステップ1.3でコピーしたanon key]
SUPABASE_SERVICE_ROLE_KEY=[ステップ1.3でコピーしたservice_role key]

# Optional - Resend Configuration (補助通知)
RESEND_API_KEY=[Resend APIキー - 未設定でもOK]
RESEND_FROM_EMAIL=noreply@aiohub.jp
```

### 3.2 Preview環境設定
**重要**: PreviewでもProductionと同じ値を設定（本番ドメイン使用）

上記と全く同じ環境変数をPreview環境にも設定

**✅ ステップ3完了確認**
- [ ] Production環境に5つの環境変数設定完了
- [ ] Preview環境にも同じ値で設定完了
- [ ] 全てのURLがhttps://aiohub.jpに統一されている

---

## ステップ4: クリーンデプロイ実行

### 🕐 所要時間: 5-10分

### 4.1 デプロイ実行
1. Vercel Dashboard → プロジェクト → Deployments タブ
2. 最新デプロイメントの「・・・」メニュー → 「Redeploy」
3. **重要**: 「Use existing Build Cache」のチェックをOFF
4. 「Redeploy」をクリック

### 4.2 デプロイ確認
1. デプロイ完了まで待機（通常3-5分）
2. 緑色「Ready」ステータス確認
3. デプロイログでビルドエラーがないことを確認

**✅ ステップ4完了確認**
- [ ] クリーンデプロイ（キャッシュなし）完了
- [ ] https://aiohub.jp にアクセス可能
- [ ] ビルドエラー・ランタイムエラーなし

---

## ステップ5: E2Eテスト実行

### 🕐 所要時間: 20-30分

### 5.1 検証スクリプト実行（ローカル）
プロジェクトルートで以下を実行:
```bash
npm run verify:prod-ready
```

期待結果: 全チェック項目でPASSが表示される

### 5.2 本番E2Eテスト
詳細手順: `docs/e2e/auth-three-scenarios.md` 参照

**Test Case A: 新規ユーザー登録**
1. https://aiohub.jp/auth/signup にアクセス
2. テストメールアドレスで登録
3. 確認メール受信→リンククリック
4. ダッシュボード表示確認

**Test Case B: 既存ユーザーエラー処理**
1. 同じメールアドレスで再登録試行
2. 「既に登録済みです」エラー表示確認
3. ログインページへの導線確認

**Test Case C: パスワードリセット**
1. https://aiohub.jp/auth/forgot-password
2. 登録済みメールアドレスでリセット要求
3. リセットメール受信→新パスワード設定
4. 新パスワードでログイン確認

### 5.3 データベース確認
Supabase SQL Editorで確認:
```sql
-- プロフィール自動作成確認
SELECT au.id, au.email, au.role, au.created_at
FROM auth.users u
JOIN app_users au ON u.id = au.id
ORDER BY au.created_at DESC
LIMIT 5;
```

期待結果: テストユーザーのプロフィールが自動作成されている

**✅ ステップ5完了確認**
- [ ] 検証スクリプト全項目PASS
- [ ] Test Case A, B, C 全て成功
- [ ] プロフィール自動作成確認済み

---

## 🎉 完了判定

以下の全項目が完了していれば、**商用レベル認証システムの本番稼働準備完了**です:

### 最終チェックリスト
- [ ] **ステップ1**: Supabase設定（URL・テンプレート・APIキー）
- [ ] **ステップ2**: SQL実行（トリガー・RLS・検証）
- [ ] **ステップ3**: Vercel環境変数（Production・Preview）
- [ ] **ステップ4**: クリーンデプロイ（キャッシュOFF）
- [ ] **ステップ5**: E2Eテスト（3パターン成功）

### システム性能確認
- [ ] ページ読み込み時間 < 3秒
- [ ] 認証フロー完了時間 < 30秒
- [ ] コンソールエラーなし
- [ ] セッション持続性確認（リロード後も認証状態保持）

---

## 🚨 トラブル時の対処

### よくある問題
1. **認証エラー**: ステップ1のURL設定を再確認
2. **プロフィール未作成**: ステップ2のSQL実行を再実行
3. **ビルドエラー**: ステップ3の環境変数を再確認
4. **E2E失敗**: ステップ4でキャッシュOFFでの再デプロイ

### 緊急確認コマンド
```bash
# 環境変数確認
npm run verify:env

# Supabase接続確認  
npm run verify:supabase

# 統合確認
npm run verify:prod-ready
```

### サポート情報
- **詳細手順**: `docs/ops/checklist-auth-supabase.md`
- **E2E詳細**: `docs/e2e/auth-three-scenarios.md`
- **検証詳細**: `docs/verification/post-deploy-smoke.md`

---

**🎯 この手順書の完全実行により、商用レベル認証システムが本番稼働可能になります** ✅