# 📧 Email Authentication Troubleshooting Guide

**更新日**: 2025-09-22  
**対象**: 認証メール配信問題のトラブルシューティング

## 🔍 クイック診断

まず診断スクリプトを実行してください：

```bash
npm run diag:email
```

このスクリプトが自動的に主要な設定をチェックし、問題箇所を特定します。

## 🚨 よくある問題と対処法

### 1. Site URL の設定ミス
**症状**: 確認メールが届かない、または無効なリンクエラー

| 問題 | 原因 | 対処法 |
|------|------|--------|
| Site URL が間違っている | `NEXT_PUBLIC_APP_URL` が `https://aiohub.jp` でない | Vercel環境変数で `NEXT_PUBLIC_APP_URL=https://aiohub.jp` に設定 |
| Supabase Auth Site URL が間違っている | Supabase Auth設定で Site URL が異なる | Supabase Dashboard > Auth > Settings で `https://aiohub.jp` に設定 |

### 2. Redirect URL の設定ミス
**症状**: メールリンクをクリックしても認証ページに移動しない

| 問題 | 原因 | 対処法 |
|------|------|--------|
| Redirect URL が設定されていない | Email Template の Redirect URL が空白 | Supabase Dashboard > Auth > Email Templates > Confirm Email で `{{ .SiteURL }}/auth/confirm` に設定 |
| Redirect URL が間違っている | 異なるパスに設定されている | `/auth/confirm` パスが正しく設定されているか確認 |

### 3. SPF/DKIM 認証エラー
**症状**: メールが迷惑メールに分類される、または配信されない

| 問題 | 原因 | 対処法 |
|------|------|--------|
| SPF レコード未設定 | DNS に SPF レコードがない | Resend Dashboard の指示に従い DNS に `TXT` レコード追加 |
| DKIM 認証未完了 | DKIM 設定が未完了 | Resend Dashboard > Domains で DKIM 設定を完了 |
| ドメイン未認証 | aiohub.jp がResendで未認証 | Resend Dashboard でドメイン認証プロセスを完了 |

### 4. Resend 設定エラー
**症状**: アプリからのメール送信ができない

| 問題 | 原因 | 対処法 |
|------|------|--------|
| API キーが無効 | `RESEND_API_KEY` が設定されていない/無効 | Resend Dashboard で新しい API キーを作成し環境変数に設定 |
| From Email が間違っている | `RESEND_FROM_EMAIL` が `noreply@aiohub.jp` でない | 環境変数を `noreply@aiohub.jp` に修正 |
| ドメイン制限 | 認証されていないドメインから送信しようとしている | Resend で aiohub.jp ドメインを認証 |

### 5. Custom SMTP 設定エラー（使用している場合）
**症状**: SMTP 経由でメールが送信されない

| 問題 | 原因 | 対処法 |
|------|------|--------|
| SMTP ホストが間違っている | `SMTP_HOST` が `smtp.resend.com` でない | 環境変数を `smtp.resend.com` に設定 |
| ポートが間違っている | `SMTP_PORT` が `587` または `465` でない | 推奨: `587` (STARTTLS) |
| 認証情報が間違っている | `SMTP_USER` または `SMTP_PASS` が間違っている | User: `resend`, Pass: Resend API キー |

## 🔧 設定チェックリスト

### A. 環境変数の確認
```bash
# 必須環境変数
NEXT_PUBLIC_APP_URL=https://aiohub.jp
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@aiohub.jp
```

### B. Supabase Auth 設定
1. **Site URL**: `https://aiohub.jp`
2. **Redirect URLs**: `https://aiohub.jp/**` (ワイルドカード)
3. **Email Template (Confirm Email)**:
   ```
   Subject: Confirm your email
   Body: Click here to confirm: {{ .ConfirmationURL }}
   Redirect URL: {{ .SiteURL }}/auth/confirm
   ```

### C. Resend ドメイン設定
1. **ドメイン追加**: `aiohub.jp`
2. **DNS 設定**:
   - SPF: `TXT` レコード
   - DKIM: `CNAME` レコード （Resend提供の値）
3. **認証ステータス**: ✅ Verified

### D. ファイル存在確認
- [ ] `src/app/auth/confirm/page.tsx` が存在する
- [ ] `src/lib/emails.ts` が正しく設定されている

## 📋 段階的なトラブルシューティング

### ステップ 1: 基本設定確認
```bash
npm run diag:email
```

### ステップ 2: 手動での Supabase 設定確認
1. Supabase Dashboard にアクセス
2. Auth > Settings で Site URL を確認
3. Auth > Email Templates で Redirect URL を確認

### ステップ 3: DNS 設定確認
```bash
# SPF レコード確認
dig TXT aiohub.jp | grep spf

# DKIM レコード確認（Resend提供のセレクターを使用）
dig CNAME [selector]._domainkey.aiohub.jp
```

### ステップ 4: テスト送信
1. Resend Dashboard > Logs でリアルタイムログを監視
2. アプリからサインアップを実行
3. ログでメール送信状況を確認

### ステップ 5: メール受信確認
1. 通常のメールボックスを確認
2. **迷惑メールフォルダを確認**
3. メール配信まで **60秒** 待機

## 🚨 緊急時の対処

### メール認証をスキップする（開発時のみ）
```sql
-- Supabase SQL Editor で実行（本番では使用しない）
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'test@example.com';
```

### 手動でのメール再送信
```bash
# Supabase CLI を使用
supabase auth resend --type signup --email user@example.com
```

## 📊 ログの確認方法

### Vercel ログ
```bash
vercel logs https://aiohub.jp
```

### Supabase ログ
1. Supabase Dashboard > Logs
2. Auth logs を確認
3. エラーメッセージを検索

### Resend ログ
1. Resend Dashboard > Logs
2. 送信状況とエラーを確認
3. 配信ステータスを監視

## 🔄 設定変更手順

### Supabase Auth 設定変更
1. Supabase Dashboard > Auth > Settings
2. 変更したい項目を編集
3. **Save** をクリック
4. 変更が反映されるまで **2-3分** 待機

### Vercel 環境変数変更
1. Vercel Dashboard > Settings > Environment Variables
2. 変更したい変数を編集
3. **Save** をクリック
4. **Redeploy** を実行（変更を反映するため）

## 📞 サポート情報

### 問題が解決しない場合
1. `npm run diag:email` の出力結果を保存
2. 問題の詳細（症状、発生タイミング）を記録
3. 以下の情報を収集：
   - Vercel deployment URL
   - Supabase project ID
   - Resend domain status
   - エラーメッセージ（あれば）

### よくある質問

**Q: メールが届くまでどのくらい時間がかかりますか？**
A: 通常 **10-30秒** 以内に配信されます。60秒以上届かない場合は設定に問題がある可能性があります。

**Q: 迷惑メールに分類されるのはなぜですか？**
A: SPF/DKIM設定が未完了、または送信元ドメインの評価が低い可能性があります。

**Q: Custom SMTP は必要ですか？**
A: 必須ではありません。Supabase標準の送信でも十分機能します。Resend SMTP は配信制御をより細かく行いたい場合に使用します。

---

**最終更新**: 2025-09-22  
**関連文書**: 
- [認証メール送信ポリシー ADR](../architecture/decisions/ADR-auth-email-sending.md)
- [診断スクリプト](../../scripts/ops/diagnose-email.mjs)