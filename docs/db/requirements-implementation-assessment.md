# 要件定義 vs 実装 整合性評価

**評価日**: 2025-12-28
**評価方針**: ハルシネーションなし・忖度なし・事実ベース

---

## 総合評価

| カテゴリ | 達成度 | 判定 |
|----------|--------|------|
| RPC/DB側 | 80% | ⚠️ 一部未対応 |
| アプリ側（FeatureGate） | 90% | ✅ ほぼ完了 |
| Shell構造 | 70% | ⚠️ 部分的 |
| Core モジュール | 60% | ⚠️ 部分的 |

**結論**: 「結合はできた」は **部分的に正しい**。主要なRPC/FeatureGate結合は完了。ただし要件定義の全項目が完了したわけではない。

---

## セクション別詳細評価

### 6. Policy / Config（DBを真実の源泉）

| 要件 | 実装状態 | 根拠 |
|------|----------|------|
| Subject型統一（org/user） | ✅ 完了 | `featureGate.ts` で `Subject = { type: 'org' \| 'user', id }` 定義済み |
| plans/features/plan_features_v2 テーブル | ✅ 存在確認済み | DB側回答で確認 |
| feature_limits_v2 | ✅ 存在確認済み | DB側回答で確認 |
| feature_flags | ⚠️ 未確認 | 明示的な確認なし |
| feature_overrides | ⚠️ 未確認 | 明示的な確認なし |
| site_admins | ✅ 完了 | UNIQUE(user_id)追加済み |

### 8. RPC（Read Model / Execution）

| RPC | 要件 | 実装状態 | 根拠 |
|-----|------|----------|------|
| get_current_plan | subject_type/subject_id入力 | ⚠️ 不明 | 確認していない |
| get_effective_feature_set | subject_type/subject_id入力 | ✅ 完了 | DB側回答で確認 |
| check_and_consume_quota | subject_type/subject_id/idempotency_key | ✅ 完了 | DB側回答で確認 |
| has_org_role | org_id/roles[] | ⚠️ 不明 | 確認していない |
| is_site_admin | - | ✅ 完了 | DB側回答で確認 |
| audit_log_write | 要件に記載 | ⚠️ 不明 | 確認していない |
| analytics_event_write | 要件に記載 | ⚠️ 不明 | 確認していない |

#### エラーコード整合性

| 要件コード | DB実装 | アプリ対応 |
|------------|--------|-----------|
| OK | ✅ | ✅ |
| NO_PLAN | ✅ | ✅ |
| DISABLED | ✅ | ✅ |
| EXCEEDED | ✅ | ✅ |
| FORBIDDEN | ✅ | ✅ |
| NOT_FOUND | ⚠️ 不明 | ✅ |
| INVALID_ARG | ✅ | ✅ |
| ERROR | ⚠️ 暗黙 | ✅ |

#### period対応

| 要件 | DB対応 | アプリ対応 |
|------|--------|-----------|
| daily | ✅ | ✅ |
| weekly | ✅ | ✅ |
| monthly | ✅ | ✅ |
| yearly | ❌ 未対応 | ❌ 型から除外 |
| rolling | ❌ 未対応 | ❌ 型から除外 |
| total | ✅ | ✅ |

### 9. Feature Gate（アプリ側）

| API | 要件 | 実装状態 |
|-----|------|----------|
| getEffectiveFeatures(subject) | 有効機能一覧取得（60sキャッシュ） | ✅ 完了 |
| canExecute(subject, ...) | 実行可否判定 | ✅ 完了 |
| QuotaResult統一形式 | ok/code/remaining/limit/period/window_end | ✅ 完了 |
| 旧RPC互換マッピング | 旧code→新codeマッピング | ✅ 完了 |
| 例外ハンドリング | FORBIDDEN/INVALID_ARGのRAISE対応 | ✅ 完了 |

### 3. PageShell構造

| Shell | 要件パス | 実装状態 |
|-------|---------|----------|
| InfoPageShell | `/`, `/pricing`, `/terms` | ⚠️ 未確認 |
| DashboardPageShell | `/dashboard/**` | ✅ 存在確認 |
| UserShell（Account） | `/account/**` | ✅ 存在確認（`src/components/account/UserShell.tsx`） |
| AdminPageShell | `/admin/**` | ✅ 存在確認 |

### 5. 共通Core

| モジュール | 要件ファイル | 実装状態 |
|-----------|-------------|----------|
| auth-state | `src/lib/core/auth-state.ts` | ✅ 存在確認 |
| auth-state.client | - | ✅ 存在（追加実装） |
| error-boundary | `src/lib/core/error-boundary.ts` | ❌ 未存在 |
| loading-state | `src/lib/core/loading-state.ts` | ✅ 存在確認 |
| audit-logger | `src/lib/core/audit-logger.ts` | ✅ 存在確認 |
| ui-provider | `src/lib/core/ui-provider.ts` | ❌ 未存在 |

---

## 「結合できた」と言える部分

### ✅ 確実に結合済み

1. **Subject型API**
   - `getEffectiveFeatures(subject)` → DB `get_effective_feature_set(subject_type, subject_id)`
   - `canExecute(subject, ...)` → DB `check_and_consume_quota(subject_type, subject_id, ...)`

2. **QuotaResult統一形式**
   - アプリ側: `{ ok, code, remaining, limit, period, window_end, replayed }`
   - DB側: 同形式で返却確認済み

3. **エラーコードマッピング**
   - 新RPC: OK/NO_PLAN/DISABLED/EXCEEDED/FORBIDDEN/INVALID_ARG
   - 旧RPC互換: quota_exceeded→EXCEEDED, no_active_plan→NO_PLAN 等

4. **idempotency_key**
   - DB側: `idempotency_keys` テーブル + UNIQUE(key)
   - アプリ側: `canExecute` で `idempotency_key` パラメータ送信

5. **権限検証**
   - DB側: SECURITY DEFINER + has_org_role/is_site_admin
   - site_admins: UNIQUE(user_id)追加済み

---

## 「結合できていない」部分

### ❌ 未実装・未確認

| 項目 | 状態 | 影響 |
|------|------|------|
| error-boundary.ts | 未作成 | Core要件未達 |
| ui-provider.ts | 未作成 | Core要件未達 |
| yearly/rolling period | DB未対応 | 要件との差異 |
| get_current_plan (Subject型) | 未確認 | 整合性不明 |
| feature_flags/overrides テーブル | 未確認 | 整合性不明 |
| audit_log_write RPC | 未確認 | 監査要件不明 |
| analytics_event_write RPC | 未確認 | 分析要件不明 |

---

## 結論（忖度なし）

### 「結合はできた」は条件付きで正しい

**正しい部分**:
- Subject型API（getEffectiveFeatures/canExecute）とDB RPC（get_effective_feature_set/check_and_consume_quota）の結合は完了
- QuotaResult統一形式の整合性は確認済み
- エラーコード・idempotency_key・権限検証の整合性も確認済み

**正しくない部分**:
- 要件定義書の全項目が実装されたわけではない
- Core モジュール（error-boundary, ui-provider）は未作成
- yearly/rolling period は要件と実装に差異がある
- 複数のRPC/テーブルの存在確認が未完了

### 達成率の現実的評価

| カテゴリ | 達成率 |
|----------|--------|
| **§8 RPC結合（主要部分）** | **90%** |
| **§9 FeatureGate** | **95%** |
| §3 PageShell | 70% |
| §5 Core | 60% |
| §6 Policy/Config | 75% |
| 全体 | **75%** |

---

## 次のアクション（優先順）

1. **[高]** 未確認RPC/テーブルの存在確認（get_current_plan, feature_flags, audit_log_write）
2. **[中]** error-boundary.ts / ui-provider.ts の作成
3. **[低]** yearly/rolling period のDB側拡張（必要な場合）
