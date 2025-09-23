# 🔧 認証ログイン失敗トラブルシューティングガイド

**最終更新:** 2025-09-23  
**対象:** AIO Hub 認証システム  
**症状:** サインアップは成功するがログインが失敗する問題

---

## 🎯 問題の概要

### 主な症状
1. **UI表示:** "Invalid login credentials" または "メールアドレスが確認されていません"
2. **コンソールエラー:** Supabase `/token?grant_type=password` エンドポイントで 400 エラー
3. **動作パターン:** サインアップは正常だが、その後のログインが失敗する

### 影響範囲
- 新規ユーザーのオンボーディング
- 既存ユーザーのログイン体験
- メール確認フロー

---

## 🔍 診断ツール

### 1. 認証ステータス診断
```bash
# 特定ユーザーの認証状態を確認
npm run debug:auth -- --email user@example.com

# 本番環境での確認
npm run debug:auth -- --email user@example.com --url https://aiohub.jp
```

**期待される出力例:**
```
🔍 認証ステータス診断結果
================================================================================
📧 メール: user@example.com
🏷️ リクエストID: abc123...
📊 総合ステータス: 未確認

詳細情報:
--------------------------------------------------
ユーザー存在: ✓
メール確認: ✗ 未確認
アカウント状態: 正常

💡 推奨アクション:
   • メール確認が未完了です。確認メールの再送信を検討してください。
```

### 2. システム設定検証
```bash
# 環境設定確認
curl https://aiohub.jp/api/ops/env-check

# 設定総合チェック
curl https://aiohub.jp/api/ops/config-check
```

### 3. 回帰テスト実行
```bash
# 全認証フロー動作確認
npm run test:auth-regression

# 本番環境テスト
npm run test:auth-regression -- --url https://aiohub.jp --verbose
```

---

## 🛠️ 問題解決手順

### Step 1: ユーザー状態確認

#### 1.1 メール確認状態をチェック
```bash
npm run debug:auth -- --email <問題のメールアドレス>
```

**確認ポイント:**
- `ユーザー存在: ✓` が表示されるか
- `メール確認: ✓ 確認済み` または `✗ 未確認` の状態
- `アカウント状態: 正常` または BAN状態

#### 1.2 Supabase管理画面での確認
1. [Supabase Dashboard](https://app.supabase.com) にアクセス
2. プロジェクト選択 → Authentication → Users
3. 該当ユーザーを検索
4. `email_confirmed_at` フィールドの値を確認

### Step 2: メール確認問題の解決

#### 2.1 確認メール再送信（ユーザー操作）
1. ログインページでメールアドレス・パスワード入力
2. エラーメッセージ表示時の「確認メールを再送信」ボタンをクリック
3. メール受信確認

#### 2.2 管理者による手動確認（緊急時）
```bash
# Supabase管理者権限でユーザー確認状態を更新
# 注意: これは緊急時のみ使用
```

### Step 3: システム設定確認

#### 3.1 環境変数チェック
```bash
# 必須環境変数の確認
echo $NEXT_PUBLIC_APP_URL           # https://aiohub.jp
echo $NEXT_PUBLIC_SUPABASE_URL      # Supabase URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase Anon Key
echo $SUPABASE_SERVICE_ROLE_KEY     # Service Role Key
echo $APPROVAL_JWT_SECRET           # JWT Secret
```

#### 3.2 Supabase設定確認
1. **Site URL設定**
   - Dashboard → Settings → Auth → Site URL
   - `https://aiohub.jp` が設定されていること

2. **Redirect URL設定**
   - Dashboard → Settings → Auth → Redirect URLs
   - `https://aiohub.jp/*` が含まれていること
   - `https://aiohub.jp/auth/confirm` が含まれていること

3. **Email Templates**
   - Dashboard → Settings → Auth → Email Templates
   - Confirm signup: `{{ .ConfirmationURL }}` が設定されていること

### Step 4: データベース・RLS確認

#### 4.1 app_users テーブルRLSポリシー
```sql
-- Supabase SQL エディタで実行
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'app_users';
```

**期待されるポリシー:**
- INSERT権限: 認証済みユーザーが自分のレコードを作成可能
- SELECT権限: ユーザーが自分のレコードを参照可能

#### 4.2 プロフィール同期API動作確認
```bash
# 認証後のプロフィール同期テスト
curl -X POST https://aiohub.jp/api/auth/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"
```

---

## 🚨 緊急対応手順

### 即座の対応が必要な場合

#### 1. ユーザーへの一時的案内
```
お客様のアカウントでログインに問題が発生しています。
以下の手順をお試しください：

1. 確認メールが届いているかメールボックスを確認
2. 迷惑メールフォルダもご確認ください
3. 確認メールが見つからない場合、ログインページで「確認メールを再送信」をクリック
4. それでも解決しない場合、サポートまでお問い合わせください
```

#### 2. 管理者による状態確認・修正
```bash
# 1. ユーザー状態診断
npm run debug:auth -- --email <問題のメール>

# 2. システム全体の健全性確認
npm run test:auth-regression
```

---

## 🔄 根本原因別の対処法

### Case 1: メール確認未完了
**症状:** `is_confirmed: false` が返される
**原因:** ユーザーが確認メールのリンクをクリックしていない

**対処法:**
1. 確認メール再送信機能を利用
2. メールデリバリー状況を確認
3. 必要に応じてメールプロバイダー設定を見直し

### Case 2: RLSポリシー問題
**症状:** プロフィール同期で 403/401 エラー
**原因:** Row Level Security ポリシーが正しく設定されていない

**対処法:**
1. app_users テーブルのRLSポリシーを確認
2. 必要に応じてポリシーを修正・追加
3. データベース権限を確認

### Case 3: 環境設定ミス
**症状:** localhost URLでリダイレクト、メール配信失敗
**原因:** NEXT_PUBLIC_APP_URL が localhost に設定されている

**対処法:**
1. 環境変数を `https://aiohub.jp` に修正
2. Supabase Dashboard の Site URL を更新
3. アプリケーションを再デプロイ

### Case 4: Supabase接続問題
**症状:** API呼び出しでタイムアウト・接続エラー
**原因:** Supabase認証情報の問題

**対処法:**
1. Supabase API キーを確認
2. プロジェクトURL・設定を確認
3. Supabase サービス状況を確認

---

## 📊 監視・予防策

### 1. 定期的な健全性チェック
```bash
# 毎日実行推奨
npm run test:auth-regression --url https://aiohub.jp

# 週次実行推奨
npm run debug:auth -- --email test-user@yourcompany.com
```

### 2. アラート設定
- 認証失敗率が閾値を超えた場合
- メール配信失敗率が閾値を超えた場合
- API レスポンス時間が異常に長い場合

### 3. ログ監視
```bash
# Vercel Functions ログ確認
vercel logs --app=your-app-name

# Supabase ログ確認
# Dashboard → Settings → Logs
```

---

## 📚 関連リソース

### ドキュメント
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

### コード参照
- `src/app/api/admin/auth/status/route.ts` - 管理者認証診断API
- `src/app/api/auth/sync/route.ts` - プロフィール同期API
- `src/app/auth/login/page.tsx` - ログインページ実装
- `scripts/ops/auth-debug.mjs` - 診断CLIツール

### サポート連絡先
- 開発チーム: dev@yourcompany.com
- システム管理者: admin@yourcompany.com
- 緊急時連絡先: emergency@yourcompany.com

---

## 📝 記録テンプレート

### 問題発生時の記録
```
日時: 2025-XX-XX XX:XX:XX
報告者: [名前]
ユーザーメール: [メールアドレス]
症状: [具体的な症状]
診断結果: [診断ツール実行結果]
実施した対処: [行った対処法]
結果: [解決/継続中/エスカレーション]
備考: [その他気づいた点]
```

### 解決後のフォローアップ
- [ ] ユーザーへの解決報告
- [ ] 根本原因の文書化
- [ ] 予防策の実装確認
- [ ] 類似問題の発生監視

---

**🎯 このガイドを使用して、認証ログイン失敗問題を体系的に診断・解決し、ユーザー体験の向上を図ってください。**