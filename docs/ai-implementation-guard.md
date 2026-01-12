# AI実装ガード プロンプト

> **目的**: AIが直書き・端折りをせず、既存のアーキテクチャとデザインシステムに忠実に実装するためのガイド

---

## 使用方法

重要な実装タスクの前にこのファイルの内容を参照させてください。

---

## 1. 最優先参照ファイル（実装前に必ず読む）

| ファイル | 内容 | 参照タイミング |
|---------|------|---------------|
| `CLAUDE.md` | プロジェクト全体の指示 | 全タスク開始時 |
| `DESIGN_SYSTEM.md` | UI/デザイン規約 | UI変更時 |
| `docs/core-architecture.md` | 4領域アーキテクチャ | ページ/API作成時 |
| `src/styles/app-design-tokens.css` | CSS変数一覧 | スタイル指定時 |

---

## 2. 領域別 参照ファイル

### Dashboard領域 (`/dashboard/**`)

| ファイル | 用途 |
|---------|------|
| `src/components/dashboard/ui/DashboardButton.tsx` | ボタン実装パターン |
| `src/components/dashboard/ui/DashboardCard.tsx` | カード実装パターン |
| `src/components/dashboard/ui/DashboardBadge.tsx` | バッジ実装パターン |
| `src/components/dashboard/ui/DashboardAlert.tsx` | アラート実装パターン |
| `src/components/dashboard/ui/DashboardInput.tsx` | 入力フォーム実装パターン |
| `src/components/dashboard/ui/index.tsx` | エクスポート一覧 |
| `src/config/data-sources.ts` | データソース設定 |

### Public領域 (`/`, `/pricing`, `/o/[slug]` 等)

| ファイル | 用途 |
|---------|------|
| `src/components/ui/HIGButton.tsx` | ボタン |
| `src/components/layout/AioSection.tsx` | セクション |

### DB/API

| ファイル | 用途 |
|---------|------|
| `src/types/supabase.ts` | Supabase自動生成型 |
| `src/types/database.types.ts` | DB型定義 |
| `src/types/legacy/database.ts` | レガシー型（互換用） |
| `src/config/data-sources.ts` | テーブル/ビュー/カラム設定 |

---

## 3. 禁止事項チェックリスト

実装前に以下を自己確認すること：

### スタイル
- [ ] **色の直書き禁止**
  - NG: `text-red-600`, `bg-blue-500`, `hover:bg-gray-100`
  - OK: `text-[var(--aio-danger)]`, `bg-[var(--aio-primary)]`, `hover:bg-[var(--aio-muted)]`

### コンポーネント
- [ ] **既存コンポーネント確認**
  - 新規作成前に `src/components/dashboard/ui/` の既存コンポーネントを確認
  - `DashboardButton`, `DashboardCard`, `DashboardBadge` 等が使えないか検討

### 領域違反
- [ ] **領域を跨いだコンポーネント使用禁止**
  - Dashboard領域で `HIGButton` 使用 → NG
  - Public領域で `DashboardCard` 使用 → NG

### DB/型
- [ ] **型の確認**
  - `supabase.ts` の自動生成型とカラム名が一致しているか
  - ビューとテーブルでカラム名が異なる場合あり（例: `name` vs `title`）

- [ ] **セキュアビュー使用**
  - Dashboard GET操作は `v_dashboard_*_secure` ビュー経由
  - 書き込みは `writeTable` 設定のベーステーブルへ

---

## 4. 実装手順

```
1. 参照   → 該当ファイルをReadツールで読む
2. 確認   → 既存の類似実装パターンを探す
3. 質問   → 不明点は実装前にユーザーに確認
4. 実装   → 参照した内容に忠実に実装
5. 検証   → npm run typecheck で型エラー確認
```

---

## 5. Tailwind直書き → CSS変数 マッピング表

### テキスト色

| Tailwind直書き | CSS変数 |
|---------------|---------|
| `text-gray-900` | `text-[var(--color-text-primary)]` |
| `text-gray-700`, `text-gray-600` | `text-[var(--color-text-secondary)]` |
| `text-gray-500` | `text-[var(--color-text-tertiary)]` |
| `text-gray-400` (アイコン) | `text-[var(--color-icon-muted)]` |
| `text-red-600`, `text-red-800` | `text-[var(--aio-danger)]` |
| `text-green-600`, `text-green-800` | `text-[var(--aio-success)]` |
| `text-yellow-600`, `text-yellow-800` | `text-[var(--aio-warning)]` |
| `text-blue-600`, `text-blue-800` | `text-[var(--aio-info)]` |
| `text-orange-600`, `text-orange-800` | `text-[var(--aio-pending)]` |
| `text-purple-600` | `text-[var(--aio-purple)]` |
| `text-indigo-600` | `text-[var(--aio-indigo)]` |

### 背景色

| Tailwind直書き | CSS変数 |
|---------------|---------|
| `bg-gray-50`, `bg-gray-100` | `bg-[var(--aio-surface)]` |
| `bg-gray-200` (スケルトン等) | `bg-[var(--dashboard-card-border)]` |
| `bg-white` | `bg-[var(--dashboard-card-bg)]` |
| `bg-red-50`, `bg-red-100` | `bg-[var(--aio-danger-muted)]` |
| `bg-green-50`, `bg-green-100` | `bg-[var(--aio-success-muted)]` |
| `bg-yellow-50`, `bg-yellow-100` | `bg-[var(--aio-warning-muted)]` |
| `bg-blue-50`, `bg-blue-100` | `bg-[var(--aio-info-muted)]` |
| `bg-orange-50`, `bg-orange-100` | `bg-[var(--aio-pending-muted)]` |
| `bg-purple-50`, `bg-purple-100` | `bg-[var(--aio-purple-muted)]` |
| `bg-indigo-50`, `bg-indigo-100` | `bg-[var(--aio-indigo-muted)]` |

### ボーダー色

| Tailwind直書き | CSS変数 |
|---------------|---------|
| `border-gray-200` | `border-[var(--dashboard-card-border)]` |
| `border-gray-300` | `border-[var(--input-border)]` |
| `border-red-200` | `border-[var(--status-error)]` |
| `border-green-200` | `border-[var(--status-success)]` |
| `border-yellow-200` | `border-[var(--status-warning)]` |
| `border-orange-200` | `border-[var(--aio-pending-border)]` |

### ホバー状態

| Tailwind直書き | CSS変数 |
|---------------|---------|
| `hover:bg-gray-50` | `hover:bg-[var(--aio-surface)]` |
| `hover:bg-gray-100` | `hover:bg-[var(--table-row-hover)]` |
| `hover:text-gray-700` | `hover:text-[var(--color-text-secondary)]` |

---

## 6. 使用可能なCSS変数（完全版）

### Core Brand
```css
--aio-primary          /* メインカラー（青） */
--aio-primary-hover    /* ホバー状態 */
--aio-surface          /* 背景面（グレー） */
--aio-muted            /* 軽いグレー */
```

### テキスト・アイコン
```css
--color-text-primary   /* 本文テキスト */
--color-text-secondary /* 補足テキスト */
--color-text-tertiary  /* 薄いテキスト */
--color-icon           /* 通常アイコン */
--color-icon-muted     /* 薄いアイコン */
```

### ステータス色（明るい - インジケーター用）
```css
--status-success       /* 成功（緑） */
--status-success-bg    /* 成功背景 */
--status-warning       /* 警告（黄） */
--status-warning-bg    /* 警告背景 */
--status-error         /* エラー（赤） */
--status-error-bg      /* エラー背景 */
--status-info          /* 情報（青） */
--status-info-bg       /* 情報背景 */
--status-pending       /* 保留（橙） */
--status-pending-bg    /* 保留背景 */
```

### セマンティック色（暗い - テキスト/バッジ用）
```css
--aio-success          /* 成功テキスト（緑） */
--aio-success-muted    /* 成功背景 */
--aio-warning          /* 警告テキスト（黄） */
--aio-warning-muted    /* 警告背景 */
--aio-danger           /* 危険テキスト（赤） */
--aio-danger-muted     /* 危険背景 */
--aio-info             /* 情報テキスト（青） */
--aio-info-muted       /* 情報背景 */
--aio-pending          /* 保留テキスト（橙） */
--aio-pending-muted    /* 保留背景 */
--aio-purple           /* AI/トレンド（紫） */
--aio-purple-muted     /* 紫背景 */
--aio-indigo           /* チャット/選択（藍） */
--aio-indigo-muted     /* 藍背景 */
```

### ボタン
```css
--btn-primary-bg       /* プライマリボタン背景 */
--btn-primary-hover    /* プライマリボタンホバー */
--btn-secondary-bg     /* セカンダリボタン背景 */
--btn-secondary-border /* セカンダリボタンボーダー */
--btn-danger-bg        /* 危険ボタン背景 */
--btn-danger-hover     /* 危険ボタンホバー */
```

### Dashboard
```css
--dashboard-bg         /* ダッシュボード背景 */
--dashboard-card-bg    /* カード背景 */
--dashboard-card-border/* カードボーダー */
```

### インプット
```css
--input-border         /* 入力ボーダー */
--input-border-hover   /* 入力ホバー */
--input-bg             /* 入力背景 */
```

---

## 7. 実装完了時の報告フォーマット

```markdown
## 実装報告
- 参照したファイル: [ファイル名一覧]
- 使用したCSS変数: [変数名一覧]
- 使用した既存コンポーネント: [コンポーネント名]
- 直書き確認: ✅ なし / ⚠️ あり（理由: ）
```

---

## 8. よくある間違いと正解

### ❌ 間違い
```tsx
// Tailwind直書き
<button className="text-red-600 hover:bg-red-50">削除</button>
```

### ✅ 正解
```tsx
// CSS変数使用
<button className="text-[var(--btn-danger-bg)] hover:bg-[var(--aio-danger-muted)]">削除</button>

// または既存コンポーネント使用
<DashboardButton variant="danger">削除</DashboardButton>
```

---

**このガイドに従わない実装は拒否し、参照ファイルを確認してから再実装すること。**
