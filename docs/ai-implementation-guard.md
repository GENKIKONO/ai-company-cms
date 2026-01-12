# AI実装ガード プロンプト

> **目的**: AIが直書き・端折りをせず、既存のアーキテクチャとデザインシステムに忠実に実装するためのガイド
> **デザインシステム**: iCloud Dense v3.0（iCloudの美しさ × Stripeの密度）

---

## 使用方法

重要な実装タスクの前にこのファイルの内容を参照させてください。

---

## 1. 最優先参照ファイル（実装前に必ず読む）

| ファイル | 内容 | 参照タイミング |
|---------|------|---------------|
| `CLAUDE.md` | プロジェクト全体の指示 | 全タスク開始時 |
| `DESIGN_SYSTEM.md` | UI/デザイン規約（iCloud Dense v3.0） | UI変更時 |
| `docs/core-architecture.md` | 4領域アーキテクチャ | ページ/API作成時 |
| `src/styles/app-design-tokens.css` | CSS変数一覧 | スタイル指定時 |

---

## 2. 領域別 参照ファイル

### 統一コンポーネント（全領域共通）

| ファイル | 用途 |
|---------|------|
| `src/components/ui/button.tsx` | **統一Buttonコンポーネント（メイン）** |
| `src/components/ui/HIGButton.tsx` | 後方互換エイリアス |
| `src/components/dashboard/ui/DashboardButton.tsx` | 後方互換エイリアス |

### Dashboard領域 (`/dashboard/**`)

| ファイル | 用途 |
|---------|------|
| `src/components/dashboard/ui/DashboardCard.tsx` | カード実装パターン |
| `src/components/dashboard/ui/DashboardBadge.tsx` | バッジ実装パターン |
| `src/components/dashboard/ui/DashboardAlert.tsx` | アラート実装パターン |
| `src/components/dashboard/ui/DashboardInput.tsx` | 入力フォーム実装パターン |
| `src/components/dashboard/ui/index.tsx` | エクスポート一覧 |
| `src/config/data-sources.ts` | データソース設定 |

### Public領域 (`/`, `/pricing`, `/o/[slug]` 等)

| ファイル | 用途 |
|---------|------|
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
- [ ] **統一Buttonを使用**
  - 全ページで `Button` from `@/components/ui/button` を使用
  - HIGButton/DashboardButtonは後方互換エイリアス（内部は統一Button）

- [ ] **既存コンポーネント確認**
  - 新規作成前に `src/components/dashboard/ui/` の既存コンポーネントを確認
  - `DashboardCard`, `DashboardBadge` 等が使えないか検討

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
--aio-primary          /* メインカラー（Apple Blue #007AFF） */
--aio-primary-hover    /* ホバー状態 */
--aio-surface          /* 背景面（Apple Gray #F5F5F7） */
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

### ボタン（iCloud Dense）
```css
--btn-primary-bg       /* プライマリボタン背景 */
--btn-primary-hover    /* プライマリボタンホバー */
--btn-secondary-bg     /* セカンダリボタン背景 */
--btn-secondary-border /* セカンダリボタンボーダー */
--btn-danger-bg        /* 危険ボタン背景 */
--btn-danger-hover     /* 危険ボタンホバー */
--btn-shadow           /* ボタンシャドウ */
--btn-shadow-hover     /* ボタンホバーシャドウ */
--btn-height-sm        /* 32px */
--btn-height-md        /* 36px */
--btn-height-lg        /* 40px */
--btn-height-xl        /* 44px */
```

### Dashboard
```css
--dashboard-bg         /* ダッシュボード背景（Apple Gray） */
--dashboard-card-bg    /* カード背景 */
--dashboard-card-border/* カードボーダー（繊細） */
--dashboard-card-shadow/* カードシャドウ（iCloud品質） */
```

### インプット
```css
--input-border         /* 入力ボーダー */
--input-border-hover   /* 入力ホバー */
--input-bg             /* 入力背景 */
```

### スペーシング（iCloud Dense - コンパクト8ptグリッド）
```css
--space-xs             /* 4px */
--space-sm             /* 8px */
--space-md             /* 12px（密度向上） */
--space-lg             /* 16px（密度向上） */
--space-xl             /* 24px（密度向上） */
--space-2xl            /* 32px（密度向上） */
```

---

## 7. 統一Buttonの使用方法

### 基本使用

```tsx
import { Button } from '@/components/ui/button';

// variant: primary | secondary | tertiary | danger | ghost | outline | link
// size: sm | md | lg | xl | icon
<Button variant="primary" size="md">保存</Button>
<Button variant="secondary">キャンセル</Button>
<Button variant="danger">削除</Button>
```

### 追加機能

```tsx
// ローディング状態
<Button variant="primary" loading={isSubmitting}>送信中...</Button>

// アイコン付き
<Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>新規作成</Button>
<Button variant="secondary" rightIcon={<ArrowRight className="w-4 h-4" />}>次へ</Button>

// アイコンのみ
import { IconButton } from '@/components/ui/button';
<IconButton icon={<Edit className="w-4 h-4" />} aria-label="編集" />

// ボタングループ
import { ButtonGroup } from '@/components/ui/button';
<ButtonGroup>
  <Button variant="secondary">戻る</Button>
  <Button variant="primary">次へ</Button>
</ButtonGroup>

// リンクボタン
import { LinkButton } from '@/components/ui/button';
<LinkButton href="/dashboard" variant="tertiary">ダッシュボードへ</LinkButton>
```

---

## 8. 実装完了時の報告フォーマット

```markdown
## 実装報告
- 参照したファイル: [ファイル名一覧]
- 使用したCSS変数: [変数名一覧]
- 使用した既存コンポーネント: [コンポーネント名]
- 直書き確認: なし / あり（理由: ）
```

---

## 9. よくある間違いと正解

### ボタン実装

```tsx
// NG: Tailwind直書き
<button className="text-red-600 hover:bg-red-50">削除</button>

// NG: 独自ボタン作成
<MyCustomButton>削除</MyCustomButton>

// OK: 統一Button使用
import { Button } from '@/components/ui/button';
<Button variant="danger">削除</Button>

// OK: 後方互換エイリアス（既存コードはそのまま動作）
import { DashboardButton } from '@/components/dashboard/ui/DashboardButton';
<DashboardButton variant="danger">削除</DashboardButton>
```

### カード実装

```tsx
// NG: 独自スタイル
<div className="bg-white border border-gray-200 rounded-lg shadow">

// OK: CSS変数 + 既存コンポーネント
import { DashboardCard } from '@/components/dashboard/ui';
<DashboardCard title="タイトル">コンテンツ</DashboardCard>

// または
<div className="bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)] rounded-lg shadow-[var(--dashboard-card-shadow)]">
```

---

## 10. Dashboard認証アーキテクチャ

### 認証の責務分担

| レイヤー | ファイル | 責務 |
|---------|----------|------|
| Middleware | `src/middleware.ts` | **主認証ゲート** - 未認証ユーザーをログインへリダイレクト |
| Layout | `src/app/dashboard/layout.tsx` | **UIシェル提供のみ** - 認証チェックは行わない |
| Page Shell | `DashboardPageShell` | **ページレベル認証** - 組織・権限チェック |

### 重要な注意点

```tsx
// NG: Layoutで認証リダイレクト（クライアントナビゲーション時に問題発生）
export default async function DashboardLayout({ children }) {
  const user = await getServerUser();
  if (!user) {
    redirect('/auth/login'); // ← これがNavigation時にリダイレクトループを引き起こす
  }
  return <Layout>{children}</Layout>;
}

// OK: Middlewareに認証を任せ、Layoutは表示のみ
export default async function DashboardLayout({ children }) {
  // 認証チェックはMiddlewareが担当
  // Layoutは表示用データのみ取得（失敗してもエラーにしない）
  let accountStatus = 'active';
  try {
    const user = await getUser();
    if (user) {
      accountStatus = await getAccountStatus(user.id);
    }
  } catch {
    // Silent fail - Middleware handles auth
  }
  return <Layout accountStatus={accountStatus}>{children}</Layout>;
}
```

### Dashboardページの'use client'ルール

```tsx
// NG: サーバーコンポーネントからクライアントコンポーネントに関数を渡す
// page.tsx (サーバーコンポーネント)
export default function DashboardPage() {
  return (
    <DashboardPageShell
      onError={(ctx) => <ErrorUI user={ctx.user} />} // ← 関数は渡せない
    >
      <Content />
    </DashboardPageShell>
  );
}

// OK: 'use client'を追加して関数を渡せるようにする
'use client';
export default function DashboardPage() {
  return (
    <DashboardPageShell
      onError={(ctx) => <ErrorUI user={ctx.user} />} // ← OK
    >
      <Content />
    </DashboardPageShell>
  );
}
```

### DashboardPageShellでのリダイレクト禁止

```tsx
// NG: クライアントコンポーネント内で認証失敗時にリダイレクト
// → クライアントナビゲーション時のCookie同期遅延でリダイレクトループが発生
if (!currentUser) {
  router.push('/auth/login'); // ← NG: リダイレクトループの原因
  return;
}

// OK: エラー表示にしてユーザーに再読み込みを促す
// → Middlewareが認証を担当。Shell内ではリダイレクトしない
if (!currentUser) {
  setError('認証情報の取得に失敗しました。ページを再読み込みしてください。');
  return;
}
```

**重要**: `DashboardPageShell` 内で `router.push('/auth/login')` を**絶対に使わない**。Middlewareが認証リダイレクトの唯一の責任者。

---

**このガイドに従わない実装は拒否し、参照ファイルを確認してから再実装すること。**
