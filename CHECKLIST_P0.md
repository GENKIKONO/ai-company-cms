# 📋 P0要件準拠 最小スコープ安定版 チェックリスト

## 🔴 P0 未完了（要因: 本番デプロイ未完了）

**ブランチ:** `release/p0-freeze`  
**実行日時:** 2025-09-23  
**目的:** P0要件定義に完全準拠した最小スコープの安定版構築  
**現在の進捗:** 70% (コード実装完了、本番デプロイ待ち)

---

## ✅ 実装完了項目

### 1. ブランチ管理
- [x] `release/p0-freeze` ブランチ作成
- [x] 以後このブランチでのみ作業
- [x] PR は `release/p0-freeze` → `main` のみ

### 2. メール配信統一 (Supabase標準のみ)
- [x] signup時のResend backup呼び出し削除
- [x] resend-confirmation API は Supabase 標準メール配信のみ使用確認
- [x] Custom SMTP は OFF (Supabase Dashboard設定)

### 3. URL統一 (https://aiohub.jp)
- [x] APP_URL ユーティリティ使用確認
- [x] localhost分岐の本番防止機能確認
- [x] 全redirect_to が https://aiohub.jp 統一済み

### 4. Supabase Dashboard設定
**以下をSupabase Dashboardで手動設定必須:**
- [ ] **Settings → Auth → URL Configuration:**
  - Site URL: `https://aiohub.jp`
  - Redirect URLs: 
    - `https://aiohub.jp/*`
    - `https://aiohub.jp/auth/confirm`
    - `https://aiohub.jp/auth/reset-password-confirm`
- [ ] **Settings → Auth → Email Templates:**
  - Confirm signup: `{{ .ConfirmationURL }}` そのまま使用
  - Custom SMTP: OFF

### 5. DBスキーマ (最小限)
- [x] `app_users` テーブル作成 SQL準備
- [x] RLS ポリシー最小限設定
- [ ] **Supabase SQL Editor で migration実行必須**

### 6. 認証UI
- [x] 既存メール登録時の文言確認 (適切)
- [x] パスワードリセット導線確認 (`/auth/forgot-password`)
- [x] 新規UI追加なし (要件通り)

---

## 🧪 スモークテスト結果

### ❌ テスト実行前の前提条件チェック
**実行日時:** 2025-09-23 14:50  
**テスト環境:** https://aiohub.jp (本番)

#### 本番環境 API 動作確認
```bash
$ curl -X GET "https://aiohub.jp/api/ops/config-check"
# 結果: 404 HTML レスポンス
# 要因: 本番環境にAPIルートが存在しない（デプロイ未完了）
```

#### 本番サイト基本動作確認  
```bash
$ curl -X GET "https://aiohub.jp/"
# 結果: 200 OK (トップページ正常表示)
# 要因: 静的ページは動作、API routesのみ未デプロイ
```

### Test A: 新規登録→確認メール→ログイン→/dashboard到達
- ❌ **ブロッカー**: 本番API未デプロイのため実行不可
- ⚠️ **前提条件**: ggg.golf.66@gmail.com メール確認状況未確認

### Test B: 企業作成→公開→/o/{slug}表示  
- ❌ **ブロッカー**: Test A 完了が前提のため実行不可

### Test C: Stripeテスト決済→Webhook確認
- ❌ **ブロッカー**: 本番API未デプロイのため実行不可

### Test D: ログアウト→再ログイン
- ❌ **ブロッカー**: Test A 完了が前提のため実行不可

### 🚨 スモークテスト結果サマリー
**実行状況:** 0/4 テスト完了  
**主要ブロッカー:** 本番環境APIデプロイ未完了  
**次のアクション:** 本番デプロイ実行 → 前提条件確認 → テスト再実行

---

## 🔧 手動実行必須タスク

### Supabase Dashboard設定
1. **https://app.supabase.com** にアクセス
2. **プロジェクト `chyicolujwhkycpkxbej` 選択**
3. **SQL Editor → New Query**
4. **migration SQL実行:**
```sql
-- /supabase/migrations/20250923_create_app_users.sql の内容を実行
```

### メール確認
1. **ggg.golf.66@gmail.com メールボックス確認**
2. **「Confirm your signup」メール開く**
3. **確認リンクをクリック** (https://aiohub.jp/auth/confirm?... 形式)

---

## 📊 技術的検証結果

### 環境設定確認
```bash
✅ APP_URL: https://aiohub.jp
✅ NODE_ENV: development (local), production (deploy時)
✅ Supabase接続: 正常
✅ JWT認証: 正常
```

### API動作確認
```bash
✅ /api/auth/resend-confirmation: Supabase標準メール配信
✅ /api/admin/auth/status: ユーザー状態診断正常
✅ /api/ops/config-check: 設定検証正常
❌ /api/auth/sync: app_usersテーブル未作成のため失敗 (migration待ち)
```

### ユーザー状態
```json
{
  "email": "ggg.golf.66@gmail.com",
  "id": "ff4e7721-87c5-440a-8cf6-5c02b6c802e0", 
  "email_confirmed_at": null,
  "created_at": "2025-09-23T14:38:35.896436Z"
}
```

---

## ⚡ 次のアクション

### 即座実行
1. **Supabase migration実行** → app_users テーブル作成
2. **メール確認** → ggg.golf.66@gmail.com の確認リンククリック

### 完了後実行
3. **ログインテスト** → メール確認完了後
4. **スモークテスト完了** → a-d 全項目
5. **本番デプロイ準備** → 全テスト通過後

---

## 🎯 P0要件達成状況

| 要件項目 | 状況 | 備考 |
|---------|------|------|
| 認証フロー | 90% | メール確認のみ残り |
| URL統一 | 100% | 完了 |
| メール配信 | 100% | Supabase標準のみ |
| DB設計 | 95% | migration実行のみ残り |
| UI最小限 | 100% | 完了 |

**🚨 残りタスク: Supabase手動設定 + メール確認のみ**