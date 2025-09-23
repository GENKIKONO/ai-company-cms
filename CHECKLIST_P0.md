# ✅ P0 Release Checklist - 最小スコープ安定版

**更新日**: 2024-09-23  
**ターゲット**: https://aiohub.jp  
**リリース**: P0 (最小スコープ安定版)

## 🎯 P0 要件定義

### スコープ制限
- ✅ **認証システムのみ**: ユーザー登録・ログイン・メール確認
- ✅ **Supabase標準**: Resend削除、Supabase内蔵メール配信のみ
- ✅ **URL統一**: すべて https://aiohub.jp に統一
- ✅ **最小DB**: app_users テーブルのみ

### 除外機能
- ❌ パートナー管理システム
- ❌ 承認ワークフロー
- ❌ 検索・フィルター機能
- ❌ Resendメール配信
- ❌ 追加のSlack/Sentry連携

## 📋 実装チェックリスト

### A. コード変更
- [🟢] signup/page.tsx: Resendバックアップ削除
- [🟢] resend-confirmation/route.ts: Supabase専用に簡素化
- [🟢] .env.local.example: 本番URL設定
- [🟢] supabase/migrations: app_users テーブル作成

### B. 設定統一
- [🟢] NEXT_PUBLIC_APP_URL: https://aiohub.jp
- [🟢] Supabase Auth Site URL: https://aiohub.jp
- [🟢] Email Template Redirect: https://aiohub.jp/auth/confirm

### C. 動作検証
- [🔄] **スモークテスト A**: ユーザー登録 (signup → email確認 → アクティベート)
- [🔄] **スモークテスト B**: ログイン (email/password → dashboard移動)
- [🔄] **スモークテスト C**: メール再送信 (UI操作 → メール受信)
- [🔄] **スモークテスト D**: エラーハンドリング (不正メール → 適切なエラー表示)

## 🚀 デプロイ手順

### 1. GitHub準備
- [🔄] release/p0-freeze → main PR作成・マージ

### 2. Vercel設定確認
- [🔄] Environment Variables検証
- [🔄] Build & Deploy実行
- [🔄] Production URLアクセス確認

### 3. Supabase設定確認
- [🔄] Auth設定が本番URLに統一されているか確認
- [🔄] RLS (Row Level Security) 有効化確認

## 📊 検証スクリプト

### 手動実行コマンド
```bash
# 環境変数チェック
npm run uat:env-check

# DNS解決確認
npm run uat:dns-check

# エンドポイント疎通確認
npm run uat:endpoint-check

# 認証デバッグ
npm run debug:auth user@example.com
```

### 自動検証予定
```bash
npm run uat:critical
npm run test:e2e:production
```

## 🎯 成功基準

### 必須クリア項目
1. **ユーザー登録完了**: signup → 確認メール → ログイン成功
2. **URLアクセス**: https://aiohub.jp で正常表示
3. **エラーフリー**: コンソールエラー・500エラーなし
4. **メール配信**: 確認メールが60秒以内に到着

### パフォーマンス
- ページロード時間: 3秒以内
- メール配信時間: 60秒以内
- API応答時間: 2秒以内

## 📈 進捗トラッキング

**最終更新**: 2024-09-23 23:45  

| ステータス | 項目 | 完了率 |
|------------|------|---------|
| 🟢 | コード実装 | 100% |
| 🔄 | GitHub PR | 進行中 |
| ⚪ | Vercel Deploy | 待機中 |
| ⚪ | スモークテスト | 待機中 |

---

### 🔄 ネクストステップ
1. **GitHub PR作成・マージ完了**
2. **Vercel本番デプロイ実行**  
3. **スモークテスト A-D 実行**
4. **結果報告 & ドキュメント更新**

**P0リリース目標**: 2024-09-23 24:00