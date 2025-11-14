# 公開API + Auto-Unpublish 動作確認チェックリスト（最終版）

## 概要
`unpublish_org_public_content_for_user()` 実行前後での公開API の動作変化を確認し、RLS保護が適切に機能することを検証する手順書です。

**所要時間**: 約5〜10分  
**前提条件**: 本番環境または開発環境へのアクセス  
**確認済み実在API**: `/api/public/organizations/[slug]`, `/api/public/services`

---

## 📋 事前準備

### テスト環境の確認
```bash
# 本番環境
echo "https://aiohub.jp"

# ローカル環境（開発時）
echo "http://localhost:3000"
```

### テスト対象データの特定
- **[TEST_USER_ID]**: テスト対象のユーザーID（UUID形式）
- **[ORG_SLUG]**: 対象ユーザーの組織スラッグ（例: `auto-unpublish-test`）

> 注意: 事前に `docs/MANUAL_SQL_CHECKS_AUTO_UNPUBLISH.md` でテスト用組織を `published` 状態にしておく

---

## 🌐 unpublish実行前の状態確認

### 1. 組織の公開API確認
**目的**: unpublish実行前は組織情報が取得できることを確認  
**実行タイミング**: unpublish前  
**想定所要時間**: 1分  
**成功条件**: 組織データが正常に取得できる

```bash
# 本番環境での確認（実在APIエンドポイント）
curl -s "https://aiohub.jp/api/public/organizations/[ORG_SLUG]" | jq

# ローカル環境での確認（実在APIエンドポイント）  
curl -s "http://localhost:3000/api/public/organizations/[ORG_SLUG]" | jq
```

**期待結果** (unpublish実行前・実装確認済みレスポンス形式):
```json
{
  "data": {
    "organization": {
      "id": "uuid-here",
      "name": "組織名",
      "slug": "org-slug",
      "is_published": true,
      "status": "published",
      "user_id": "user-uuid",
      "created_at": "...",
      "updated_at": "..."
    },
    "posts": [...],
    "services": [...],
    "case_studies": [...],
    "faqs": [...]
  }
}
```

### 2. サービス一覧の公開API確認
**目的**: unpublish実行前はサービス一覧が取得できることを確認  
**実行タイミング**: unpublish前  
**想定所要時間**: 1分  
**成功条件**: サービスデータが正常に取得できる

```bash
# 本番環境での確認（実在APIエンドポイント）
curl -s "https://aiohub.jp/api/public/services" | jq

# ローカル環境での確認（実在APIエンドポイント）
curl -s "http://localhost:3000/api/public/services" | jq

# 特定組織のサービス（orgパラメータが存在する場合）
curl -s "https://aiohub.jp/api/public/services?org=[ORG_SLUG]" | jq
```

**期待結果** (unpublish実行前・実装確認済みレスポンス形式):
```json
{
  "services": [
    {
      "id": "service-uuid",
      "name": "サービス名",
      "description": "説明文",
      "status": "published",
      "organization_id": "org-uuid",
      "is_published": true,
      "created_at": "...",
      "updated_at": "...",
      "category": null,
      "features": null,
      "price": null,
      "cta_url": null
    }
  ],
  "total": 1
}
```

---

## ⚡ unpublish_org_public_content_for_user 実行

### 3. Supabase関数の実行
**実行方法**: `docs/MANUAL_SQL_CHECKS_AUTO_UNPUBLISH.md` の手順4に従って実行

```sql
-- Supabase SQL Editor で実行
SELECT public.unpublish_org_public_content_for_user('[TEST_USER_ID]'::uuid);
```

> 📝 この手順の詳細は別の手順書を参照してください

---

## 🔒 unpublish実行後のAPI保護確認

### 4. 組織API - アクセス拒否確認
**目的**: unpublish実行後は同じAPIでエラーが返されることを確認  
**実行タイミング**: unpublish実行直後  
**想定所要時間**: 1分  
**成功条件**: 組織が見つからないエラーが返される

```bash
# 本番環境での確認（実行前と同じコマンド）
curl -s "https://aiohub.jp/api/public/organizations/[ORG_SLUG]" | jq

# ローカル環境での確認
curl -s "http://localhost:3000/api/public/organizations/[ORG_SLUG]" | jq
```

**期待結果** (unpublish実行後・本番確認済みレスポンス):
```json
{
  "error": "Organization not found"
}
```

### 5. サービスAPI - フィルタリング確認
**目的**: unpublish実行後はサービス一覧から対象が除外されることを確認  
**実行タイミング**: unpublish実行直後  
**想定所要時間**: 1分  
**成功条件**: 対象組織のサービスが一覧から除外される

```bash
# 本番環境での確認（実行前と同じコマンド）
curl -s "https://aiohub.jp/api/public/services" | jq

# ローカル環境での確認
curl -s "http://localhost:3000/api/public/services" | jq
```

**期待結果** (unpublish実行後):
- 全サービス一覧から対象ユーザーのサービスが除外される
- `total` 数が減少する
- 非公開になったサービスは `status = 'published'` でフィルタリングされるため含まれない

### 6. HTTPステータスコードの確認
**目的**: 適切なHTTPステータスコードが返されることを確認  
**実行タイミング**: unpublish実行直後  
**想定所要時間**: 1分  
**成功条件**: 適切なHTTPステータスが返される

```bash
# 組織API のステータスコード確認
curl -w "%{http_code}\n" -s -o /dev/null "https://aiohub.jp/api/public/organizations/[ORG_SLUG]"

# サービスAPI のステータスコード確認
curl -w "%{http_code}\n" -s -o /dev/null "https://aiohub.jp/api/public/services"
```

**期待結果**:
- 組織API: `404`（Organization not found）
- サービスAPI: `200`（正常レスポンス、ただし非公開サービスは除外）

---

## 🔍 詳細な動作確認

### 7. レスポンス時間の確認
**目的**: unpublish後もAPIレスポンス時間が適切であることを確認  
**実行タイミング**: unpublish実行後  
**想定所要時間**: 1分  
**成功条件**: レスポンス時間が1秒以内

```bash
# レスポンス時間を含めて確認
curl -w "Time: %{time_total}s\nStatus: %{http_code}\n" -s -o /dev/null "https://aiohub.jp/api/public/organizations/[ORG_SLUG]"
```

### 8. キャッシュヘッダーの確認
**目的**: 適切なキャッシュヘッダーが設定されていることを確認  
**実行タイミング**: unpublish実行後  
**想定所要時間**: 1分  
**成功条件**: 適切なContent-TypeとCache-Controlが設定されている

```bash
# ヘッダーを含めて確認（実装確認済みヘッダー）
curl -I "https://aiohub.jp/api/public/services"

# 確認すべきヘッダー（実装で確認済み）:
# - Content-Type: application/json; charset=utf-8
# - Cache-Control: public, max-age=300, s-maxage=300
```

---

## 🔄 復旧テスト（任意）

### 9. 手動での組織再公開
**目的**: 手動で組織を再公開した場合のAPI動作確認  
**実行タイミング**: テスト完了時（任意）  
**想定所要時間**: 2分  
**成功条件**: 再公開後にAPIで再度取得できる

```sql
-- Supabase SQL Editor で手動実行（実テーブル構造に基づく）
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

**再公開後のAPI確認:**
```bash
# 再度組織APIを確認
curl -s "https://aiohub.jp/api/public/organizations/[ORG_SLUG]" | jq

# 期待結果: 再び組織データが取得できる
```

---

## ✅ 成功基準チェックリスト

以下すべてにチェックが入れば、公開API + Auto-Unpublish は正常に動作しています：

### 必須項目（実装確認済み機能）:
- [ ] **unpublish前**: `/api/public/organizations/[slug]` で組織データが取得できる
- [ ] **unpublish前**: `/api/public/services` でサービス一覧が取得できる  
- [ ] **unpublish後**: `/api/public/organizations/[slug]` が `{"error":"Organization not found"}` を返す
- [ ] **unpublish後**: `/api/public/services` から対象サービスが除外される
- [ ] **レスポンス時間**: APIレスポンスが1秒以内で返される
- [ ] **キャッシュヘッダー**: 適切なContent-TypeとCache-Controlが設定されている

### 推奨項目:
- [ ] **復旧テスト**: 手動再公開後にAPIで再度取得できることを確認
- [ ] **HTTPステータス**: 適切なステータスコードが返される
- [ ] **一貫性**: 複数回実行しても同じ結果が得られる

---

## ⚠️ 重要な注意事項

### 使用可能な公開APIエンドポイント（実装確認済み）:
- ✅ `/api/public/organizations/[slug]` - 組織詳細取得（実装確認済み）
- ✅ `/api/public/services` - サービス一覧取得（実装確認済み）

### 実装確認済みレスポンス形式:
- **組織API成功**: `{"data": {"organization": {...}, "posts": [...], "services": [...], ...}}`
- **組織APIエラー**: `{"error": "Organization not found"}`
- **サービスAPI**: `{"services": [...], "total": N}`

### 実装確認済みフィルタリングロジック:
- 組織API: `is_published = true` でフィルタリング
- サービスAPI: `status = 'published'` でフィルタリング（実装コード確認済み）

### テスト実施時の注意:
1. **本番環境**: 実際のユーザーデータに影響しないテスト用データのみ使用
2. **データバックアップ**: 重要なデータは事前にバックアップ
3. **戻し忘れ注意**: テスト後の状態復旧を忘れずに実施
4. **実装依存**: この手順書は実際のAPI実装に基づいて作成されています

---

**作成日**: 2025-11-14 (最終版)  
**対象システム**: AIOHub 公開API + Auto-Unpublish  
**確認済み実装**: 実APIコード確認済み  
**テスト対象**: 実在エンドポイントのみ