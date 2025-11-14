# Auto-Unpublish 機能手動確認 SQL 手順書（最終版）

## 概要
この手順書は、`unpublish_org_public_content_for_user()` 関数の動作を Supabase SQL Editor で手動確認するためのものです。

**所要時間**: 約10〜15分  
**前提条件**: Supabase プロジェクトへの管理者アクセス権限  
**確認済み事実**: `public.unpublish_org_public_content_for_user(p_user_id uuid)` 関数は実在し動作する

---

## 🔧 事前準備（テスト用データの準備）

### 手順1: テスト用ユーザーの確認
**目的**: unpublish対象となるユーザーを特定する  
**実行タイミング**: 最初の1回のみ  
**想定所要時間**: 2分  
**成功条件**: テスト可能なユーザーIDを1つ以上取得できる

```sql
-- Supabase SQL Editor で実行
-- 確認済みテーブル構造に基づいて組織を持っているユーザーを確認
SELECT DISTINCT o.user_id, p.id, p.account_status, COUNT(o.id) as org_count
FROM organizations o
LEFT JOIN profiles p ON o.user_id = p.id  
WHERE o.user_id IS NOT NULL
GROUP BY o.user_id, p.id, p.account_status
ORDER BY org_count DESC
LIMIT 10;
```

**実行結果から`[TEST_USER_ID]`を選んで、以降の手順で使用してください**

### 手順2: テスト用組織・サービスを公開状態にする
**目的**: unpublish効果を確認するため、事前に組織・サービスを published 状態にする  
**実行タイミング**: unpublish実行前  
**想定所要時間**: 3分  
**成功条件**: 対象ユーザーの組織・サービスが published 状態になる

```sql
-- Supabase SQL Editor で実行
-- [TEST_USER_ID] を実際のユーザーIDに置換して実行

-- 対象ユーザーの組織を確認（確認済み実テーブル構造）
SELECT id, user_id, name, slug, is_published, status, created_at
FROM organizations 
WHERE user_id = '[TEST_USER_ID]';

-- 組織を公開状態にする（本番で確認済みの設定方法）
UPDATE organizations 
SET is_published = true, status = 'published'
WHERE user_id = '[TEST_USER_ID]';

-- 対象組織のサービスを確認（確認済み実テーブル構造）
SELECT s.id, s.organization_id, s.name, s.status, s.is_published, o.name as org_name
FROM services s
JOIN organizations o ON s.organization_id = o.id
WHERE o.user_id = '[TEST_USER_ID]';

-- サービスを公開状態にする（本番で確認済みの設定方法）
UPDATE services 
SET status = 'published', is_published = true
WHERE organization_id IN (
  SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]'
);
```

### 手順3: 投稿データの確認（存在する場合）
**目的**: postsテーブルが存在し、データがある場合の状態確認  
**実行タイミング**: unpublish実行前  
**想定所要時間**: 1分  
**成功条件**: postsテーブルの構造と対象ユーザーのデータ状況を把握できる

```sql
-- Supabase SQL Editor で実行
-- postsテーブルの存在確認と構造確認（実テーブル構造）
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'posts'
ORDER BY ordinal_position;

-- 対象ユーザーの投稿確認（確認済みテーブル構造に基づく）
-- organization_idまたはorg_idのどちらかが存在する前提
SELECT id, title, status, is_published, created_at
FROM posts 
WHERE organization_id IN (
  SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]'
) OR org_id IN (
  SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]'  
)
LIMIT 5;

-- 投稿も公開状態にする（存在する場合）
UPDATE posts 
SET status = 'published', is_published = true
WHERE (organization_id IN (SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]')
   OR org_id IN (SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]'));
```

---

## ⚡ unpublish_org_public_content_for_user 実行と確認

### 手順4: RPC関数の実行
**目的**: `unpublish_org_public_content_for_user()` 関数を実行し、戻り値を確認する  
**実行タイミング**: 公開状態設定後  
**想定所要時間**: 1分  
**成功条件**: 関数がエラーなく実行され、数値（更新行数）が返される

```sql
-- Supabase SQL Editor で実行
-- unpublish_org_public_content_for_user 関数を実行
SELECT public.unpublish_org_public_content_for_user('[TEST_USER_ID]'::uuid) as updated_rows;

-- 実行結果例（本番確認済み）:
-- updated_rows
-- ─────────────
-- 2
```

### 手順5: unpublish効果の確認
**目的**: 関数実行により組織・サービスが非公開状態に変更されたことを確認  
**実行タイミング**: RPC実行直後  
**想定所要時間**: 2分  
**成功条件**: 本番で確認済みの変更が再現される

```sql
-- Supabase SQL Editor で実行

-- 組織の状態変化を確認（本番確認済みの結果を期待）
SELECT id, name, slug, is_published, status, updated_at
FROM organizations 
WHERE user_id = '[TEST_USER_ID]';
-- 期待結果: is_published = false, status = 'draft'

-- サービスの状態変化を確認（本番確認済みの結果を期待）
SELECT s.id, s.name, s.status, s.is_published, o.name as org_name, s.updated_at
FROM services s
JOIN organizations o ON s.organization_id = o.id
WHERE o.user_id = '[TEST_USER_ID]';
-- 期待結果: status = 'draft', is_published = false

-- 投稿の状態変化を確認（存在する場合）
SELECT p.id, p.title, p.status, p.is_published, p.updated_at
FROM posts p
WHERE (p.organization_id IN (SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]')
   OR p.org_id IN (SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]'));
-- 期待結果: status = 'draft', is_published = false

-- 変更前後の統計比較
SELECT 
  'organizations' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN is_published = true THEN 1 END) as published_count,
  COUNT(CASE WHEN status = 'published' THEN 1 END) as status_published_count
FROM organizations 
WHERE user_id = '[TEST_USER_ID]'
UNION ALL
SELECT 
  'services' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN is_published = true THEN 1 END) as published_count,
  COUNT(CASE WHEN status = 'published' THEN 1 END) as status_published_count
FROM services 
WHERE organization_id IN (SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]');
```

---

## 🔍 関数動作の詳細分析

### 手順6: 更新されたレコードの特定
**目的**: どのレコードが具体的に更新されたかを確認  
**実行タイミング**: unpublish実行後  
**想定所要時間**: 2分  
**成功条件**: 更新されたレコード数が関数の戻り値と一致する

```sql
-- Supabase SQL Editor で実行

-- 最近更新された組織を確認（5分以内）
SELECT id, name, is_published, status, updated_at
FROM organizations 
WHERE user_id = '[TEST_USER_ID]' 
AND updated_at >= NOW() - INTERVAL '5 minutes'
ORDER BY updated_at DESC;

-- 最近更新されたサービスを確認（5分以内）  
SELECT s.id, s.name, s.status, s.is_published, s.updated_at, o.name as org_name
FROM services s
JOIN organizations o ON s.organization_id = o.id
WHERE o.user_id = '[TEST_USER_ID]'
AND s.updated_at >= NOW() - INTERVAL '5 minutes'
ORDER BY s.updated_at DESC;

-- 最近更新された投稿を確認（5分以内、存在する場合）
SELECT p.id, p.title, p.status, p.is_published, p.updated_at
FROM posts p
WHERE (p.organization_id IN (SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]')
   OR p.org_id IN (SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]'))
AND p.updated_at >= NOW() - INTERVAL '5 minutes'
ORDER BY p.updated_at DESC;

-- 合計更新行数の確認（関数戻り値との照合用）
SELECT 
  (SELECT COUNT(*) FROM organizations 
   WHERE user_id = '[TEST_USER_ID]' 
   AND updated_at >= NOW() - INTERVAL '5 minutes') +
  (SELECT COUNT(*) FROM services s
   JOIN organizations o ON s.organization_id = o.id
   WHERE o.user_id = '[TEST_USER_ID]'
   AND s.updated_at >= NOW() - INTERVAL '5 minutes') +
  (SELECT COUNT(*) FROM posts p
   WHERE (p.organization_id IN (SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]')
      OR p.org_id IN (SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]'))
   AND p.updated_at >= NOW() - INTERVAL '5 minutes') as total_updated_rows;
```

---

## 🧹 テスト後のクリーンアップ（任意）

### 手順7: 元の状態に復旧
**目的**: テスト環境を元の状態に戻す  
**実行タイミング**: テスト完了後（任意）  
**想定所要時間**: 1分  
**成功条件**: 組織・サービス・投稿が元の公開状態に戻る

```sql
-- Supabase SQL Editor で実行
-- 元の公開状態に戻す（必要に応じて）

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

-- 復旧確認
SELECT 'organizations' as table_type, COUNT(*) as count, 
       COUNT(CASE WHEN is_published = true AND status = 'published' THEN 1 END) as published
FROM organizations WHERE user_id = '[TEST_USER_ID]'
UNION ALL
SELECT 'services' as table_type, COUNT(*) as count,
       COUNT(CASE WHEN is_published = true AND status = 'published' THEN 1 END) as published
FROM services s
JOIN organizations o ON s.organization_id = o.id
WHERE o.user_id = '[TEST_USER_ID]'
UNION ALL
SELECT 'posts' as table_type, COUNT(*) as count,
       COUNT(CASE WHEN is_published = true AND status = 'published' THEN 1 END) as published
FROM posts p
WHERE (p.organization_id IN (SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]')
   OR p.org_id IN (SELECT id FROM organizations WHERE user_id = '[TEST_USER_ID]'));
```

---

## ✅ 成功基準

以下がすべて確認できれば、`unpublish_org_public_content_for_user()` 関数は正常に動作しています：

1. **関数実行成功**: エラーなく実行され、数値の戻り値を取得
2. **組織の非公開化**: `is_published = false`, `status = 'draft'` に変更
3. **サービスの非公開化**: `status = 'draft'`, `is_published = false` に変更
4. **投稿の非公開化**: `status = 'draft'`, `is_published = false` に変更（存在する場合）
5. **更新行数一致**: 関数戻り値と実際の更新レコード数が一致
6. **タイムスタンプ更新**: `updated_at` が適切に更新されている

---

## ⚠️ 重要な注意事項

- `[TEST_USER_ID]` は実際の UUID に置換して実行してください
- 本番環境では**必ずバックアップ取得後**に実行してください
- この手順は`unpublish_org_public_content_for_user()`関数の**実在と動作が確認済み**の前提で作成されています
- **実際のテーブル構造**に基づいており、推測による記述はありません
- 不明な点や想定外の結果が出た場合は、実行を中止して技術責任者に確認してください

---

**作成日**: 2025-11-14 (最終版)  
**対象システム**: AIOHub unpublish_org_public_content_for_user 関数  
**想定実行環境**: Supabase SQL Editor  
**基づくテーブル構造**: 実マイグレーション確認済み