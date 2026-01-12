# AIO Hub デザインシステム v3.0 - iCloud Dense

> **最終更新:** 2025年1月
> **対象:** 開発者・AI・デザイナー全員必読

---

## 🎯 30秒でわかるデザインシステム

```
┌─────────────────────────────────────────────────────────────┐
│              AIO Hub - iCloud Dense デザイン                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   🎨 iCloud風の美しさ × Stripe風の密度 = iCloud Dense      │
│                                                             │
│   ・Apple Blue (#007AFF) 基調のブランドカラー               │
│   ・繊細なシャドウ・丸み（iCloud品質）                       │
│   ・コンパクトな余白・情報密度（Stripe操作性）               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│   📦 統一コンポーネント                                      │
│   ・Button (統一ボタン)     @/components/ui/button          │
│   ・DashboardCard          @/components/dashboard/ui        │
│   ・AioSection             @/components/layout/AioSection   │
├─────────────────────────────────────────────────────────────┤
│              共通デザイントークン                             │
│         src/styles/app-design-tokens.css                    │
│         (色・フォント・余白を一元管理)                        │
└─────────────────────────────────────────────────────────────┘
```

### iCloud Dense とは？

Appleの美しさとStripeの実用性を融合したデザイン言語です：

- **iCloudの美しさ**: Apple Blue、繊細なシャドウ、ガラス風エフェクト
- **Stripeの密度**: コンパクトな余白、効率的な情報表示、明確なインタラクション

---

## 🎨 1. 統一デザイン原則

### 1.1 ボタンは全ページで統一

**統一Button** (`@/components/ui/button`) を全ページで使用します。

```tsx
// ✅ 推奨: 統一Buttonを直接使用
import { Button } from '@/components/ui/button';

<Button variant="primary" size="md">保存</Button>
<Button variant="secondary">キャンセル</Button>
<Button variant="danger">削除</Button>
```

```tsx
// ✅ 後方互換: エイリアス経由でも使用可能
// Public Pages
import { HIGButton } from '@/components/ui/HIGButton';

// Dashboard
import { DashboardButton } from '@/components/dashboard/ui/DashboardButton';

// ↑ どちらも内部的には統一Buttonを使用
```

### 1.2 ボタンバリエーション

| variant | 用途 | 見た目 |
|---------|------|--------|
| `primary` | メインアクション | Apple Blue背景 + 白文字 |
| `secondary` | サブアクション | 白背景 + ボーダー |
| `tertiary` | テキストリンク風 | 透明背景 + 青文字 |
| `danger` | 危険な操作 | 赤背景 + 白文字 |
| `ghost` | 控えめなアクション | 透明背景 + グレー文字 |
| `outline` | 枠線強調 | 透明背景 + ボーダー |
| `link` | リンク風 | 下線付きテキスト |

### 1.3 ボタンサイズ（iCloud Dense）

| size | 高さ | 用途 |
|------|------|------|
| `sm` | 32px | コンパクトUI |
| `md` | 36px | 標準（デフォルト） |
| `lg` | 40px | 強調が必要な場面 |
| `xl` | 44px | タップターゲット最大 |
| `icon` | 36px × 36px | アイコンのみ |

---

## 📐 2. ページ種別とコンポーネント

### 2.1 Public Pages（/about, /pricing等）

| 要素 | コンポーネント | インポート元 |
|------|---------------|-------------|
| ボタン | `Button` or `HIGButton` | `@/components/ui/button` |
| セクション | `AioSection` | `@/components/layout/AioSection` |
| カード | `aio-surface` クラス | CSS |

```tsx
import { AioSection } from '@/components/layout/AioSection';
import { Button } from '@/components/ui/button';

<AioSection tone="white">
  <div className="aio-surface p-6">
    <Button variant="primary" size="lg">申し込む</Button>
  </div>
</AioSection>
```

### 2.2 Dashboard（/dashboard/**）

| 要素 | コンポーネント | インポート元 |
|------|---------------|-------------|
| ボタン | `Button` or `DashboardButton` | `@/components/ui/button` |
| カード | `DashboardCard` | `@/components/dashboard/ui` |
| テーブル | `DashboardTable` | `@/components/dashboard/ui` |
| フォーム | `DashboardInput` | `@/components/dashboard/ui` |
| バッジ | `DashboardBadge` | `@/components/dashboard/ui` |

```tsx
import { DashboardCard } from '@/components/dashboard/ui';
import { Button } from '@/components/ui/button';

<DashboardCard title="設定">
  <Button variant="primary" loading={isSubmitting}>保存</Button>
</DashboardCard>
```

---

## 🎨 3. デザイントークン一覧

### 3.1 カラートークン

#### ブランドカラー
```css
--aio-primary: #007AFF;          /* Apple Blue - メインカラー */
--aio-primary-hover: #0060DF;    /* ホバー時 */
--aio-surface: #F5F5F7;          /* Apple Gray - 背景面 */
--aio-muted: #f8f9fa;            /* 軽いグレー */
```

#### テキストカラー
```css
--color-text-primary: #1D1D1F;   /* Apple標準黒 */
--color-text-secondary: #636366; /* AA準拠グレー */
--color-text-tertiary: #767680;  /* 薄いグレー */
```

#### ステータスカラー
```css
--status-success: #22c55e;       /* 成功・有効 */
--status-warning: #eab308;       /* 警告・保留 */
--status-error: #ef4444;         /* エラー・失敗 */
--status-info: #3b82f6;          /* 情報 */
```

### 3.2 シャドウ（iCloud品質）

```css
/* Dashboard/カード用 */
--dashboard-card-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05);
--dashboard-card-shadow-hover: 0 2px 8px rgba(0, 0, 0, 0.1), 0 8px 24px rgba(0, 0, 0, 0.08);

/* ボタン用 */
--btn-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
--btn-shadow-hover: 0 2px 4px rgba(0, 0, 0, 0.1);
```

### 3.3 スペーシング（iCloud Dense）

```css
/* コンパクト8ptグリッド */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 12px;    /* 密度向上 */
--space-lg: 16px;    /* 密度向上 */
--space-xl: 24px;    /* 密度向上 */
--space-2xl: 32px;   /* 密度向上 */
```

### 3.4 ボタンサイズトークン

```css
--btn-height-sm: 32px;
--btn-height-md: 36px;
--btn-height-lg: 40px;
--btn-height-xl: 44px;
```

---

## 🔀 4. コンポーネント決定フローチャート

```
ボタンを追加したい
└── Button (@/components/ui/button) を使用
    ├── variant を選択 (primary/secondary/danger/ghost/outline/link)
    ├── size を選択 (sm/md/lg/xl/icon)
    └── 必要に応じて loading, leftIcon, rightIcon を追加

カードを追加したい
├── /dashboard/** → DashboardCard
└── 公開ページ → aio-surface クラス

セクション背景を追加したい
└── AioSection tone="white|muted"

フォーム要素を追加したい（Dashboard）
├── 1行入力 → DashboardInput
├── 複数行 → DashboardTextarea
└── 選択 → DashboardSelect
```

---

## 🚫 5. 禁止事項チェックリスト

### 5.1 絶対禁止

| 禁止事項 | 悪い例 | 正しい方法 |
|---------|--------|-----------|
| Tailwind色クラス直書き | `bg-blue-500` | `bg-[var(--aio-primary)]` |
| HEX値直接指定 | `color: #007AFF` | `color: var(--aio-primary)` |
| インラインスタイル色指定 | `style={{color: 'blue'}}` | CSS変数を使用 |
| 独自ボタン作成 | `<MyButton>` | 統一Button使用 |

### 5.2 AI開発時の必須確認

```
開発前チェックリスト:
□ 統一Buttonを使用している?
□ 色はCSS変数経由で指定している?
□ 直書きスタイルがない?
□ 既存コンポーネントを確認した?
```

---

## 📁 6. ファイル構成マップ

### 6.1 コンポーネント配置

```
src/components/
├── ui/
│   ├── button.tsx               ← 統一Buttonコンポーネント（メイン）
│   ├── HIGButton.tsx            ← 後方互換エイリアス
│   └── ...
│
├── dashboard/
│   └── ui/
│       ├── index.tsx            ← Dashboard UI一括エクスポート
│       ├── DashboardButton.tsx  ← 後方互換エイリアス
│       ├── DashboardCard.tsx
│       ├── DashboardInput.tsx
│       └── ...
│
└── layout/
    └── AioSection.tsx           ← Public用セクション背景
```

### 6.2 スタイル配置

```
src/styles/
├── app-design-tokens.css        ← 統一トークン（メイン）
├── design-tokens.css            ← 旧トークン
└── globals.css                  ← Tailwind + 基盤CSS
```

---

## 🔧 7. 実装パターン集

### 7.1 統一Buttonの使用例

```tsx
import { Button, ButtonGroup, IconButton, LinkButton } from '@/components/ui/button';
import { Plus, Edit, Trash } from 'lucide-react';

// 基本ボタン
<Button variant="primary">保存</Button>
<Button variant="secondary">キャンセル</Button>
<Button variant="danger">削除</Button>

// ローディング状態
<Button variant="primary" loading={isSubmitting}>
  送信中...
</Button>

// アイコン付き
<Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
  新規作成
</Button>

// アイコンのみ
<IconButton icon={<Edit className="w-4 h-4" />} aria-label="編集" />

// ボタングループ
<ButtonGroup>
  <Button variant="secondary">戻る</Button>
  <Button variant="primary">次へ</Button>
</ButtonGroup>

// リンクボタン
<LinkButton href="/dashboard" variant="tertiary">
  ダッシュボードへ
</LinkButton>
```

### 7.2 Dashboardページ基本構造

```tsx
import { DashboardCard, DashboardCardHeader, DashboardCardContent } from '@/components/dashboard/ui';
import { Button } from '@/components/ui/button';

export default function ExamplePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ページタイトル</h1>
        <Button variant="primary">アクション</Button>
      </div>

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

### 7.3 Publicページ基本構造

```tsx
import { AioSection } from '@/components/layout/AioSection';
import { Button } from '@/components/ui/button';

export default function ExamplePage() {
  return (
    <>
      <AioSection tone="white">
        <div className="section-spacing max-w-4xl mx-auto px-6">
          <h1 className="ui-h1">見出し</h1>
          <p className="ui-lead">リード文</p>
          <Button variant="primary" size="lg">
            アクション
          </Button>
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

## 🔄 8. 移行ガイド

### 8.1 新しい統一Buttonへの移行

| 旧 | 新 | 備考 |
|---|---|-----|
| `HIGButton` | `Button` | そのまま使用可（エイリアス） |
| `DashboardButton` | `Button` | そのまま使用可（エイリアス） |
| `PrimaryCTA` | `Button variant="primary"` | 移行推奨 |
| `SecondaryCTA` | `Button variant="secondary"` | 移行推奨 |

### 8.2 インポートパスの推奨

```tsx
// ✅ 推奨: 統一Buttonを直接インポート
import { Button } from '@/components/ui/button';

// ⚠️ 後方互換: エイリアス経由（既存コードはそのまま動作）
import { HIGButton } from '@/components/ui/HIGButton';
import { DashboardButton } from '@/components/dashboard/ui/DashboardButton';
```

---

## ✅ 9. 品質チェックリスト

### 9.1 コードレビュー時

- [ ] 統一Button（または後方互換エイリアス）を使用している
- [ ] CSS変数経由で色を指定している
- [ ] 直書きスタイルがない
- [ ] iCloud Dense のサイズ感を守っている

### 9.2 新規ページ作成時

- [ ] 統一Buttonを使用している
- [ ] デザイントークンを使用している
- [ ] レスポンシブ対応している

---

## 📚 10. 参考資料

### 10.1 デザイン参考

- **iCloud品質**: [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- **Stripe密度**: [Stripe Dashboard](https://dashboard.stripe.com/)

### 10.2 プロジェクト内ドキュメント

- 実装ガイドライン: `docs/implementation.md`
- AI実装ガード: `docs/ai-implementation-guard.md`
- 要件定義: `docs/requirements_system.md`

---

**このドキュメントは開発前に必ず確認してください。**
**AIによる開発時もこのファイルを最優先で参照してください。**
