# RPC状態確認結果（確定）

**確認日**: 2025-12-28
**状態**: 全RPC存在確認済み

---

## 1. get_effective_feature_set

| # | 確認事項 | 結果 |
|---|----------|------|
| 1.1 | RPC存在 | **Yes** |
| 1.2 | 返却形式 | **Yes** |
| 1.3 | limits形式 | **Yes**（配列形式） |
| 1.4 | orgプラン対応 | **Yes** |
| 1.5 | 権限検証 | **Yes**（SECURITY DEFINER） |

### シグネチャ
```sql
public.get_effective_feature_set(subject_type text, subject_id uuid)
RETURNS TABLE(
  feature_id uuid,
  feature_key text,
  is_enabled boolean,      -- ※ enabled ではなく is_enabled
  effective_config jsonb,
  limits jsonb             -- 配列形式: [{ limit_key, period, limit_value, reset_day }]
)
SECURITY DEFINER STABLE
```

### 認可ロジック
- `subject_type='org'` → `has_org_role(...)` で検証
- `subject_type='user'` → `auth.uid()` 一致 or `is_site_admin()`

### 注意点
- **例外をRAISEする**: `'FORBIDDEN'` / `'INVALID_ARG'`
- JSONエラーではなくPostgreSQL例外として返る
- **アプリ側で例外キャッチが必要**

---

## 2. check_and_consume_quota

| # | 確認事項 | 結果 |
|---|----------|------|
| 2.1 | RPC存在 | **Yes** |
| 2.2 | 返却形式 | **Yes** |
| 2.3 | idempotency対応 | **Yes** |
| 2.4 | 原子性 | **Yes** |
| 2.5 | 権限検証 | **Yes**（SECURITY DEFINER） |

### シグネチャ
```sql
public.check_and_consume_quota(
  subject_type text,
  subject_id uuid,
  feature_key text,
  limit_key text,
  amount integer,
  period text,
  idempotency_key text DEFAULT NULL
)
RETURNS jsonb
-- 返却例: { ok: true, code: 'OK', remaining: 5, limit: 10, window_end: '2025-01-01T00:00:00Z' }
-- 重複時: { ok: true, code: 'OK', replayed: true }
SECURITY DEFINER
```

### 対応period
| period | 対応 |
|--------|------|
| daily | Yes |
| weekly | Yes |
| monthly | Yes |
| total | Yes |
| yearly | **No（未対応）** |
| rolling | **No（未対応）** |

### 原子性
- `feature_usage_counters` テーブルに対して `FOR UPDATE` ロック
- 行確保 → ロック → 判定 → UPDATE の原子的フロー

---

## 3. code整合性

### 新RPC（Subject型）のcode
| code | 対応HTTPステータス | 状況 |
|------|-------------------|------|
| OK | 200 | 成功 |
| NO_PLAN | 402 | プラン未設定 |
| DISABLED | 403 | 機能無効 |
| EXCEEDED | 429 | クォータ超過 |
| FORBIDDEN | 403 | 権限なし |
| INVALID_ARG | 400 | 引数不正 |

### 旧RPC（互換性注意）
| 旧code | 新code相当 |
|--------|-----------|
| quota_exceeded | EXCEEDED |
| no_active_plan | NO_PLAN |
| feature_not_found | NOT_FOUND |
| invalid_amount | INVALID_ARG |
| unlimited | NO_LIMIT |
| status='limit_exceeded' | EXCEEDED |

---

## 4. site_admin

| # | 確認事項 | 結果 |
|---|----------|------|
| 4.1 | site_admins参照 | **Yes** |
| 4.2 | PK(user_id) | **No（未設定）** |

### 現状
```sql
CREATE TABLE public.site_admins (
  user_id uuid,
  role text DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
  -- ※ PRIMARY KEY / UNIQUE 制約なし
);
```

### 要対応（DB側）
- `UNIQUE(user_id)` または `PRIMARY KEY(user_id)` の追加推奨

---

## アクション一覧

### アプリ側（必須）

| # | タスク | 優先度 |
|---|--------|--------|
| A1 | `getEffectiveFeatures` で例外キャッチ追加（FORBIDDEN→403, INVALID_ARG→400） | 高 |
| A2 | `canExecute` の period を `daily/weekly/monthly/total` に限定 | 高 |
| A3 | 旧RPC code の互換マッピング維持 | 中 |

### DB側（推奨）

| # | タスク | 優先度 | 状態 |
|---|--------|--------|------|
| D1 | `site_admins` に UNIQUE(user_id) 追加 | 高 | **完了** (2025-12-28) |
| D2 | `feature_usage_counters` を関数外（マイグレーション）で作成 | 中 | **完了** (2025-12-28) |
| D3 | `yearly` / `rolling` period のサポート追加 | 低 | 未着手 |
| D4 | `idempotency_keys` の UNIQUE(key) 制約確認・追加 | 中 | **完了** (2025-12-28) |

### DB側追加対応（2025-12-28実施済み）

- `site_admins_user_id_key` UNIQUE制約追加
- `feature_usage_counters` テーブル作成（PK: subject_type, subject_id, feature_id, limit_key, period_start）
- `set_updated_at()` トリガ関数 + `trg_feature_usage_counters_updated_at` トリガ作成
- `idempotency_keys_key_key` UNIQUE制約追加

### 残タスク（任意）

- `check_and_consume_quota` 関数から `CREATE TABLE IF NOT EXISTS` DDLを削除（マイグレーション移管済みのため）

---

## 参照

- 依頼文: `docs/db/rpc-readmodel-check-request.md`
- 分析ドキュメント: `docs/db/rpc-status-analysis.md`
- FeatureGate実装: `src/lib/featureGate.ts`
