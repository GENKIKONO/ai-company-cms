# DB側 RPC/ReadModel 確認依頼

**作成日**: 2025-12-27
**作成者**: フロントエンド側（Claude Code）
**目的**: アプリ側のFeatureGate実装とDB側RPCの整合性確認

---

## 背景

アプリ側で以下のSubject型APIを実装しました：

```typescript
// src/lib/featureGate.ts

// 1. 機能セット取得
getEffectiveFeatures(supabase, subject: Subject): Promise<EffectiveFeature[]>
// → RPC: get_effective_feature_set(subject_type, subject_id)

// 2. クォータ判定・消費
canExecute(supabase, {
  subject: Subject,
  feature_key: string,
  limit_key: string,
  amount?: number,
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'rolling' | 'total',
  idempotency_key?: string
}): Promise<QuotaResult>
// → RPC: check_and_consume_quota(subject_type, subject_id, feature_key, limit_key, amount, period, idempotency_key)
```

実際の使用例（`/api/my/faqs` POST）：
```typescript
const subject: Subject = { type: 'org', id: orgData.id };
const effectiveFeatures = await getEffectiveFeatures(supabase, subject);
const quotaResult = await canExecute(supabase, {
  subject,
  feature_key: 'faq_module',
  limit_key: 'max_count',
  amount: 1,
  period: 'total',
  idempotency_key: `faq-create-${userId}-${Date.now()}-${random}`
});
```

---

## 確認項目（Yes/No で回答ください）

### 1. `get_effective_feature_set` RPC

| # | 確認事項 | Yes/No |
|---|----------|--------|
| 1.1 | `public.get_effective_feature_set(subject_type text, subject_id uuid)` が存在するか？ | |
| 1.2 | 返却形式は `SETOF jsonb` または `jsonb[]` で、各要素に `feature_key`, `is_enabled`/`enabled`, `limits` を含むか？ | |
| 1.3 | `limits` は `[{ limit_key, period, limit_value, reset_day }]` 形式または `{ limit_key: { value, period, reset_day }}` 形式か？ | |
| 1.4 | `subject_type = 'org'` の場合、組織のプランに基づく機能セットが返るか？ | |
| 1.5 | RLSまたはSECURITY DEFINERで呼び出し元ユーザーの権限検証をしているか？ | |

**不足点があれば記載**:
```
（DB側記入欄）
```

### 2. `check_and_consume_quota` RPC

| # | 確認事項 | Yes/No |
|---|----------|--------|
| 2.1 | `public.check_and_consume_quota(subject_type, subject_id, feature_key, limit_key, amount, period, idempotency_key)` が存在するか？ | |
| 2.2 | 返却形式は `jsonb` で `{ ok: boolean, code: text, remaining?: int, limit?: int, period?: text, window_end?: timestamptz }` を含むか？ | |
| 2.3 | `idempotency_key` が同一の場合、二重消費を防止し `{ ok: true, replayed: true }` 等を返すか？ | |
| 2.4 | トランザクション内で原子的に消費（読み取り→判定→書き込み）を行っているか？ | |
| 2.5 | RLSまたはSECURITY DEFINERで呼び出し元ユーザーのsubjectアクセス権限を検証しているか？ | |

**不足点があれば記載**:
```
（DB側記入欄）
```

### 3. `code` 値の整合性

アプリ側で以下の `code` をHTTPステータスにマッピングしています：

| code | HTTPステータス | 説明 |
|------|---------------|------|
| OK | 200 | 成功 |
| NO_PLAN | 402 | プラン未設定 |
| DISABLED | 403 | 機能無効 |
| EXCEEDED | 429 | クォータ超過 |
| FORBIDDEN | 403 | 権限なし |
| NOT_FOUND | 404 | 対象不存在 |
| INVALID_ARG | 400 | 引数不正 |
| ERROR | 500 | 内部エラー |

| # | 確認事項 | Yes/No |
|---|----------|--------|
| 3.1 | DB側の `code` 返却値は上記のいずれかに該当するか？ | |
| 3.2 | DB側で返す可能性のある `code` で上記リストに含まれないものはあるか？ | |

**上記以外の `code` があれば記載**:
```
（DB側記入欄）
```

### 4. site_admin 判定

| # | 確認事項 | Yes/No |
|---|----------|--------|
| 4.1 | `is_site_admin()` は `site_admins` テーブルを参照しているか？ | |
| 4.2 | `site_admins` テーブルは `user_id uuid PRIMARY KEY` を持つか？ | |

**不足点があれば記載**:
```
（DB側記入欄）
```

---

## 回答フォーマット

以下の形式で回答をお願いします：

```markdown
## 回答（YYYY-MM-DD）

### 1. get_effective_feature_set
- 1.1: Yes / No
- 1.2: Yes / No
- 1.3: Yes / No（形式: ○○）
- 1.4: Yes / No
- 1.5: Yes / No（方式: RLS / SECURITY DEFINER）

不足点: なし / ある場合は具体的に

### 2. check_and_consume_quota
- 2.1: Yes / No
- 2.2: Yes / No
- 2.3: Yes / No（挙動: ○○）
- 2.4: Yes / No
- 2.5: Yes / No（方式: RLS / SECURITY DEFINER）

不足点: なし / ある場合は具体的に

### 3. code 整合性
- 3.1: Yes / No
- 3.2: Yes / No

追加 code: なし / ある場合はリスト

### 4. site_admin
- 4.1: Yes / No
- 4.2: Yes / No

不足点: なし / ある場合は具体的に

### 次のアクション
- [ ] アプリ側で対応が必要な項目
- [ ] DB側で対応が必要な項目
```

---

## 補足: アプリ側のフォールバック実装

RPCが存在しない場合（エラーコード `42883`）、アプリ側は以下のフォールバックを実行します：

1. **get_effective_feature_set** → レガシー `get_effective_feature_set(p_user_id, p_org_id)` を呼び出し
2. **check_and_consume_quota** → レガシー `check_and_consume_quota(p_user, p_feature_key, p_amount, p_org_id)` を呼び出し

このフォールバックが動作している場合、新RPCは未実装と判断できます。

---

## 関連ファイル（参照用）

- `src/lib/featureGate.ts` - FeatureGate実装（Subject型API）
- `src/lib/billing/index.ts` - 課金モジュール（エクスポート）
- `src/app/api/my/faqs/route.ts` - 実使用例（FAQ作成）
- `docs/plans-architecture.md` - プラン・機能アーキテクチャ仕様
