# Component Implementation Guide - Apple HIG準拠

## 実装済みコンポーネント詳細仕様

### 1. PricingTable Component

#### 1.1 基本構造
```tsx
// src/components/pricing/PricingTable.tsx
<section className="apple-section">
  <div className="apple-container">
    <div className="apple-section-header">
      <h2 className="apple-title1">シンプルで明確な料金体系</h2>
    </div>
    <div className="apple-pricing-grid">
      {/* カード群 */}
    </div>
  </div>
</section>
```

#### 1.2 重要な測定値
| 要素 | サイズ/値 | 説明 |
|------|----------|------|
| カードパディング | 32px | 内側の余白 |
| 価格フォントサイズ | 36px | メイン価格表示 |
| 機能テキスト | 17px | 読みやすさ重視 |
| チェックアイコン | 20px × 20px | 視認性確保 |
| CTAボタン高さ | 48px以上 | タッチターゲット |

#### 1.3 レスポンシブ実装
```css
/* モバイル: 縦積み */
.apple-pricing-mobile {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* デスクトップ: グリッド */
@media (min-width: 1024px) {
  .apple-pricing-desktop {
    display: block;
  }
  .apple-pricing-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }
}
```

### 2. FAQSection Component

#### 2.1 基本構造
```tsx
// src/components/aio/FAQSection.tsx
<section className="apple-section">
  <div className="apple-container">
    <div className="apple-faq-categories">
      {categories.map((category) => (
        <div className="apple-faq-category">
          <h3 className="apple-faq-category-title">{category.title}</h3>
          <div className="apple-faq-items">
            {/* FAQ項目 */}
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

#### 2.2 インタラクション仕様
| 状態 | 実装 | 説明 |
|------|------|------|
| 初期状態 | `useState<Set<string>>` | 開閉状態管理 |
| ホバー | `rgba(0, 122, 255, 0.05)` | 薄い青背景 |
| 開閉アニメーション | `transition: all 0.3s ease` | スムーズな遷移 |
| フォーカス | 2px outline | キーボード対応 |

#### 2.3 アクセシビリティ
```tsx
<button
  onClick={() => toggleItem(categoryIndex, itemIndex)}
  className="apple-faq-question"
  aria-expanded={isOpen}
  aria-controls={`faq-answer-${key}`}
>
  <span className="apple-faq-question-text">
    {item.question}
  </span>
</button>
```

### 3. Footer Component

#### 3.1 基本構造
```tsx
// src/components/layout/Footer.tsx
<footer className="apple-footer">
  <div className="apple-container">
    <div className="apple-footer-content">
      <div className="apple-footer-links">
        {/* リンクセクション */}
      </div>
      <div className="apple-footer-bottom">
        {/* ブランド情報 + メタ情報 */}
      </div>
    </div>
  </div>
</footer>
```

#### 3.2 グリッドレイアウト
```css
.apple-footer-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 48px 32px;
}

/* モバイル調整 */
@media (max-width: 768px) {
  .apple-footer-links {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px 24px;
  }
}
```

## 共通設計パターン

### 1. セクション構造パターン
```tsx
// 標準的なセクション構造
<section className="apple-section [apple-section-alt]">
  <div className="apple-container">
    <div className="apple-section-header">
      <h2 className="apple-title1">セクションタイトル</h2>
      <p className="apple-body-large apple-text-secondary">
        説明文
      </p>
    </div>
    {/* コンテンツ */}
  </div>
</section>
```

### 2. カードコンポーネントパターン
```css
.apple-card-base {
  background: #ffffff;
  border: 1px solid var(--apple-gray-300);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.apple-card-base:hover {
  border-color: var(--apple-blue);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
```

### 3. ボタンパターン
```css
.apple-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.apple-button-primary {
  background: var(--apple-blue);
  color: #ffffff;
}

.apple-button-large {
  min-height: 48px;
  padding: 16px 32px;
}
```

## 実装時のベストプラクティス

### 1. CSS設計方針
- **BEM命名規則**: `apple-component__element--modifier`
- **カスケード回避**: コンポーネント単位でスコープ化
- **CSS Custom Properties**: デザイントークン活用
- **モバイルファースト**: `min-width`ブレークポイント

### 2. TypeScript型定義
```tsx
// 共通プロパティ型
interface AppleComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 特定コンポーネント型
interface PricingPlan {
  id: string;
  name: string;
  price: string;
  features: PlanFeature[];
  popular?: boolean;
}
```

### 3. アクセシビリティ必須実装
```tsx
// セマンティックHTML
<main id="main-content">
  <section aria-labelledby="section-title">
    <h2 id="section-title">セクションタイトル</h2>
  </section>
</main>

// ARIA属性
<button
  aria-expanded={isExpanded}
  aria-controls="controlled-element"
  aria-label="詳細説明"
>
```

### 4. パフォーマンス考慮
```css
/* GPU層生成でアニメーション最適化 */
.apple-component {
  transform: translateZ(0);
  will-change: transform;
}

/* reduced-motion対応 */
@media (prefers-reduced-motion: reduce) {
  .apple-component {
    transition: none;
  }
}
```

## テスト項目チェックリスト

### 1. 視覚テスト
- [ ] フォントサイズが仕様通り
- [ ] スペーシングが8px Grid準拠
- [ ] カラーがApple System Colors
- [ ] ホバー/フォーカス状態正常

### 2. インタラクションテスト
- [ ] タッチターゲット44px以上
- [ ] キーボード操作可能
- [ ] スクリーンリーダー対応
- [ ] アニメーション適切速度

### 3. レスポンシブテスト
- [ ] モバイル(320px-767px)正常
- [ ] タブレット(768px-1023px)正常  
- [ ] デスクトップ(1024px+)正常
- [ ] フォントサイズ自動調整

### 4. ブラウザテスト
- [ ] Safari (iOS/macOS)
- [ ] Chrome (Android/Desktop)
- [ ] Firefox
- [ ] Edge

## 今後の拡張指針

### 1. 新規コンポーネント作成時
1. Apple HIGガイドライン確認
2. 既存パターンの踏襲
3. アクセシビリティ配慮
4. レスポンシブ対応
5. パフォーマンス最適化

### 2. 既存コンポーネント更新時
1. 後方互換性維持
2. 段階的移行戦略
3. 十分なテスト実施
4. ドキュメント更新

### 3. デザインシステム進化
- ダークモード対応
- アニメーション強化
- 多言語対応
- カスタムテーマ機能

---

**作成日**: 2024年10月26日  
**更新者**: 開発チーム  
**バージョン**: v1.0.0