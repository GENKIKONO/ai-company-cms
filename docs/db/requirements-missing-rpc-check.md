# DB側 未確認RPC/テーブル 確認依頼

**作成日**: 2025-12-28
**目的**: 要件定義 v1.0 で規定されているがDB側実装が未確認のRPC/テーブルの存在確認

---

## 確認方法

Supabase Dashboard で以下を確認してください：

1. **Database > Functions** で関数一覧を確認
2. **Table Editor** でテーブル一覧を確認
3. 各項目について Yes/No で回答

---

## 確認項目

### 1. get_current_plan（Subject型）

**要件**: §8.2

| # | 確認事項 | Yes/No |
|---|----------|--------|
| 1.1 | `public.get_current_plan(subject_type text, subject_id uuid)` が存在するか？ | |
| 1.2 | 返却に `plan_id`, `plan_key`, `plan_meta` を含むか？ | |
| 1.3 | SECURITY DEFINER で権限検証しているか？ | |

**備考**:
```
（DB側記入欄）
```

---

### 2. audit_log_write

**要件**: §8.5, §12.2

| # | 確認事項 | Yes/No |
|---|----------|--------|
| 2.1 | `public.audit_log_write(action, entity_type, entity_id, context, diff)` が存在するか？ | |
| 2.2 | `admin_audit_logs` または `audit_logs` テーブルが存在するか？ | |
| 2.3 | actor_user_id は `auth.uid()` から自動取得されるか？ | |

**備考**:
```
（DB側記入欄）
```

---

### 3. analytics_event_write

**要件**: §8.5, §12.1

| # | 確認事項 | Yes/No |
|---|----------|--------|
| 3.1 | `public.analytics_event_write(event_key, properties, context)` が存在するか？ | |
| 3.2 | `analytics_events` テーブルが存在するか？ | |
| 3.3 | INSERT-only制約が設定されているか？ | |

**備考**:
```
（DB側記入欄）
```

---

### 4. feature_flags テーブル

**要件**: §6.2

| # | 確認事項 | Yes/No |
|---|----------|--------|
| 4.1 | `public.feature_flags` テーブルが存在するか？ | |
| 4.2 | カラムに `subject_type`, `subject_id`, `feature_key`, `is_enabled` を含むか？ | |
| 4.3 | RLSが有効で適切なポリシーが設定されているか？ | |

**備考**:
```
（DB側記入欄）
```

---

### 5. feature_overrides テーブル

**要件**: §6.2

| # | 確認事項 | Yes/No |
|---|----------|--------|
| 5.1 | `public.feature_overrides` テーブルが存在するか？ | |
| 5.2 | カラムに `subject_type`, `subject_id`, `feature_key`, `override_config` を含むか？ | |
| 5.3 | RLSが有効で適切なポリシーが設定されているか？ | |

**備考**:
```
（DB側記入欄）
```

---

## 回答フォーマット

```markdown
## 回答（YYYY-MM-DD）

### 1. get_current_plan
- 1.1: Yes / No
- 1.2: Yes / No
- 1.3: Yes / No
備考:

### 2. audit_log_write
- 2.1: Yes / No
- 2.2: Yes / No
- 2.3: Yes / No
備考:

### 3. analytics_event_write
- 3.1: Yes / No
- 3.2: Yes / No
- 3.3: Yes / No
備考:

### 4. feature_flags
- 4.1: Yes / No
- 4.2: Yes / No
- 4.3: Yes / No
備考:

### 5. feature_overrides
- 5.1: Yes / No
- 5.2: Yes / No
- 5.3: Yes / No
備考:
```

---

## アプリ側の対応状況

アプリ側では以下の安全ラッパを実装済みです：

| RPC/テーブル | ラッパ関数 | 未存在時の挙動 |
|-------------|-----------|----------------|
| get_current_plan | `getCurrentPlanSafe()` | null を返す |
| audit_log_write | `auditLogWriteSafe()` | false を返す（ログ書き込み失敗） |
| analytics_event_write | `analyticsEventWriteSafe()` | false を返す（イベント書き込み失敗） |
| feature_flags | `getFeatureFlagsSafe()` | 空配列を返す |
| feature_overrides | `getFeatureOverridesSafe()` | null を返す |

**実装ファイル**: `src/lib/core/db-safe-wrappers.ts`

これらのラッパは、DB側のRPC/テーブルが存在しなくても致命傷にならない設計です。
DB側で実装が確認された場合、追加の対応なしで機能が有効になります。

---

## 参照

- 要件定義: AIOHub システム要件定義書 v1.0
- アプリ側ラッパ: `src/lib/core/db-safe-wrappers.ts`
- Core エクスポート: `src/lib/core/index.ts`
