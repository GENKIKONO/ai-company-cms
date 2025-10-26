# Apple HIG準拠 - 包括的改善要件定義

## 🎯 プロジェクト概要

**目標**: 現在のAIO Hubウェブサイトを、Apple Human Interface Guidelines（HIG）に完全準拠した、真のApple品質体験に変革する。

**評価基準**: Apple.com、iPhone製品ページ、macOS Sonoma等の公式サイトレベルの品質達成

---

## 📋 改善要件マトリックス

### **優先度S（Critical - 即座対応必須）**

#### **SR-01: Typography System 完全再構築**

**現状問題**:
- System Font未使用（-apple-system無効）
- 階層が不明確（H1-H6のサイズ差1.2倍程度）
- 行間が重い（line-height: 1.75）
- letter-spacing過多

**改善要件**:
```css
/* Apple準拠Typography Scale */
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif;

--font-size-display: clamp(64px, 10vw, 96px);     /* Hero用 - 大胆なサイズ */
--font-size-title1: clamp(36px, 6vw, 48px);       /* Section見出し */
--font-size-title2: clamp(28px, 5vw, 36px);       /* Sub見出し */
--font-size-title3: clamp(22px, 4vw, 28px);       /* Card見出し */
--font-size-body: 17px;                           /* 本文 - Apple標準 */
--font-size-body-large: 19px;                     /* リード文 */
--font-size-caption: 13px;                        /* 補足情報 */

--line-height-display: 1.05;                      /* 超タイト */
--line-height-title: 1.15;                        /* タイト */
--line-height-body: 1.47;                         /* 自然 */

--letter-spacing-display: -0.022em;               /* 負の文字間 */
--letter-spacing-title: -0.016em;
--letter-spacing-body: -0.011em;
```

**適用基準**:
- Display: Hero、主要CTAのみ使用
- Title1: セクション見出し統一
- Title2: サブセクション限定
- Body: 本文は17px固定、例外なし

#### **SR-02: 8px Grid System 厳格適用**

**現状問題**:
- py-24（96px）等、8px倍数外の値使用
- margin/padding不統一
- 要素間隔がバラバラ

**改善要件**:
```css
/* 8px Base Unit厳守 */
--space-0: 0px;
--space-1: 8px;      /* 最小間隔 */
--space-2: 16px;     /* 要素間 */
--space-3: 24px;     /* カード内余白 */
--space-4: 32px;     /* セクション内間隔 */
--space-5: 40px;     /* 小セクション間 */
--space-6: 48px;     /* カード間 */
--space-8: 64px;     /* セクション間 - 固定 */
--space-10: 80px;    /* 大セクション間 */
--space-12: 96px;    /* Hero専用 */

/* 禁止事項 */
❌ py-20, py-24, py-28 等の8px倍数外
❌ clamp()でのnon-8px値
❌ 独自margin/padding値
```

**適用ルール**:
- セクション間: 必ず64px（--space-8）
- カード間: 必ず48px（--space-6）
- 要素間: 16px or 24px のみ
- 例外なし

#### **SR-03: Interactive Elements 44px準拠**

**現状問題**:
- 44px未満のボタン存在
- hover/active feedback不足
- focus-visible未実装

**改善要件**:
```css
/* Apple Touch Target基準 */
.interactive-element {
  min-height: 44px !important;
  min-width: 44px !important;
  
  /* Apple標準フィードバック */
  transition: transform 0.15s ease-out;
}

.interactive-element:hover {
  transform: translateY(-1px) scale(1.01);
}

.interactive-element:active {
  transform: scale(0.96);
  transition-duration: 0.1s;
}

.interactive-element:focus-visible {
  outline: 2px solid #007AFF;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.2);
}
```

**適用対象**:
- 全てのボタン
- 全てのリンク  
- カードのクリック可能エリア
- フォーム要素

---

### **優先度A（High - 2週間以内）**

#### **AR-01: Content Strategy 簡潔化**

**現状問題**:
- 文章が冗長
- 情報密度過多
- 価値提案不明確

**改善要件**:

**Hero Section**:
```
現在: 「構造化された企業情報で、AI検索・ChatGPT回答での露出を確保。新たなビジネス機会を創出する次世代企業CMSです。」(67文字)

改善: 「AIに選ばれる企業になる」(11文字)
リード: 「構造化データで、確実な検索露出」(17文字)
```

**Section見出し簡潔化**:
- 現在の50%の文字数に削減
- 1概念1セクション原則
- 不要な説明文削除

#### **AR-02: Visual Hierarchy 明確化**

**改善要件**:
- Hero: 画面の70%を占有
- 重要CTA: 他より1.5倍大きく
- 副次情報: opacity 0.6で格下げ
- セクション: 最大5個まで削減

#### **AR-03: Color System統一**

**現状問題**:
- 青色が複数混在
- グラデーション過多
- コントラスト不統一

**改善要件**:
```css
/* Apple System Colors厳守 */
--color-blue: #007AFF;        /* 全ての青統一 */
--color-text-primary: #1D1D1F;   /* Apple標準黒 */
--color-text-secondary: #86868B; /* Apple標準グレー */
--color-background: #FFFFFF;     /* 純白背景 */
--color-surface: #F2F2F7;       /* Apple標準サーフェス */

/* 禁止カラー */
❌ #3B82F6, #2563EB 等のTailwind Blue
❌ グラデーション（hero以外）
❌ opacity < 0.6 の文字色
```

---

### **優先度B（Medium - 1ヶ月以内）**

#### **BR-01: Animation 目的明確化**

**現状問題**:
- 装飾的アニメーション過多
- easing不適切
- パフォーマンス最適化不足

**改善要件**:
```css
/* Apple標準easing */
--ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
--ease-accelerate: cubic-bezier(0.4, 0.0, 1, 1);

/* アニメーション原則 */
1. 機能的目的のみ（装飾禁止）
2. 0.15s-0.3s の短時間
3. GPU加速必須
4. reduced-motion対応
```

**許可アニメーション**:
- Button feedback（機能）
- Page transition（ナビゲーション）
- Loading state（状態表示）
- Scroll reveal（コンテンツ表示）

**禁止アニメーション**:
- 浮遊エフェクト
- 回転・拡大縮小（feedback以外）
- パーティクル
- 装飾的グラデーション

#### **BR-02: Accessibility 完全対応**

**改善要件**:
- WCAG 2.1 AA準拠
- コントラスト比 4.5:1以上
- キーボードナビゲーション完備
- スクリーンリーダー対応

#### **BR-03: Performance 最適化**

**要件**:
- Core Web Vitals緑評価
- LCP < 2.5s
- FID < 100ms  
- CLS < 0.1

---

## 🎨 実装フェーズ

### **Phase 1: Foundation (1週間)**
1. Typography System完全再構築
2. 8px Grid System適用
3. Color System統一
4. Interactive Elements 44px化

### **Phase 2: Content (1週間)**  
1. Hero Section簡潔化
2. Section削減・統合
3. CTA階層明確化
4. 不要コンテンツ削除

### **Phase 3: Polish (1週間)**
1. Animation最適化
2. Accessibility対応
3. Performance調整
4. 最終品質検証

---

## ✅ 成功基準

### **定量評価**:
- Typography: System Font使用率100%
- Spacing: 8px倍数遵守率100%  
- Interactive: 44px準拠率100%
- Performance: Core Web Vitals緑評価
- Accessibility: WCAG AA準拠

### **定性評価**:
- Apple.comとの視覚的一貫性
- 直感的な操作感
- 情報の明確な階層
- ブランド価値の向上

### **KPI**:
- Page Load速度: 2s以内
- Bounce Rate: 30%以下
- CTA Click Rate: 5%向上
- ユーザビリティスコア: 85以上

---

## 🚨 制約・前提条件

### **技術制約**:
- Next.js 15.5.4環境維持
- Tailwind CSS活用（カスタムCSS追加）
- レスポンシブ対応必須
- SEO影響最小化

### **ビジネス制約**:
- 既存機能の破壊禁止
- ダウンタイム最小化
- A/Bテスト対応
- 段階的リリース可能性

### **品質基準**:
- Apple公式サイトレベルの完成度
- エラー0件
- 全ブラウザ対応
- モバイルファースト

---

**この要件定義に基づいて、真のApple品質体験を実現します。**