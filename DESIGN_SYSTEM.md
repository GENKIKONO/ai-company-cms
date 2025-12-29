# AIO Hub デザインシステム v2.0

> **最終更新:** 2024年12月
> **対象:** 開発者・AI・デザイナー全員必読

---

## 🎯 30秒でわかるデザインシステム

```
┌─────────────────────────────────────────────────────────────┐
│                    AIO Hub デザイン                          │
├─────────────────────────┬───────────────────────────────────┤
│   🌐 Public Pages       │   📊 Dashboard                    │
│   (お客様向けページ)      │   (管理画面)                       │
├─────────────────────────┼───────────────────────────────────┤
│   iCloud風ビジュアル     │   Stripe風操作性                   │
│   ・AioSection          │   ・DashboardCard                 │
│   ・HIGButton           │   ・DashboardButton               │
│   ・aio-surface         │   ・DashboardTable                │
├─────────────────────────┴───────────────────────────────────┤
│              共通デザイントークン                              │
│         src/styles/app-design-tokens.css                    │
│         (色・フォント・余白を一元管理)                         │
└─────────────────────────────────────────────────────────────┘
```

### レゴブロック方式とは？

デザインを「レゴブロック」のように組み立てる方式です：

1. **ブロックの色を変えれば、全ページが変わる**
   → `app-design-tokens.css` の色を1箇所変えるだけ

2. **同じブロックを使えば、見た目が統一される**
   → `DashboardCard` を使えば、どのページでも同じカードデザイン

3. **直接ペイントしない（直書き禁止）**
   → `bg-blue-500` のような直接指定はNG

---

## 📐 1. 二領域アーキテクチャ

### 1.1 Public Pages（iCloud風）

**対象ページ:** `/`, `/pricing`, `/about`, `/organizations`, `/hearing-service`, `/aio`

| コンポーネント | 用途 | インポート元 |
|--------------|------|------------|
| `AioSection` | セクション背景 | `@/components/layout/AioSection` |
| `HIGButton` | ボタン全般 | `@/components/ui/HIGButton` |
| `aio-surface` | カード要素 | CSSクラス |

```tsx
// ✅ 正しい使用例
import { AioSection } from '@/components/layout/AioSection';
import { HIGButton } from '@/components/ui/HIGButton';

<AioSection tone="white">
  <div className="aio-surface">
    <HIGButton variant="primary" size="lg">
      申し込む
    </HIGButton>
  </div>
</AioSection>
```

### 1.2 Dashboard（Stripe風）

**対象ページ:** `/dashboard/**`

| コンポーネント | 用途 | インポート元 |
|--------------|------|------------|
| `DashboardCard` | カードコンテナ | `@/components/dashboard/ui` |
| `DashboardButton` | ボタン（ローディング対応） | `@/components/dashboard/ui` |
| `DashboardTable` | データテーブル | `@/components/dashboard/ui` |
| `DashboardInput` | フォーム入力 | `@/components/dashboard/ui` |
| `DashboardBadge` | ステータス表示 | `@/components/dashboard/ui` |
| `DashboardTabs` | タブナビゲーション | `@/components/dashboard/ui` |

```tsx
// ✅ 正しい使用例
import {
  DashboardCard,
  DashboardButton,
  DashboardInput,
  StatusBadge
} from '@/components/dashboard/ui';

<DashboardCard title="設定">
  <DashboardInput label="名前" placeholder="入力してください" />
  <DashboardButton variant="primary" loading={isSubmitting}>
    保存
  </DashboardButton>
  <StatusBadge status="active" />
</DashboardCard>
```

---

## 🎨 2. デザイントークン一覧

### 2.1 トークンファイル構成

```
src/styles/
├── app-design-tokens.css    ← 統一トークン（ここを変えれば全体に反映）
├── design-tokens.css        ← 旧トークン（段階的移行中）
└── globals.css              ← Tailwind読み込み
```

### 2.2 カラートークン

#### ブランドカラー
```css
--aio-primary: #007AFF;          /* Apple標準青 */
--aio-primary-hover: #0056CC;    /* ホバー時 */
--aio-muted: #f5f5f7;            /* 薄いグレー背景 */
--aio-surface: #ffffff;          /* カード背景 */
```

#### テキストカラー
```css
--color-text-primary: #1D1D1F;   /* メインテキスト */
--color-text-secondary: #636366; /* サブテキスト */
--color-text-tertiary: #8E8E93;  /* 補助テキスト */
```

#### ステータスカラー
```css
--status-success: #34C759;       /* 成功・有効 */
--status-warning: #FF9500;       /* 警告・保留 */
--status-error: #FF3B30;         /* エラー・失敗 */
--status-info: #007AFF;          /* 情報 */
```

#### Dashboard専用トークン
```css
--dashboard-bg: #f3f4f6;               /* ダッシュボード背景 */
--dashboard-card-bg: #ffffff;          /* カード背景 */
--dashboard-card-border: #e5e7eb;      /* カード枠線 */
--dashboard-card-shadow: 0 1px 3px rgba(0,0,0,0.06);

/* Stripe風インタラクション */
--focus-ring: 0 0 0 3px rgba(0,122,255,0.25);
--input-border: #d1d5db;
--input-border-focus: var(--aio-primary);
--table-row-hover: #f3f4f6;
```

### 2.3 タイポグラフィ

```css
--font-size-h1: clamp(28px, 6vw, 38px);
--font-size-h2: clamp(22px, 4.5vw, 30px);
--font-size-h3: clamp(18px, 3.5vw, 24px);
--font-size-body: 15px;
--line-height-body: 1.7;
```

### 2.4 余白・スペーシング

```css
--space-section: clamp(48px, 8vw, 96px);  /* セクション間 */
--space-card: 24px;                        /* カード内余白 */
--radius-small: 8px;
--radius-large: 16px;
```

---

## 🔀 3. コンポーネント決定フローチャート

### 3.1 ページ種別で判断

```
どのページ？
├── /dashboard/** → Dashboard UIを使う
│   ├── ボタン → DashboardButton
│   ├── カード → DashboardCard
│   ├── テーブル → DashboardTable
│   ├── フォーム → DashboardInput
│   └── ステータス → DashboardBadge / StatusBadge
│
└── それ以外（公開ページ）→ Public UIを使う
    ├── ボタン → HIGButton
    ├── セクション背景 → AioSection
    └── カード → aio-surface クラス
```

### 3.2 ボタン選択早見表

| 用途 | Public | Dashboard |
|-----|--------|-----------|
| メインアクション | `HIGButton variant="primary"` | `DashboardButton variant="primary"` |
| サブアクション | `HIGButton variant="secondary"` | `DashboardButton variant="secondary"` |
| 危険な操作 | `HIGButton variant="danger"` | `DashboardButton variant="danger"` |
| リンク風 | `HIGButton variant="ghost"` | `DashboardButton variant="ghost"` |
| アイコンのみ | - | `DashboardIconButton` |

### 3.3 フォーム選択早見表（Dashboard専用）

| 要素 | コンポーネント | 特徴 |
|-----|--------------|------|
| 1行入力 | `DashboardInput` | ラベル・エラー表示対応 |
| 複数行入力 | `DashboardTextarea` | 高さ自動調整 |
| 選択肢 | `DashboardSelect` | ドロップダウン |
| チェック | `DashboardCheckbox` | アニメーション付き |

### 3.4 データ表示選択早見表（Dashboard専用）

| 要素 | コンポーネント | 特徴 |
|-----|--------------|------|
| 一覧表示 | `DashboardTable` | ホバー・ソート対応 |
| 数値指標 | `DashboardMetricCard` | トレンド表示 |
| ステータス | `StatusBadge` | active/pending等 |
| 通知数 | `CountBadge` | 99+表示対応 |
| 空状態 | `DashboardEmptyState` | アイコン・CTA付き |
| ローディング | `DashboardLoadingState` | スケルトン表示 |

---

## 🚫 4. 禁止事項チェックリスト

### 4.1 絶対禁止

| 禁止事項 | 悪い例 | 正しい方法 |
|---------|--------|-----------|
| Tailwind色クラス直書き | `bg-blue-500` | `bg-[var(--aio-primary)]` |
| HEX値直接指定 | `color: #007AFF` | `color: var(--aio-primary)` |
| インラインスタイル色指定 | `style={{color: 'blue'}}` | CSS変数を使用 |
| 未確認での新規コンポーネント作成 | いきなり `NewButton.tsx` | 既存コンポーネント確認必須 |

### 4.2 領域違反

| 禁止事項 | 理由 |
|---------|------|
| Dashboardで `HIGButton` | 操作感が異なる |
| PublicでDashboardコンポーネント | ビジュアルが異なる |
| 両方で使える「共通ボタン」作成 | 複雑化の原因 |

### 4.3 AI開発時の必須確認

```
開発前チェックリスト:
□ このページはPublic? Dashboard?
□ 既存コンポーネントで対応できる?
□ 色はCSS変数経由で指定している?
□ 直書きスタイルはない?
```

---

## 📁 5. ファイル構成マップ

### 5.1 コンポーネント配置

```
src/components/
├── dashboard/
│   └── ui/
│       ├── index.tsx              ← Dashboard UI一括エクスポート
│       ├── DashboardCard.tsx
│       ├── DashboardButton.tsx
│       ├── DashboardInput.tsx
│       ├── DashboardTable.tsx
│       ├── DashboardBadge.tsx
│       ├── DashboardTabs.tsx
│       ├── DashboardAlert.tsx
│       ├── DashboardEmptyState.tsx
│       ├── DashboardLoadingState.tsx
│       ├── DashboardMetricCard.tsx
│       ├── DashboardPageHeader.tsx
│       └── DashboardSection.tsx
│
├── layout/
│   └── AioSection.tsx             ← Public用セクション背景
│
└── ui/
    ├── HIGButton.tsx              ← Public用ボタン
    └── HIGCard.tsx                ← Public用カード
```

### 5.2 スタイル配置

```
src/styles/
├── app-design-tokens.css          ← 統一トークン（メイン）
├── design-tokens.css              ← 旧トークン
└── globals.css                    ← Tailwind + 基盤CSS
```

### 5.3 設定ファイル

```
src/config/
├── plans.ts                       ← プラン定義（デザインとは別管理）
└── features.ts                    ← 機能定義（デザインとは別管理）
```

---

## 🔧 6. 実装パターン集

### 6.1 Dashboardページ基本構造

```tsx
// src/app/dashboard/example/page.tsx
import {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardContent,
  DashboardButton,
  DashboardPageHeader,
} from '@/components/dashboard/ui';

export default function ExamplePage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="ページタイトル"
        description="ページの説明文"
        actions={
          <DashboardButton variant="primary">
            アクション
          </DashboardButton>
        }
      />

      <DashboardCard>
        <DashboardCardHeader>
          <h3>カードタイトル</h3>
        </DashboardCardHeader>
        <DashboardCardContent>
          {/* コンテンツ */}
        </DashboardCardContent>
      </DashboardCard>
    </div>
  );
}
```

### 6.2 Dashboardフォーム

```tsx
import {
  DashboardCard,
  DashboardInput,
  DashboardTextarea,
  DashboardSelect,
  DashboardButton,
  DashboardFormGroup,
} from '@/components/dashboard/ui';

<DashboardCard title="設定フォーム">
  <form className="space-y-4">
    <DashboardFormGroup>
      <DashboardInput
        label="名前"
        placeholder="山田太郎"
        error={errors.name}
      />
    </DashboardFormGroup>

    <DashboardFormGroup>
      <DashboardSelect label="プラン">
        <option value="starter">スターター</option>
        <option value="pro">プロ</option>
      </DashboardSelect>
    </DashboardFormGroup>

    <DashboardFormGroup>
      <DashboardTextarea
        label="備考"
        rows={4}
      />
    </DashboardFormGroup>

    <DashboardButton type="submit" variant="primary" loading={isLoading}>
      保存
    </DashboardButton>
  </form>
</DashboardCard>
```

### 6.3 Dashboardテーブル

```tsx
import {
  DashboardTable,
  DashboardTableHead,
  DashboardTableBody,
  DashboardTableRow,
  DashboardTableHeaderCell,
  DashboardTableCell,
  DashboardTableEmpty,
  StatusBadge,
} from '@/components/dashboard/ui';

<DashboardTable title="ユーザー一覧">
  <DashboardTableHead>
    <DashboardTableRow>
      <DashboardTableHeaderCell>名前</DashboardTableHeaderCell>
      <DashboardTableHeaderCell>メール</DashboardTableHeaderCell>
      <DashboardTableHeaderCell>ステータス</DashboardTableHeaderCell>
    </DashboardTableRow>
  </DashboardTableHead>
  <DashboardTableBody>
    {users.length === 0 ? (
      <DashboardTableEmpty
        colSpan={3}
        title="ユーザーがいません"
        description="新しいユーザーを招待してください"
      />
    ) : (
      users.map((user) => (
        <DashboardTableRow key={user.id} interactive>
          <DashboardTableCell emphasis>{user.name}</DashboardTableCell>
          <DashboardTableCell>{user.email}</DashboardTableCell>
          <DashboardTableCell>
            <StatusBadge status={user.status} />
          </DashboardTableCell>
        </DashboardTableRow>
      ))
    )}
  </DashboardTableBody>
</DashboardTable>
```

### 6.4 Publicページ基本構造

```tsx
// src/app/example/page.tsx
import { AioSection } from '@/components/layout/AioSection';
import { HIGButton } from '@/components/ui/HIGButton';

export default function ExamplePage() {
  return (
    <>
      <AioSection tone="white">
        <div className="section-spacing max-w-4xl mx-auto px-6">
          <h1 className="ui-h1">見出し</h1>
          <p className="ui-lead">リード文</p>
          <HIGButton variant="primary" size="lg">
            アクション
          </HIGButton>
        </div>
      </AioSection>

      <AioSection tone="muted">
        <div className="section-spacing">
          <div className="aio-surface p-6">
            カードコンテンツ
          </div>
        </div>
      </AioSection>
    </>
  );
}
```

---

## ✅ 7. 品質チェックリスト

### 7.1 コードレビュー時

- [ ] CSS変数経由で色を指定している
- [ ] 正しい領域のコンポーネントを使用している
- [ ] 直書きスタイルがない
- [ ] 既存コンポーネントを確認した上での実装である

### 7.2 新規ページ作成時

- [ ] Dashboard or Publicを明確にした
- [ ] 基本構造パターンに従っている
- [ ] デザイントークンを使用している
- [ ] レスポンシブ対応している

### 7.3 コンポーネント追加時

- [ ] 既存コンポーネントで代替できないことを確認した
- [ ] 正しいディレクトリに配置した
- [ ] index.tsx からエクスポートした
- [ ] このドキュメントに追記した

---

## 📚 8. 参考資料

### 8.1 デザイン参考

- **Public Pages:** [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- **Dashboard:** [Stripe Dashboard](https://dashboard.stripe.com/)

### 8.2 プロジェクト内ドキュメント

- プラン・機能定義: `src/config/plans.ts`, `src/config/features.ts`
- 実装ガイドライン: `docs/implementation.md`
- 要件定義: `docs/requirements_system.md`

---

## 🔄 9. 移行ガイド

### 9.1 旧コンポーネントからの移行

| 旧 | 新 | 備考 |
|---|---|-----|
| `PrimaryCTA` | `HIGButton variant="primary"` | Public用 |
| `SecondaryCTA` | `HIGButton variant="secondary"` | Public用 |
| `Button` (shadcn) | `DashboardButton` | Dashboard用 |
| `sec-white` クラス | `AioSection tone="white"` | Public用 |

### 9.2 段階的移行方針

1. **新規ページ:** 必ず新システムを使用
2. **既存ページ:** リファクタリング時に移行
3. **緊急修正:** 最小限の変更で対応（移行は後日）

---

**このドキュメントは開発前に必ず確認してください。**
**AIによる開発時もこのファイルを最優先で参照してください。**
