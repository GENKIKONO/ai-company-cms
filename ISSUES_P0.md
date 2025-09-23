# 🚨 P0 スモークテスト Issues

**Branch:** `release/p0-freeze`  
**Test Date:** 2025-09-23  
**Status:** 🔴 P0 未完了

---

## Issue #1: [P0] 本番環境 API Routes が 404
**優先度:** Critical  
**影響:** P0 スモークテスト実行不可

### 再現手順
1. `curl -X GET "https://aiohub.jp/api/ops/config-check"`
2. 期待: JSON レスポンス
3. 実際: 404 HTML レスポンス

### 技術詳細
```bash
# 実行コマンド
curl -X GET "https://aiohub.jp/api/ops/config-check"

# 実際の結果
HTTP Status: 404
Content-Type: text/html
Body: "404: This page could not be found."
```

### 原因分析
- 本番環境に `release/p0-freeze` ブランチがデプロイされていない
- 現在の本番環境は古いバージョンを実行中
- API routes (`/api/ops/*`, `/api/admin/*`) が存在しない

### 解決方法
1. `release/p0-freeze` ブランチを `main` にマージ
2. Vercel 本番デプロイ実行
3. デプロイ完了確認後にスモークテスト再実行

### P0リリースへの影響
**ブロッカー**: 本番デプロイ完了まで P0 スモークテスト実行不可

---

## Issue #2: [P0] メール確認状況の確認が必要
**優先度:** High  
**影響:** スモークテスト A の前提条件

### 確認事項
- `ggg.golf.66@gmail.com` のメール確認リンククリック完了確認
- Supabase で `email_confirmed_at` が設定されているか確認

### 検証方法
```bash
# 本番デプロイ後に実行
curl -X POST https://aiohub.jp/api/admin/auth/status \
  -H "Content-Type: application/json" \
  -H "x-admin-token: [JWT_TOKEN]" \
  -d '{"email":"ggg.golf.66@gmail.com"}'

# 期待結果
{
  "success": true,
  "data": {
    "exists": true,
    "is_confirmed": true,  // ← この値を確認
    "email_confirmed_at": "2025-09-23T...",
    "is_banned": false
  }
}
```

---

## Issue #3: [P0] Supabase Migration 実行確認
**優先度:** High  
**影響:** `/api/auth/sync` API の動作

### 確認事項
- Supabase SQL Editor で `20250923_create_app_users.sql` 実行完了確認
- `app_users` テーブル作成確認
- RLS ポリシー設定確認

### 検証方法
```sql
-- Supabase SQL Editor で実行
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'app_users';

-- 期待結果: app_users テーブルが存在すること
```

---

## 🎯 P0 完了までのクリティカルパス

### ステップ 1: 本番デプロイ実行
```bash
# 1. ブランチマージ
git checkout main
git merge release/p0-freeze

# 2. プッシュ (Vercel自動デプロイトリガー)
git push origin main

# 3. デプロイ完了確認
curl https://aiohub.jp/api/ops/config-check
```

### ステップ 2: 前提条件確認
- [ ] メール確認完了 (`ggg.golf.66@gmail.com`)
- [ ] Supabase migration 実行
- [ ] API endpoints 動作確認

### ステップ 3: スモークテスト実行
- [ ] Test A: 新規登録→確認メール→ログイン→dashboard
- [ ] Test B: 企業作成→公開→/o/{slug}表示  
- [ ] Test C: Stripe決済→Webhook確認
- [ ] Test D: ログアウト→再ログイン

---

## 📊 現在の P0 達成率

| 項目 | 進捗 | 状況 |
|------|------|------|
| コード実装 | 100% | ✅ 完了 |
| マイグレーション準備 | 100% | ✅ 完了 |
| 本番デプロイ | 0% | ❌ 未実施 |
| 前提条件確認 | 50% | ⚠️ 一部確認待ち |
| スモークテスト | 0% | ❌ デプロイ待ち |

**総合進捗: 70%**  
**ブロッカー: 本番デプロイ未完了**

---

## 🚀 次のアクション

### 即座実行必須
1. **本番デプロイ**: `release/p0-freeze` → `main` → Vercel deploy
2. **デプロイ確認**: API endpoints の 200 レスポンス確認
3. **前提条件チェック**: メール確認・DB migration

### デプロイ完了後
1. **スモークテスト実行**: 本番環境で A-D 実施
2. **結果記録**: CHECKLIST_P0.md 更新
3. **P0完了判定**: 🟢/🔴 の最終判定

---

**⚠️ 重要**: P0 リリース判定は本番デプロイ完了後のスモークテスト結果に依存