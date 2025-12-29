# Core コンポーネント使用ガイド

**更新日**: 2025-12-28

---

## ErrorBoundary

### 正本

**`@/lib/core/error-boundary`** → 実装は `AppErrorBoundary` に委譲

### 使い分け

| 用途 | コンポーネント | import元 |
|------|---------------|----------|
| 汎用/root | `ErrorBoundary` | `@/lib/core/error-boundary` |
| Dashboard専用 | `DashboardErrorBoundary` | `@/components/dashboard/DashboardErrorBoundary` |

### 使用箇所

- `src/app/layout.tsx` - root layout でアプリ全体をラップ

### 既存実装との関係

| ファイル | 状態 |
|----------|------|
| `src/lib/core/error-boundary.tsx` | **正本**（AppErrorBoundaryへの委譲） |
| `src/components/common/AppErrorBoundary.tsx` | 実装本体（Phase 4監視機能付き） |
| `src/components/dashboard/DashboardErrorBoundary.tsx` | Dashboard専用（StandardError対応） |
| `src/components/ErrorBoundary.tsx` | レガシー（errorMonitor連携） |

---

## UIProvider

### 正本

**`@/lib/core/ui-provider`**

### 現状の位置づけ

**将来用のUI統一基盤**として用意。現時点では：

- Toast: 既存の `ToastProvider` (`@/components/ui/toast`) を使用
- Modal: 各コンポーネントで個別管理
- Theme: 将来対応（現状はCSS変数で管理）

### 二重Provider回避

`UIProvider` と `ToastProvider` は**異なるContext**であり、二重Providerではない。

```tsx
// src/app/layout.tsx
<UIProvider>      {/* テーマ/将来機能用 */}
  <ToastProvider> {/* Toast表示用 */}
    ...
  </ToastProvider>
</UIProvider>
```

### 使い分け

| 用途 | hook | import元 |
|------|------|----------|
| Toast表示 | `useToast()` | `@/components/ui/toast` |
| テーマ/将来機能 | `useUI()` | `@/lib/core` |

### 利用状況

- `useUI()` の利用箇所: **0件**（将来用）
- `useToast()` の利用箇所: 既存アプリ全体

---

## db-safe-wrappers

### 正本

**`@/lib/core/db-safe-wrappers`**

### 用途

DB側RPCが未確認/未実装でも致命傷にならない安全なラッパ関数。

### 実使用箇所

- `src/app/admin/db-inventory/page.tsx:141`
  - `getFeatureFlagsSafe()` - feature_flags読み取り（read-only）

**注意**: `/admin/db-inventory` は完全にread-only。write呼び出しは禁止。

### 関数一覧

| 関数 | 未存在時の挙動 | 使用状況 |
|------|----------------|----------|
| `getCurrentPlanSafe()` | null返却 | 未使用（将来用） |
| `auditLogWriteSafe()` | false返却 | 未使用（将来用） |
| `analyticsEventWriteSafe()` | false返却 | 未使用（将来用） |
| `getFeatureFlagsSafe()` | 空配列返却 | **使用中** |
| `getFeatureOverridesSafe()` | null返却 | 未使用（将来用） |

---

## 参照

- 要件定義: AIOHub システム要件定義書 v1.0
- DB確認テンプレ: `docs/db/requirements-missing-rpc-check.md`
