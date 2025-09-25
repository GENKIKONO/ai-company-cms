# デプロイ手順書（商用レベル統合版）

## 概要
商用認証システムの安全なデプロイ手順書

## 📋 デプロイ前チェックリスト

### コード品質確認
- [ ] `npm run build` エラーなし
- [ ] ESLint警告: imgタグ警告のみ許容、その他は解決済み
- [ ] TypeScript エラーなし
- [ ] 認証フローテスト完了（3パターン）

### 環境設定確認  
- [ ] 本番環境変数設定完了
- [ ] Supabaseトリガー・RLS設定完了
- [ ] ドメイン設定確認（https://aiohub.jp）

## 🚀 Vercel デプロイ手順

### Step 1: 環境変数設定

#### Production Environment
Vercel Dashboard → Settings → Environment Variables

```bash
# 必須設定
NEXT_PUBLIC_APP_URL=https://aiohub.jp
NEXT_PUBLIC_SUPABASE_URL=https://chyicolujwhkycpkxbej.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Supabase Dashboard → API → anon key]
SUPABASE_SERVICE_ROLE_KEY=[Supabase Dashboard → API → service_role key]

# オプション設定
RESEND_API_KEY=[Resend API Key]
RESEND_FROM_EMAIL=AIO Hub <noreply@aiohub.jp>
```

#### Preview Environment  
**重要**: プレビューでも本番ドメインを使用
```bash
NEXT_PUBLIC_APP_URL=https://aiohub.jp  # ← プレビューでもこの設定
```

### Step 2: ビルドキャッシュOFFデプロイ

#### 理由
- 認証システムの重要な変更を確実に反映
- 環境変数変更の確実な適用
- キャッシュ由来の不整合回避

#### 実行方法

**Method A: Vercel CLI**
```bash
# クリーンデプロイ（推奨）
vercel --prod --force
```

**Method B: Vercel Dashboard**  
1. Deployments タブ → 最新Deploy → ⋯メニュー
2. **Redeploy** → ☑️ **Use existing Build Cache** をOFF
3. **Redeploy** 実行

### Step 3: デプロイ後検証

#### 基本動作確認
- [ ] https://aiohub.jp アクセス可能
- [ ] `/auth/login` ページ表示
- [ ] `/auth/signup` ページ表示
- [ ] `/dashboard` リダイレクト動作（認証後）

#### 認証フロー確認
**Test Case 1: 新規登録**
- [ ] サインアップ → 確認メール受信 → 認証完了 → ダッシュボード

**Test Case 2: ログイン**  
- [ ] ログイン → ダッシュボード → リロード後も保持

**Test Case 3: パスワードリセット**
- [ ] パスワードリセット → メール受信 → パスワード変更 → ログイン

#### API動作確認
```bash
# Health Check
curl https://aiohub.jp/api/auth/sync
# 期待レスポンス: {"service":"auth-sync","status":"available",...}

# 認証APIテスト（ブラウザ開発ツールから）
fetch('/api/auth/resend-confirmation', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: 'test@example.com', type: 'signup'})
})
```

#### データベース検証
Supabase Dashboard → SQL Editor
```sql  
-- トリガー動作確認
SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- 期待結果: 1

-- RLSポリシー確認  
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'app_users';
-- 期待結果: 3

-- 新規ユーザーでテスト実行後
SELECT id, email, role, created_at 
FROM app_users 
ORDER BY created_at DESC 
LIMIT 5;
```

## 🔄 ロールバック手順

### 緊急時のロールバック

#### Method A: 前バージョンに復元
1. Vercel Dashboard → Deployments
2. 安定版の Deployment → **Promote to Production**

#### Method B: 機能無効化
```bash
# 緊急時環境変数で機能を無効化
RESEND_API_KEY=""  # 補助通知を無効化
# または
MAINTENANCE_MODE=true  # メンテナンスページ表示
```

## 📊 パフォーマンス監視

### 監視項目
- [ ] LCP < 2.5s (Core Web Vitals)
- [ ] 認証API応答時間 < 1s
- [ ] エラー率 < 1%
- [ ] セッション保持率 > 95%

### 監視ツール
- Vercel Analytics: 自動有効
- Sentry: エラー監視（オプション設定）
- Supabase Dashboard: データベース監視

## 🚨 トラブルシューティング

### よくある問題

#### 1. "NEXT_PUBLIC_APP_URL must be configured"
**原因**: 環境変数未設定
**解決**: Vercel環境変数でNEXT_PUBLIC_APP_URL設定

#### 2. 認証メールのリンクが404
**原因**: SupabaseのRedirect URL設定
**解決**: Supabase → Authentication → URL Configuration確認

#### 3. プロフィール作成されない  
**原因**: DBトリガー未設定
**解決**: `supabase/sql/auth-trigger-setup.sql` 再実行

#### 4. セッション切れが頻発
**原因**: Cookie設定問題
**解決**: サーバー・クライアント設定確認

### デバッグ方法

#### ブラウザ開発ツール
```javascript
// セッション状態確認
console.log(localStorage.getItem('supabase.auth.token'))

// API動作確認  
fetch('/api/auth/sync', {method: 'POST'})
  .then(r => r.json())
  .then(console.log)
```

#### サーバーログ確認
Vercel Dashboard → Functions → View Function Logs

## 📞 緊急連絡先

### デプロイ責任者
- 技術責任者: [名前・連絡先]
- Vercel管理者: [名前・連絡先]
- Supabase管理者: [名前・連絡先]

### エスカレーション手順
1. **Level 1**: 開発チーム → 1時間以内対応
2. **Level 2**: 技術責任者 → 30分以内対応  
3. **Level 3**: 経営陣 → 緊急事態対応

---

**✅ このデプロイ手順で商用レベルの認証システムが安全にリリースされます**