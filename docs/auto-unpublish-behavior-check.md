# Auto-Unpublish Function Behavior Check

## 目的
Supabase の `unpublish_org_public_content_for_user(p_user_id uuid)` 関数の実際の動作を検証し、文書化する。

**重要**: この関数はDB側で定義されており、内容の変更は行わない。動作の確認と文書化のみを実施。

## 関数仕様（DB側で定義済み）

### 関数名
`public.unpublish_org_public_content_for_user(p_user_id uuid)`

### ⚠️ 重要: DB側がソースオブトゥルース
この関数の実際の仕様は **Supabase側で定義されており、既にユーザーによって動作確認済み** です。
以下は推測による記述であり、実際の仕様とは異なる可能性があります。

### 実行内容（仮の推測・要実行確認）
以下のテーブルの `is_published` フラグを `false` に更新すると推定されますが、**実際の動作は実行確認が必要** です：

1. **organizations**（推測）
   ```sql
   -- 推測: 実際のSQL内容はDB側で確認してください
   UPDATE organizations 
   SET is_published = false 
   WHERE created_by = p_user_id;
   ```

2. **posts**（推測）
   ```sql
   -- 推測: 実際のSQL内容はDB側で確認してください
   UPDATE posts 
   SET is_published = false 
   WHERE created_by = p_user_id;
   ```

3. **services**（推測）
   ```sql
   -- 推測: 実際のSQL内容はDB側で確認してください
   UPDATE services 
   SET is_published = false 
   WHERE created_by = p_user_id;
   ```

4. **case_studies**（推測）
   ```sql
   -- 推測: 実際のSQL内容はDB側で確認してください
   UPDATE case_studies 
   SET is_published = false 
   WHERE created_by = p_user_id;
   ```

5. **faqs**（推測）
   ```sql
   -- 推測: 実際のSQL内容はDB側で確認してください
   UPDATE faqs 
   SET is_published = false 
   WHERE created_by = p_user_id;
   ```

## 検証方法

### 事前準備
1. テスト用ユーザーアカウント作成
2. テスト用公開コンテンツ作成（organization、post、service等）
3. コンテンツが `is_published=true` であることを確認

### 実行手順
```sql
-- 1. 実行前の状態確認
SELECT 
  'organizations' as table_name, 
  id, 
  name, 
  is_published, 
  created_by 
FROM organizations 
WHERE created_by = '[test_user_id]'

UNION ALL

SELECT 
  'posts' as table_name, 
  id, 
  title as name, 
  is_published, 
  created_by 
FROM posts 
WHERE created_by = '[test_user_id]';

-- 2. auto-unpublish 関数実行
SELECT unpublish_org_public_content_for_user('[test_user_id]');

-- 3. 実行後の状態確認
SELECT 
  'organizations' as table_name, 
  id, 
  name, 
  is_published, 
  created_by 
FROM organizations 
WHERE created_by = '[test_user_id]'

UNION ALL

SELECT 
  'posts' as table_name, 
  id, 
  title as name, 
  is_published, 
  created_by 
FROM posts 
WHERE created_by = '[test_user_id]';
```

### 自動化スクリプト実行
```bash
# RLS検証スクリプトにauto-unpublish動作確認が含まれている
node scripts/rls-verification-test.js
```

## 確認項目

### ✅ 基本動作
- [ ] 関数が正常に実行される（エラーなし）
- [ ] 指定ユーザーの全コンテンツが `is_published=false` に更新される
- [ ] 他ユーザーのコンテンツは影響を受けない

### ✅ パフォーマンス
- [ ] 実行時間が合理的範囲内（数秒以内）
- [ ] 大量データでも適切に動作する
- [ ] デッドロックやロック競合が発生しない

### ✅ エラーハンドリング
- [ ] 存在しないユーザーIDでもエラーにならない
- [ ] 無効なUUIDの場合のエラー処理
- [ ] 部分的失敗時の挙動

### ✅ 副作用
- [ ] `status` フィールドは変更されない
- [ ] `updated_at` フィールドが適切に更新される
- [ ] 関連するトリガーが正常動作する

## 実際の検証結果

### ⚠️ 注意: この欄はユーザーが実際に動作確認してから埋めてください

#### 検証方法
1. **RLS検証スクリプトの実行**
   ```bash
   node scripts/rls-verification-test.js
   ```
   このスクリプトには auto-unpublish 関数の動作確認が含まれています。

2. **手動でのSQL実行**（任意）
   ```sql
   -- Supabaseダッシュボードで直接実行
   SELECT unpublish_org_public_content_for_user('[test_user_id]');
   ```

---

### 【ここから実行結果を記録してください】

#### テスト実行記録

**実行日時**: [ユーザーが記入]

**テスト環境**: [ユーザーが記入]
- Supabase Project: [プロジェクト情報]
- 実行者: [実行者名]
- テストユーザーID: [生成されたテストユーザーID]

#### 実行前状態
```
[ユーザーが実行前のデータ状態を記録]
例：
- organizations: 1件 (is_published=true)
- posts: 2件 (is_published=true)
- services: 1件 (is_published=true)
```

#### 関数実行結果
```sql
-- 実行コマンド
[ユーザーが実際に実行したコマンドを記録]

-- 結果
[ユーザーが実行結果を記録]
```

#### 実行後状態
```
[ユーザーが実行後のデータ状態を記録]
例：
- organizations: 1件 (is_published=false) ← 期待通り
- posts: 2件 (is_published=false) ← 期待通り
- services: 1件 (is_published=false) ← 期待通り
```

#### パフォーマンス測定（任意）
```
[ユーザーが測定結果を記録]
- 関数実行時間: [時間]ms
- 影響レコード数: [詳細]
```

#### 発見事項
```
[ユーザーが実際の検証で発見した事項を記録]
例：
- 関数が期待通りに動作することを確認
- 他ユーザーのコンテンツに影響しないことを確認
- パフォーマンスに問題なし
```

#### 注意事項・制限事項
```
[ユーザーが発見した注意事項や制限事項を記録]
例：
- エラーハンドリングの挙動
- 特殊ケースでの動作
```

### 検証完了確認
- [ ] auto-unpublish関数の動作確認済み
- [ ] 実行結果の記録済み
- [ ] 他ユーザーへの影響なしを確認済み

## 運用上の考慮事項

### 実行タイミング
- Enforcement action 成功後に実行
- ユーザー状態更新の後に実行（整合性確保）

### エラー処理
- 関数エラー時もenforcement処理は継続
- エラーログの監視が必要
- 手動での再実行手順の整備

### 復帰処理
- **重要**: auto-republish 機能は存在しない
- ユーザー復帰時は手動でのコンテンツ再公開が必要
- 運用手順書に復帰手順を明記

### モニタリング
- 関数実行回数の監視
- 実行エラー率の監視
- パフォーマンス劣化の監視

## 関数の詳細情報（参考）

### 定義場所
- **Schema**: public
- **Name**: unpublish_org_public_content_for_user
- **Parameters**: p_user_id uuid
- **Returns**: void（推定）

### 権限要件
- Service Role Key での実行が必要
- RLS バイパスが必要

### 依存関係
- organizations テーブル
- posts テーブル  
- services テーブル
- case_studies テーブル
- faqs テーブル

## 結論

### 機能評価
**動作ステータス**: [PASS/FAIL/要確認]

### 運用準備度
- ✅ / ❌ 基本動作確認完了
- ✅ / ❌ パフォーマンス要件満足  
- ✅ / ❌ エラーハンドリング適切
- ✅ / ❌ 運用手順整備完了

### 推奨事項
```
[検証結果に基づく推奨事項]
```

---
**検証実施日**: 2025-11-14  
**検証スクリプト**: `scripts/rls-verification-test.js`  
**関連ファイル**: `src/app/api/enforcement/actions/_shared.ts`  
**DB関数**: `public.unpublish_org_public_content_for_user(p_user_id uuid)`