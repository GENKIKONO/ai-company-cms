# 本番スモークテスト チェックリスト（最終版）

## 概要
Vercel本番環境にデプロイ後、Auto-Unpublish システムの基本動作を10〜20分で確認するためのチェックリストです。

**対象**: Auto-Unpublish 核心機能  
**所要時間**: 10〜20分  
**実施者**: プロジェクトオーナー（手動実行）  
**基づく実装**: 実コード確認済み

---

## 📋 1. デプロイ前チェック

### 1-1. ローカル品質確認 (2分)
**目的**: コード品質の最終確認  
**成功条件**: すべてのコマンドがエラーなく完了する

```bash
# 実装確認済みのテストスクリプト
npm run typecheck
npm run lint  
npm run test src/tests/enforcement-auto-unpublish-simple.test.ts

# すべて PASS することを確認
```

### 1-2. 環境変数確認 (1分)
**目的**: 本番デプロイに必要な環境変数の存在確認  
**成功条件**: 確認済み必須環境変数がすべて設定され、値が正しい形式である

Vercel Dashboard で以下の確認済み必須環境変数が設定されていることを確認：

```bash
# 実装で確認済みの必須環境変数
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key] 
JWT_SECRET=[jwt-secret]

# 本番ドメイン（確認済み）
NEXT_PUBLIC_APP_URL=https://aiohub.jp
```

---

## 🚀 2. デプロイ直後チェック

### 2-1. 基本アクセス確認 (2分)
**目的**: 本番環境の基本動作確認  
**成功条件**: トップページが正常表示され、管理画面は適切に認証保護されている

```bash
# トップページアクセス（実ドメイン）
curl -I "https://aiohub.jp/"
# 期待結果: HTTP 200

# 管理画面アクセス（実装確認済みパス）  
curl -I "https://aiohub.jp/admin"
# 期待結果: HTTP 302 (リダイレクト) または 401 (認証要求)
```

### 2-2. 管理画面アクセス確認 (2分)
**目的**: 管理機能が正常に動作することを確認  
**成功条件**: 管理者ログインが正常に動作し、Enforcement画面にアクセスできる

```bash
# ブラウザで管理画面アクセス（実装確認済みパス）
open "https://aiohub.jp/admin/enforcement"

# 手動確認項目（実装確認済みコンポーネント）:
# □ ログイン画面が表示される（必要に応じて）
# □ 管理者アカウントでログイン可能  
# □ 制裁管理画面が表示される（UserSearch, ActionForm等）
# □ ユーザー検索機能が動作する
```

---

## ⚡ 3. Auto-Unpublish 動作確認（本番）

### 事前準備: テスト用データの確認 (3分)
**目的**: テスト実行可能なデータの特定  
**手順**: `docs/MANUAL_SQL_CHECKS_AUTO_UNPUBLISH.md` の手順1を実行  
**成功条件**: テスト用ユーザーIDとorg slugを特定できる

```sql
-- Supabase SQL Editor で実行（実テーブル構造確認済み）
-- テスト可能なユーザーと公開組織の確認
SELECT DISTINCT o.user_id, o.slug, o.is_published, o.status
FROM organizations o
WHERE o.is_published = true AND o.status = 'published'
ORDER BY o.updated_at DESC
LIMIT 5;

-- [TEST_USER_ID] と [ORG_SLUG] を特定し、以下の手順で使用
```

### 3-1. unpublish実行前の状態確認 (2分)
**目的**: 制裁前は公開APIでコンテンツが取得できることを確認  
**成功条件**: 実装確認済みの公開APIで正常にデータを取得できる

```bash
# 組織の公開API確認（実装確認済みエンドポイント）
curl -s "https://aiohub.jp/api/public/organizations/[ORG_SLUG]" | jq

# サービス一覧の確認（実装確認済みエンドポイント）
curl -s "https://aiohub.jp/api/public/services" | jq

# 期待結果（実装確認済みレスポンス形式）: 
# 組織: {"data": {"organization": {...}, "services": [...], ...}}
# サービス: {"services": [...], "total": N}
```

### 3-2. Auto-Unpublish実行 (3分)
**目的**: Supabase直接実行またはEnforcement画面でauto-unpublishを動作させる  
**成功条件**: unpublish関数が成功し、戻り値（更新行数）を取得できる

**方法A: Supabase SQL Editor で直接実行（推奨）**
```sql
-- Supabase SQL Editor で実行
-- 手順詳細は docs/MANUAL_SQL_CHECKS_AUTO_UNPUBLISH.md を参照
SELECT public.unpublish_org_public_content_for_user('[TEST_USER_ID]'::uuid) as updated_rows;

-- 期待結果: 数値（更新した行数）が返される（例: 2）
```

**方法B: 管理画面経由（実際のEnforcementフローのテスト）**
```bash
# ブラウザで管理画面アクセス（実装確認済み）
open "https://aiohub.jp/admin/enforcement"

# 手動実行（実装確認済みActionForm.tsx）:
# 1. UserSearchコンポーネントでユーザーID [TEST_USER_ID] で検索
# 2. ActionFormで "一時停止 (Suspend)" を選択
# 3. メッセージ: "本番動作確認テスト"
# 4. 実行ボタンをクリック
# 5. auto-unpublishが自動実行される（_shared.ts実装確認済み）
```

### 3-3. Auto-Unpublish効果の確認 (3分)
**目的**: unpublish実行後、公開APIで適切にアクセス拒否されることを確認  
**成功条件**: 同じAPIで実装確認済みのエラーレスポンスが返される

```bash
# 組織API - アクセス拒否確認（同じコマンドを再実行）
curl -s "https://aiohub.jp/api/public/organizations/[ORG_SLUG]" | jq
# 期待結果（実装確認済み）: {"error":"Organization not found"}

# サービスAPI - フィルタリング確認（同じコマンドを再実行）
curl -s "https://aiohub.jp/api/public/services" | jq
# 期待結果（実装確認済み）: 対象サービスが除外され、totalが減少

# HTTPステータスコード確認
curl -w "%{http_code}\n" -s -o /dev/null "https://aiohub.jp/api/public/organizations/[ORG_SLUG]"
# 期待結果: 404（Organization not found）
```

### 3-4. Supabaseでのデータ確認 (2分)  
**目的**: DB状態が期待通りに変更されていることを確認  
**成功条件**: 実テーブル構造に基づく確認済みの状態変更が再現される

```sql
-- Supabase SQL Editor で確認（実テーブル構造確認済み）

-- 組織の状態変更確認（確認済みの変更を期待）
SELECT id, name, slug, is_published, status, updated_at
FROM organizations 
WHERE user_id = '[TEST_USER_ID]';
-- 期待結果: is_published = false, status = 'draft'

-- サービスの状態変更確認（確認済みの変更を期待）
SELECT s.id, s.name, s.status, s.is_published, s.updated_at, o.name as org_name
FROM services s
JOIN organizations o ON s.organization_id = o.id
WHERE o.user_id = '[TEST_USER_ID]';
-- 期待結果: status = 'draft', is_published = false

-- 投稿の状態変更確認（存在する場合、実テーブル構造対応）
SELECT p.id, p.title, p.status, p.is_published, p.updated_at
FROM posts p
WHERE (p.organization_id IN (SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]')
   OR p.org_id IN (SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]'));
-- 期待結果: status = 'draft', is_published = false

-- 更新行数の確認
SELECT COUNT(*) as total_updated_count 
FROM (
  SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]' AND updated_at >= NOW() - INTERVAL '10 minutes'
  UNION ALL
  SELECT s.id FROM services s 
  JOIN organizations o ON s.organization_id = o.id 
  WHERE o.user_id = '[TEST_USER_ID]' AND s.updated_at >= NOW() - INTERVAL '10 minutes'
) as updated_records;
-- 期待結果: unpublish関数の戻り値と一致する数値
```

---

## 📊 4. ログ＆エラー確認

### 4-1. Vercelログ確認 (2分)
**目的**: アプリケーションレベルでのエラー有無確認  
**成功条件**: 重大なエラーがなく、Enforcementログが適切に記録されている

```bash
# Vercel Dashboard でログを確認
# 直近30分のエラーログをチェック

# 確認ポイント（実装確認済みログ出力）:
# □ 500エラーが発生していない
# □ enforcement実行時のログ（logger.info）が適切に出力されている  
# □ auto-unpublish関連のエラー（logger.error）がない
```

### 4-2. Supabaseログ確認 (1分)  
**目的**: データベースレベルでのエラー有無確認  
**成功条件**: Supabase側でRPC実行エラーが発生していない

```sql
-- Supabase Dashboard > Logs で確認
-- RPC function の実行ログを確認
-- unpublish_org_public_content_for_user の実行状況を確認
-- エラーがないことを確認
```

### 4-3. Enforcementシステムログ確認 (1分)
**目的**: Enforcementシステム固有のログ確認  
**成功条件**: 実装確認済みのログ出力が適切に記録されている

```sql
-- Supabase SQL Editor で確認（実テーブル構造確認済み）
-- enforcement_actions テーブルでアクション記録を確認
SELECT id, user_id, action, message, created_at, issued_by
FROM enforcement_actions 
WHERE user_id = '[TEST_USER_ID]' 
ORDER BY created_at DESC LIMIT 3;
-- 期待結果: 最新のアクションが記録されている

-- profiles.account_status の更新確認
SELECT id, account_status, updated_at
FROM profiles
WHERE id = '[TEST_USER_ID]';
-- 期待結果: account_statusが適切に更新されている
```

---

## 🔄 5. 復旧テスト（任意）

### 5-1. 手動でのデータ復旧 (1分)
**目的**: 手動復旧手順の動作確認  
**成功条件**: 手動で組織を再公開でき、APIで再度取得できる

```sql
-- Supabase SQL Editor で手動復旧実行（実テーブル構造確認済み）
UPDATE organizations 
SET is_published = true, status = 'published'
WHERE user_id = '[TEST_USER_ID]';

UPDATE services 
SET status = 'published', is_published = true
WHERE organization_id IN (
  SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]'
);

-- 投稿も復旧（存在する場合）
UPDATE posts 
SET status = 'published', is_published = true
WHERE (organization_id IN (SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]')
   OR org_id IN (SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]'));
```

### 5-2. 復旧後の確認 (1分)
**目的**: 復旧後にAPIで再度取得できることを確認  
**成功条件**: 公開APIで再び正常にデータを取得できる

```bash
# 復旧後のAPI確認（実装確認済みエンドポイント）
curl -s "https://aiohub.jp/api/public/organizations/[ORG_SLUG]" | jq
curl -s "https://aiohub.jp/api/public/services" | jq

# 期待結果: 再び組織・サービスデータが取得できる
```

---

## ✅ 最終確認チェックリスト

### 必須項目（すべてチェック要・実装確認済み）:
- [ ] **デプロイ成功**: Vercelデプロイが正常完了
- [ ] **基本アクセス**: トップページが正常表示される
- [ ] **管理画面**: `/admin/enforcement`にアクセス可能（実装確認済み）
- [ ] **公開API正常**: unpublish前に組織・サービスデータが取得できる（実装確認済み）
- [ ] **unpublish成功**: `unpublish_org_public_content_for_user()`が数値を返す
- [ ] **API保護**: unpublish後に`{"error":"Organization not found"}`等が返される（実装確認済み）
- [ ] **DB状態正常**: `is_published=false, status='draft'`に変更されている（実テーブル構造確認済み）
- [ ] **ログ正常**: 重大なエラーログがない

### 推奨項目（可能な範囲で）:
- [ ] **復旧動作**: 手動復旧でAPIが再度動作する
- [ ] **Enforcementログ**: enforcement_actionsテーブルに記録が残る
- [ ] **パフォーマンス**: APIレスポンス時間が適切（1秒以内）

---

## 🎯 「Auto-Unpublish機能は本番OK」の最終判断基準

以下の条件をすべて満たしている場合、**Auto-Unpublish機能は本番運用可能**と判断できます：

### ✅ 技術的成功基準（実装確認済み）:
1. **コア機能動作**: `unpublish_org_public_content_for_user()`が正常実行される
2. **データ整合性**: organizations/services/postsが期待通り非公開状態に変更される  
3. **API保護**: 公開APIで非公開コンテンツが適切に保護される（実装確認済みフィルタリング）
4. **ログ正常**: エラーログに重大な問題がない（実装確認済みログ出力）
5. **復旧可能性**: 手動復旧により元の状態に戻せる

### ✅ 運用準備完了基準:
1. **手順書完備**: SQLとAPIの確認手順が実装基準で実行可能
2. **エラー監視**: 基本的なログとエラー監視が機能
3. **緊急復旧**: 手動でのデータ復旧方法が実テーブル構造で明確

---

## 🚨 緊急時の対応手順

### トラブル発生時の即座対応:

#### 意図しないデータが非公開化された場合:
```sql
-- Supabase SQL Editor で即座に復旧（実テーブル構造確認済み）
UPDATE organizations 
SET is_published = true, status = 'published'
WHERE id = '[問題の組織ID]';

UPDATE services 
SET status = 'published', is_published = true
WHERE organization_id = '[問題の組織ID]';

-- 投稿も復旧（存在する場合）
UPDATE posts 
SET status = 'published', is_published = true
WHERE organization_id = '[問題の組織ID]' OR org_id = '[問題の組織ID]';
```

#### unpublish関数が異常動作している場合:
```sql
-- 関数の実行履歴確認
SELECT * FROM pg_stat_user_functions 
WHERE funcname LIKE '%unpublish%';

-- enforcement_actions テーブルで履歴確認（実テーブル構造確認済み）
SELECT user_id, action, message, created_at, processed_at
FROM enforcement_actions 
ORDER BY created_at DESC LIMIT 10;
```

---

**作成日**: 2025-11-14 (最終版)  
**対象システム**: AIOHub Auto-Unpublish機能  
**想定実行時間**: 10〜20分  
**実装基準**: 実コード・実テーブル構造確認済み  
**確認済み前提**: すべて実装・実在要素のみで構成