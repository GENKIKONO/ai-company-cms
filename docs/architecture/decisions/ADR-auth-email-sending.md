# ADR: Authentication Email Sending Strategy

**Status**: Accepted  
**Date**: 2025-09-22  
**Decision Makers**: Development Team  
**Technical Story**: [Email Authentication Fix](https://github.com/luxucare/aiohub/issues/email-auth-fix)

## Context

LuxuCare AI企業CMSでは、ユーザー認証時の確認メール配信において配信エラーが発生していました。システムではSupabase AuthとResendの両方を統合しており、メール送信経路の選択が必要でした。

### 現在の技術スタック
- **認証**: Supabase Auth (signup/login/password reset)
- **メール配信**: Resend (API Key: `RESEND_API_KEY`, From: `noreply@aiohub.jp`)
- **ドメイン**: aiohub.jp (SPF/DKIM設定済み)
- **環境**: Vercel Production + Staging

### 問題の背景
1. サインアップ時の確認メールが配信されない
2. Supabase AuthのデフォルトSMTP設定とResend設定の競合
3. SPF/DKIM認証エラーによる迷惑メール分類
4. Site URLとRedirect URLの設定不整合

## Decision

**Supabase Auth標準のメール配信を認証メールに使用し、Resendは通知メール専用とする**

### 認証メール (Supabase Auth)
- サインアップ確認メール
- パスワードリセットメール
- メールアドレス変更確認メール

### 通知メール (Resend)
- 承認依頼通知
- システム通知
- 課金関連通知
- 運用アラート

## Rationale

### 選択肢の比較

| 選択肢 | メリット | デメリット | 採用 |
|--------|----------|------------|------|
| **A. Supabase Auth標準** | ・Authと完全統合<br>・設定がシンプル<br>・認証フローが安定 | ・配信制御が限定的<br>・テンプレート制御が少ない | ✅ |
| B. ResendのCustom SMTP | ・配信制御が詳細<br>・統一されたログ | ・Auth設定が複雑<br>・認証エラーリスク高 | ❌ |
| C. Webhook + Resend | ・完全制御可能<br>・リッチテンプレート | ・実装コストが高<br>・遅延リスク | ❌ |

### 採用理由
1. **安定性優先**: 認証メールは失敗が許されないため、Supabase標準の実績ある配信を使用
2. **設定の簡素化**: 複雑なSMTP設定を避け、Supabase Dashboard設定のみで完結
3. **責任分離**: 認証=Supabase、通知=Resend で明確に役割分離
4. **トラブルシューティング効率**: 問題発生時の切り分けが容易

## Implementation

### 1. Supabase Auth設定

#### Site URL設定
```
Auth > Settings > Site URL: https://aiohub.jp
```

#### Redirect URLs設定
```
Auth > Settings > Redirect URLs:
- https://aiohub.jp/**  (ワイルドカード)
```

#### Email Template設定
```
Auth > Email Templates > Confirm Email:
Subject: LuxuCare AI企業CMS - メールアドレスを確認してください
Body: 以下のリンクをクリックしてメールアドレスを確認してください: {{ .ConfirmationURL }}
Redirect URL: {{ .SiteURL }}/auth/confirm
```

### 2. 環境変数設定

#### 必須設定（Vercel）
```bash
# Supabase Auth用
NEXT_PUBLIC_APP_URL=https://aiohub.jp
NEXT_PUBLIC_SUPABASE_URL=https://mfumcxxzxuwbtjhhzqdy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Resend用（通知メール専用）
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@aiohub.jp
```

#### カスタムSMTP設定（使用しない）
```bash
# これらの設定は削除または空にする
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

### 3. 確認ページ実装

認証後のリダイレクト先ページ:
```typescript
// src/app/auth/confirm/page.tsx
// 既存実装を維持（動作確認済み）
```

### 4. 診断・監視

#### 診断スクリプト
```bash
npm run diag:email
```

#### 監視項目
- Supabase Auth > Logs での認証メール送信状況
- Resend Dashboard > Logs での通知メール送信状況
- 配信失敗時のSlack通知

## Consequences

### Positive
- ✅ 認証メール配信の安定化
- ✅ 設定の簡素化とメンテナンス性向上
- ✅ トラブルシューティングの効率化
- ✅ Supabase Authの機能を最大限活用

### Negative
- ❌ 認証メールのテンプレート制御が限定的
- ❌ 配信タイミングの詳細制御不可
- ❌ 複数メール配信サービスの管理が必要

### Mitigation
- テンプレート制御の制限: Supabase Dashboard内でのカスタマイズで対応
- 配信タイミング制御: 必要に応じて将来的にWebhook実装を検討
- 管理コスト: 診断スクリプトと監視ダッシュボードで効率化

## Monitoring & Rollback

### 監視指標
- 認証メール配信成功率 > 98%
- 確認メールクリック率の維持
- 迷惑メール分類率 < 2%

### ロールバック手順
1. Supabase Auth設定をカスタムSMTPに変更
2. SMTP環境変数を再設定
3. 診断スクリプトで設定確認
4. テスト送信で動作確認

### 成功基準
- [ ] サインアップ後60秒以内にメール配信
- [ ] 確認メールリンクの正常動作
- [ ] 迷惑メールフォルダへの分類なし
- [ ] 診断スクリプトでのPASS判定

## References

- [Email Authentication Troubleshooting Guide](../ops/email-troubleshooting.md)
- [Email Diagnostics Script](../../scripts/ops/diagnose-email.mjs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Resend Documentation](https://resend.com/docs)

---

**Next Review**: 2025-12-22 (3ヶ月後)  
**Related ADRs**: None  
**Supersedes**: None