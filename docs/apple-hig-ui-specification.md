# Apple HIG準拠 UI設計仕様書

## 1. 概要

本仕様書は、AIO Hubプラットフォームにおけるユーザーインターフェース設計の統一基準を定めたものです。Apple Human Interface Guidelines (HIG) に完全準拠し、真のApple品質のユーザー体験を提供します。

## 2. Typography システム

### 2.1 フォントファミリー
```css
--font-family-system: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
```

### 2.2 フォントサイズ階層

| 用途 | クラス名 | フォントサイズ | 行間 | 文字間隔 | 使用場面 |
|------|----------|--------------|------|---------|----------|
| ヒーロータイトル | `.apple-hero-title` | 48px-80px (clamp) | 1.05 | -0.025em | メインページタイトル |
| セクションタイトル | `.apple-title1` | 32px | 1.2 | -0.02em | セクション見出し |
| サブタイトル | `.apple-title3` | 20px | 1.3 | 0em | カード見出し |
| 本文テキスト | `.apple-body` | 17px | 1.47 | -0.011em | 一般的な本文 |
| 大きな本文 | `.apple-body-large` | 19px | 1.42 | -0.011em | 重要な説明文 |
| キャプション | `.apple-text-caption` | 13px | 1.38 | -0.006em | 補助情報 |

### 2.3 価格表示専用
| 要素 | フォントサイズ | フォントウェイト | 使用場面 |
|------|--------------|----------------|----------|
| メイン価格 | 36px | 700 | 料金プラン価格 |
| 価格期間 | 17px | 400 | "（税別）/月" |
| 元価格 | 15px | 400 | 取り消し線付き |

## 3. Color System (Apple System Colors)

### 3.1 プライマリカラー
```css
--apple-blue: #007AFF;           /* iOS Blue */
--apple-label: #1D1D1F;          /* Primary Text */
--apple-secondary-label: #86868B; /* Secondary Text */
--apple-tertiary-label: #C7C7CC;  /* Tertiary Text */
```

### 3.2 グレースケール
```css
--apple-gray-100: #F2F2F7;       /* Background Alternative */
--apple-gray-200: #E5E5EA;       /* Border Light */
--apple-gray-300: #D1D1D6;       /* Border Standard */
--apple-gray-400: #86868B;       /* Icon Secondary */
```

### 3.3 セマンティックカラー
```css
--apple-green: #34C759;          /* Success State */
--apple-red: #FF3B30;            /* Error State */
```

## 4. Spacing System (8px Grid)

### 4.1 基本スペーシング
```css
--space-1: 8px;    /* 微細な余白 */
--space-2: 16px;   /* 小さな余白 */
--space-3: 24px;   /* 標準余白 */
--space-4: 32px;   /* 大きな余白 */
--space-6: 48px;   /* セクション間 */
--space-8: 64px;   /* 大型セクション間 */
```

### 4.2 適用例
| 要素 | マージン/パディング | 説明 |
|------|-------------------|------|
| セクション間隔 | 64px | メインセクション間 |
| カード内余白 | 32px | カード内側の余白 |
| リスト項目間 | 16px | FAQ項目、機能リスト |
| テキスト下余白 | 16px-24px | 段落、見出し下 |

## 5. Interactive Elements

### 5.1 タッチターゲットサイズ（Apple HIG必須）
| 要素 | 最小サイズ | 推奨サイズ | 適用例 |
|------|-----------|----------|--------|
| プライマリボタン | 44px高さ | 48-56px | CTA、送信ボタン |
| セカンダリボタン | 44px高さ | 44-48px | キャンセル、戻る |
| FAQトグル | 44px高さ | 44px | FAQ開閉ボタン |
| ソーシャルリンク | 44px×44px | 44px×44px | SNSアイコン |

### 5.2 ボタンスタイル
```css
/* プライマリボタン */
.apple-button-primary {
  background: var(--apple-blue);
  color: #ffffff;
  border-radius: 12px;
  padding: 16px 24px;
  font-size: 17px;
  font-weight: 600;
  min-height: 48px;
}

/* セカンダリボタン */
.apple-button-secondary {
  background: transparent;
  color: var(--apple-label);
  border: 1px solid var(--apple-gray-300);
  border-radius: 12px;
  padding: 16px 24px;
}
```

## 6. Component Specifications

### 6.1 PricingTable
```css
/* カード */
.apple-pricing-card {
  background: #ffffff;
  border: 1px solid var(--apple-gray-300);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* 価格表示 */
.apple-pricing-current {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* 機能テキスト */
.apple-pricing-feature-text {
  font-size: 17px;
  line-height: 1.4;
  color: var(--apple-label);
}
```

### 6.2 FAQSection
```css
/* カテゴリータイトル */
.apple-faq-category-title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  border-bottom: 2px solid var(--apple-blue);
  padding-bottom: 8px;
}

/* 質問ボタン */
.apple-faq-question {
  padding: 24px 32px;
  min-height: 44px;
  font-size: 17px;
  font-weight: 600;
}

/* 回答テキスト */
.apple-faq-answer-content {
  padding: 16px 32px 24px;
  border-top: 1px solid var(--apple-gray-200);
}
```

### 6.3 Footer
```css
/* フッタータイトル */
.apple-footer-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 16px;
}

/* フッターリンク */
.apple-footer-link {
  font-size: 15px;
  color: var(--apple-secondary-label);
  transition: color 0.3s ease;
}

/* ソーシャルリンク */
.apple-footer-social-link {
  width: 44px;
  height: 44px;
  border-radius: 22px;
}
```

## 7. Accessibility Standards

### 7.1 WCAG 2.1 AA 準拠
| 基準 | 要件 | 実装 |
|------|------|------|
| 色のコントラスト | 4.5:1以上 | Apple System Colorsで確保 |
| フォーカス表示 | 視認可能 | 2px outline + box-shadow |
| キーボード操作 | 全要素対応 | tabindex、focus管理 |
| 代替テキスト | 画像・アイコン | aria-label実装 |

### 7.2 スクリーンリーダー対応
```html
<!-- セマンティックHTML -->
<main id="main-content">
  <section aria-labelledby="pricing-title">
    <h2 id="pricing-title">料金プラン</h2>
  </section>
</main>

<!-- ARIA属性 -->
<button aria-expanded="false" aria-controls="faq-answer-1">
  質問内容
</button>
```

## 8. Responsive Design

### 8.1 ブレークポイント
```css
/* Mobile First */
@media (min-width: 768px) {  /* Tablet */
  /* タブレット用スタイル */
}

@media (min-width: 1024px) { /* Desktop */
  /* デスクトップ用スタイル */
}
```

### 8.2 レスポンシブタイポグラフィ
```css
/* clamp()でスムーズなスケーリング */
.apple-hero-title {
  font-size: clamp(48px, 8vw, 80px);
}

.apple-body {
  font-size: clamp(15px, 2.5vw, 17px);
}
```

## 9. Performance Standards

### 9.1 アニメーション
```css
/* reduced-motion対応 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* 標準アニメーション */
.apple-button {
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

### 9.2 タッチデバイス最適化
```css
/* タッチ操作の改善 */
.apple-button {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
```

## 10. Implementation Checklist

### 10.1 必須チェック項目
- [ ] すべてのボタンが44px以上の高さ
- [ ] テキストコントラストが4.5:1以上
- [ ] タッチターゲットが適切なサイズ
- [ ] フォーカス状態が視認可能
- [ ] レスポンシブレイアウトが正常動作
- [ ] アニメーションが適切な速度

### 10.2 品質基準
- [ ] Apple HIG Typography完全準拠
- [ ] 8px Grid System適用
- [ ] Apple System Colors使用
- [ ] セマンティックHTML構造
- [ ] ARIA属性適切設定
- [ ] reduced-motion対応

## 11. 今後の拡張性

### 11.1 ダークモード対応
```css
@media (prefers-color-scheme: dark) {
  :root {
    --apple-label: #FFFFFF;
    --apple-secondary-label: #8E8E93;
    --apple-gray-100: #1C1C1E;
  }
}
```

### 11.2 追加コンポーネント
- Navigation Bar (44px高さ)
- Modal Dialog (中央配置、適切なpadding)
- Form Elements (44px高さ、明確なラベル)
- Loading States (Apple標準アニメーション)

---

**最終更新**: 2024年10月26日  
**準拠基準**: Apple Human Interface Guidelines 2024  
**検証環境**: iOS Safari, macOS Safari, Chrome, Firefox