# AIO Hub デザインシステム

## 概要

AIO Hubのデザインシステムは、CSS Design Tokensを基盤としたスケーラブルな設計手法を採用しています。CSS変数とTailwind CSSの組み合わせにより、一元化されたデザイン管理と保守性の向上を実現しています。

## Design Tokens

### カラー

#### ブランドカラー
- `--color-brand` (#4F46E5): メインブランドカラー
- `--color-accent` (#06B6D4): アクセントカラー

#### テキストカラー
- `--color-text` (#0F172A): メインテキスト
- `--color-muted` (#475569): 補助テキスト

#### システムカラー
- `--color-bg` (#FFFFFF): 背景色
- `--color-error` (#EF4444): エラー表示
- `--color-success` (#10B981): 成功表示
- `--color-warning` (#F59E0B): 警告表示

### タイポグラフィ

#### フォントサイズ
- `--font-size-h1`: clamp(28px, 6vw, 38px) - H1見出し
- `--font-size-h2`: clamp(22px, 4.5vw, 30px) - H2見出し
- `--font-size-h3`: clamp(18px, 3.5vw, 24px) - H3見出し
- `--font-size-body`: 15px - 本文テキスト
- `--font-size-small`: 13px - 小さなテキスト

#### 行間
- `--line-height-tight`: 1.2 - 見出し用
- `--line-height-body`: 1.7 - 本文用
- `--line-height-relaxed`: 1.8 - リード文用

### スペーシング

レスポンシブなclamp()関数を使用した余白システム：

- `--space-xs`: clamp(4px, 1vw, 8px)
- `--space-s`: clamp(8px, 1.5vw, 16px)
- `--space-m`: clamp(16px, 3vw, 24px)
- `--space-l`: clamp(24px, 4vw, 40px)
- `--space-xl`: clamp(32px, 6vw, 64px)
- `--space-2xl`: clamp(48px, 8vw, 96px)

### 角丸とシャドウ

- `--radius-s`: 6px - 小さな角丸
- `--radius-m`: 12px - 中程度の角丸
- `--radius-l`: 16px - 大きな角丸
- `--shadow-card`: 0 8px 24px rgba(2, 6, 23, .06) - カード用影
- `--shadow-hover`: 0 12px 32px rgba(2, 6, 23, .12) - ホバー用影

### Z-index

- `--z-fab`: 1000 - フローティングアクションボタン
- `--z-fab-backdrop`: 999 - FAB背景
- `--z-modal`: 1100 - モーダル
- `--z-toast`: 1200 - トースト通知

## ユーティリティクラス

### タイポグラフィ

#### 見出し
- `.ui-h1`: H1見出しスタイル
- `.ui-h2`: H2見出しスタイル  
- `.ui-h3`: H3見出しスタイル

#### 本文
- `.ui-body`: 標準本文スタイル
- `.ui-lead`: リード文スタイル（やや大きめ、行間広め）

#### 行長制御
- `.ui-measure-hero`: ヒーロー用短い行長（30ch）
- `.ui-measure-lead`: リード文用行長（44ch）
- `.ui-measure-body`: 本文用行長（65ch）

### レイアウト

#### レール配置
- `.ui-rail`: 左基準統一のメインコンテナ
  - 最大幅1280px
  - レスポンシブな左右パディング
  - 左寄せテキスト配置

#### 余白管理
- `.ui-section-gap`: セクション間余白
- `.ui-paragraph-gap`: 段落間余白
- `.ui-cta-gap`: CTA要素上余白

#### FAB安全域
- `.ui-bottom-content`: FAB重複回避用下部余白
- `.ui-fab-layer`: FAB z-index適用
- `.ui-fab-backdrop`: FAB背景 z-index適用

### カルーセル・スクロール

#### 料金表示用
- `.ui-carousel-pricing`: 料金カード用スクロール設定
- `.ui-pricing-grid`: PCでのグリッド、モバイルでフレックス

#### 中央配置
- `.ui-carousel-center-2`: 2カラムセンター配置

## 実装パターン

### Tailwind CSS統合

Design TokensはTailwindの`theme.extend`で参照され、以下のように使用できます：

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      brand: 'var(--color-brand)',
      accent: 'var(--color-accent)',
    },
    fontSize: {
      'h1': 'var(--font-size-h1)',
      'h2': 'var(--font-size-h2)',
    }
  }
}
```

### コンポーネント適用例

```jsx
// PricingTable.tsx
<h2 className="ui-h2 jp-heading text-gray-900 mb-6 ui-measure-hero">
  シンプルで明確な料金体系
</h2>
<p className="ui-lead jp-body ui-measure-lead max-w-3xl mx-auto break-keep">
  無料から始めて、必要になったら拡張。
</p>
```

## 拡張方針

### 新しいトークンの追加

1. `globals.css`の`:root`にCSS変数を定義
2. `tailwind.config.js`の`theme.extend`に参照を追加
3. 必要に応じて新しいユーティリティクラスを作成

### コンポーネント拡張

新しいコンポーネントは以下の原則に従います：

1. Design Tokensの使用を優先
2. `ui-*`クラスの活用
3. レスポンシブ対応のため`clamp()`の積極的利用
4. アクセシビリティを考慮した実装

## ブラウザサポート

- CSS変数: IE11+対応
- clamp(): モダンブラウザ（IE11はfallback必要）
- CSS Grid: IE11はfallback実装

## パフォーマンス

- CSS変数の動的変更によりJavaScriptでのリアルタイムテーマ切り替えが可能
- Tailwindのpurge機能と併用し、未使用CSSを削除
- `safelist`でDesign Token関連クラスを保護

## 🧭 Visual Alignment Standards (AIO Hub)

この節では、AIO Hubのレイアウト全体における「Center Column + Left Text」原則を視覚的整列の数値基準として定義します。

| 要素 | 配置基準 | 理想値 | 許容誤差 | 備考 |
|------|----------|--------|-----------|------|
| Hero 見出し | コンテナ中央線 | ±0px | ±8px以内 | .center-col + .text-left |
| Hero 本文 | 見出し左端と一致 | 0px差 | ±4px以内 | .measure-lead .copy |
| Pricing (PC) | 2カード中央線 | 画面中央線 | ±16px以内 | lg:grid-cols-2 justify-center |
| Pricing (SP) | 1.1枚見せ | 右端15vw余白 | ±4px以内 | min-w-[85vw] |
| Section 間余白 | 垂直間隔 | clamp(2.5rem,4vw,5rem) | - | 全ページ共通 |
| Hero 間余白 | 垂直間隔 | clamp(3rem,6vw,7rem) | - | ヒーローセクション専用 |
| 本文行長 | 文字数幅 | 36–44ch | - | measure-body / measure-lead |
| 行高 | 全テキスト | 1.65 | - | .copy |

### 実装基準

#### コンテナ設計
```css
.center-col {
  max-width: 72rem;
  margin-inline: auto;
  padding-inline: clamp(16px, 4vw, 40px);
}
```

#### 行長制御
```css
.measure-hero { max-width: 30ch; }    /* ヒーロー見出し用 */
.measure-lead { max-width: 44ch; }    /* リード文・見出し用 */
.measure-body { max-width: 38ch; }    /* 本文用 */
```

#### セクション余白
```css
/* 標準セクション */
style={{paddingBlock: 'clamp(2.5rem, 4vw, 5rem)'}}

/* ヒーローセクション */
style={{paddingBlock: 'clamp(3rem, 6vw, 7rem)'}}
```

### 備考
- これらの基準を満たす限り、視覚的な「斜め見え」や「偏り」は発生しません。
- 修正時は `npm run build` 前に `npm run lint` にて整列差分を検出可能。
- UIテストでは visual-baseline.spec.tsx にて中央線誤差 ±8px以内を自動検証。

## 今後の拡張予定

1. ダークモード対応トークン
2. アニメーション用トークン
3. ブレークポイント統一
4. フォーカス状態の標準化
5. より詳細なコンポーネントライブラリ化