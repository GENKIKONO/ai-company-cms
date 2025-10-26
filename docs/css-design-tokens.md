# CSS Design Tokens 一覧

## 使用中のApple HIGデザイントークン

### Typography Tokens
```css
/* フォントファミリー */
--font-family-system: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;

/* フォントサイズ */
--font-size-hero: clamp(48px, 8vw, 80px);      /* ヒーロータイトル */
--font-size-title1: 32px;                      /* セクションタイトル */
--font-size-title3: 20px;                      /* サブタイトル */
--font-size-body-large: 19px;                  /* 大きな本文 */
--font-size-body: 17px;                        /* 標準本文 */
--font-size-caption: 15px;                     /* キャプション */
--font-size-caption-small: 13px;               /* 小さなキャプション */

/* 特殊サイズ */
--font-size-price: 36px;                       /* 価格表示 */
--font-size-faq-category: 28px;                /* FAQカテゴリー */

/* 行間 */
--line-height-tight: 1.05;                     /* ヒーロータイトル */
--line-height-title: 1.2;                      /* タイトル */
--line-height-body: 1.47;                      /* 本文 */
--line-height-caption: 1.38;                   /* キャプション */

/* 文字間隔 */
--letter-spacing-tight: -0.025em;              /* ヒーロータイトル */
--letter-spacing-title: -0.02em;               /* タイトル */
--letter-spacing-body: -0.011em;               /* 本文 */
--letter-spacing-caption: -0.006em;            /* キャプション */
```

### Color Tokens
```css
/* プライマリカラー */
--apple-blue: #007AFF;                         /* iOS Blue */
--apple-green: #34C759;                        /* Success Green */
--apple-red: #FF3B30;                          /* Error Red */

/* テキストカラー */
--apple-label: #1D1D1F;                        /* Primary Text */
--apple-secondary-label: #86868B;              /* Secondary Text */
--apple-tertiary-label: #C7C7CC;               /* Tertiary Text */

/* グレースケール */
--apple-gray-100: #F2F2F7;                     /* Background Alt */
--apple-gray-200: #E5E5EA;                     /* Border Light */
--apple-gray-300: #D1D1D6;                     /* Border Standard */
--apple-gray-400: #86868B;                     /* Icon Secondary */

/* 背景色 */
--color-background: #FFFFFF;                   /* Primary Background */
--color-surface: #F8F9FA;                      /* Surface Background */
```

### Spacing Tokens
```css
/* 8px Grid System */
--space-1: 8px;                                /* 微細な余白 */
--space-2: 16px;                               /* 小さな余白 */
--space-3: 24px;                               /* 標準余白 */
--space-4: 32px;                               /* 大きな余白 */
--space-5: 40px;                               /* XL余白 */
--space-6: 48px;                               /* セクション間 */
--space-8: 64px;                               /* 大型セクション間 */
--space-10: 80px;                              /* 特大セクション間 */
```

### Border Radius Tokens
```css
--radius-small: 8px;                           /* 小さな角丸 */
--radius-medium: 12px;                         /* 標準角丸 */
--radius-large: 16px;                          /* 大きな角丸 */
--radius-circle: 50%;                          /* 円形 */
```

### Shadow Tokens
```css
--shadow-small: 0 2px 8px rgba(0, 0, 0, 0.06);
--shadow-medium: 0 4px 16px rgba(0, 0, 0, 0.08);
--shadow-large: 0 8px 32px rgba(0, 0, 0, 0.12);
--shadow-button: 0 4px 16px rgba(0, 122, 255, 0.3);
```

### Touch Target Tokens
```css
--touch-target-minimum: 44px;                  /* Apple HIG必須 */
--touch-target-recommended: 48px;              /* 推奨サイズ */
--touch-target-large: 56px;                    /* 大型ボタン */
```

### Animation Tokens
```css
--duration-instant: 0.1s;                      /* 瞬時 */
--duration-fast: 0.2s;                         /* 高速 */
--duration-standard: 0.3s;                     /* 標準 */
--duration-slow: 0.5s;                         /* 低速 */

--ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
--ease-accelerate: cubic-bezier(0.4, 0.0, 1, 1);
```

## コンポーネント別実装例

### PricingTable
```css
.apple-pricing-card {
  padding: var(--space-4);                      /* 32px */
  border-radius: var(--radius-large);           /* 16px */
  box-shadow: var(--shadow-medium);
}

.apple-pricing-current {
  font-size: var(--font-size-price);            /* 36px */
  color: var(--apple-label);
  line-height: var(--line-height-tight);        /* 1.1 */
}

.apple-pricing-feature-text {
  font-size: var(--font-size-body);             /* 17px */
  line-height: var(--line-height-body);         /* 1.47 */
}
```

### FAQSection
```css
.apple-faq-category-title {
  font-size: var(--font-size-faq-category);     /* 28px */
  margin-bottom: var(--space-3);                /* 24px */
  border-bottom: 2px solid var(--apple-blue);
}

.apple-faq-question {
  min-height: var(--touch-target-minimum);      /* 44px */
  padding: var(--space-3) var(--space-4);       /* 24px 32px */
  font-size: var(--font-size-body);             /* 17px */
}
```

### Footer
```css
.apple-footer-title {
  font-size: var(--font-size-body);             /* 17px */
  margin-bottom: var(--space-2);                /* 16px */
}

.apple-footer-link {
  font-size: var(--font-size-caption);          /* 15px */
  color: var(--apple-secondary-label);
}

.apple-footer-social-link {
  width: var(--touch-target-minimum);           /* 44px */
  height: var(--touch-target-minimum);          /* 44px */
}
```

## レスポンシブデザイントークン

### Breakpoint Tokens
```css
--breakpoint-mobile: 480px;
--breakpoint-tablet: 768px;
--breakpoint-desktop: 1024px;
--breakpoint-wide: 1200px;
```

### Container Tokens
```css
--container-mobile: 100%;
--container-tablet: 720px;
--container-desktop: 960px;
--container-wide: 1200px;
```

### Fluid Typography
```css
--fluid-hero: clamp(48px, 8vw, 80px);
--fluid-title: clamp(24px, 4vw, 32px);
--fluid-body: clamp(15px, 2.5vw, 17px);
```

## 使用方法

### 1. CSS Custom Properties
```css
.my-component {
  font-size: var(--font-size-body);
  color: var(--apple-label);
  padding: var(--space-3);
  border-radius: var(--radius-medium);
}
```

### 2. Sass/SCSS Mixins
```scss
@mixin apple-button-primary {
  background: var(--apple-blue);
  color: white;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-medium);
  min-height: var(--touch-target-minimum);
}
```

### 3. Tailwind CSS拡張
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontSize: {
        'apple-hero': 'var(--font-size-hero)',
        'apple-body': 'var(--font-size-body)',
      },
      spacing: {
        'apple-1': 'var(--space-1)',
        'apple-2': 'var(--space-2)',
      }
    }
  }
}
```

## 品質保証チェックリスト

### タイポグラフィ
- [ ] フォントサイズが17px以上（本文）
- [ ] 行間が適切（1.4以上）
- [ ] 文字間隔が適切
- [ ] フォントウェイトが適切

### スペーシング
- [ ] 8px Gridに準拠
- [ ] 十分な余白確保
- [ ] 視覚的階層が明確

### カラー
- [ ] コントラスト比4.5:1以上
- [ ] Apple System Colors使用
- [ ] ダークモード対応準備

### インタラクション
- [ ] タッチターゲット44px以上
- [ ] ホバー状態実装
- [ ] フォーカス状態実装
- [ ] アニメーション適切

---

**更新日**: 2024年10月26日  
**管理者**: 開発チーム  
**レビュー**: Apple HIG 2024基準