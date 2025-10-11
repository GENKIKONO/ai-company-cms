# 画像見切れ防止ガイドライン

## 概要

このドキュメントでは、AIO Hubプラットフォームにおける画像・装飾要素の見切れ防止のためのガイドラインとベストプラクティスを説明します。

## 基本原則

### 1. 人物・ロゴ・スクリーンショット：`contain` 原則

写真、ロゴ、アイコン、スクリーンショットなど、内容の全体が重要な画像には `media-contain` クラスを使用します。

```tsx
// ✅ 正しい使い方
<Image 
  src="/logo.png" 
  alt="Company Logo"
  className="media-contain"
  width={200}
  height={100}
/>

// ❌ 避けるべき使い方
<Image 
  src="/logo.png" 
  alt="Company Logo"
  className="object-cover" // ロゴが切り取られる可能性
  width={200}
  height={100}
/>
```

### 2. 抽象装飾・背景グラデーション：`bg-deco-safe` で可変スケール

装飾目的の背景画像や抽象的なグラフィックには `bg-deco-safe` クラスを使用します。

```tsx
// ✅ 正しい使い方
<section className="bg-deco-safe" style={{backgroundImage: 'url(/decorations/pattern.svg)'}}>
  <div className="content-above-deco">
    {/* コンテンツ */}
  </div>
</section>
```

### 3. 配置装飾：`deco-wrap` + `deco-img` 構造

positioned要素による装飾は、安全な配置構造を使用します。

```tsx
// ✅ 正しい使い方
<section className="deco-wrap">
  <div className="deco-img">
    <svg className="media-contain">
      {/* 装飾SVG */}
    </svg>
  </div>
  <div className="content-above-deco">
    {/* メインコンテンツ */}
  </div>
</section>
```

## 利用可能なCSSクラス

### 画像・メディア制御

```css
/* 画像の見切れ防止 */
.media-contain {
  object-fit: contain;
  object-position: center;
}

.media-cover {
  object-fit: cover;
  object-position: center;
}

/* アスペクト比固定フレーム */
.media-frame {
  aspect-ratio: var(--media-ar, 16/9);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 装飾・背景制御

```css
/* 背景装飾の安全スケーリング */
.bg-deco-safe {
  background-repeat: no-repeat;
  background-position: center;
  background-size: clamp(560px, 80vw, 1200px) auto;
}

/* 装飾配置コンテナ */
.deco-wrap {
  position: relative;
  overflow: visible;
}

.deco-img {
  position: absolute;
  inset: 0;
  margin: auto;
  max-width: min(90%, 1200px);
  height: auto;
  z-index: -1;
}
```

### コンテンツ制御

```css
/* CTA等の安全な最小高 */
.cta-safe-minh {
  min-height: clamp(320px, 48vw, 540px);
  padding-block: clamp(40px, 8vw, 88px);
}

/* コンテンツを装飾より前面に */
.content-above-deco {
  position: relative;
  z-index: 10;
}
```

## 実装パターン

### パターン1: ヒーローセクションの画像

```tsx
export function HeroSection() {
  return (
    <section className="deco-wrap hero-gap bg-gradient-to-br from-blue-50 to-purple-50">
      {/* 背景装飾 - SVGで安全に配置 */}
      <div className="deco-img opacity-30">
        <svg width="100%" height="100%" viewBox="0 0 1200 800" className="media-contain">
          <circle cx="300" cy="200" r="120" fill="#bfdbfe" />
          <circle cx="900" cy="300" r="120" fill="#c4b5fd" />
        </svg>
      </div>
      
      <div className="container-hero content-above-deco">
        {/* メインコンテンツ */}
        <div className="media-frame" style={{'--media-ar': '16/9'} as React.CSSProperties}>
          <Image 
            src="/hero-image.jpg"
            alt="Hero Image"
            fill
            className="media-contain"
          />
        </div>
      </div>
    </section>
  );
}
```

### パターン2: 機能カードのアイコン

```tsx
export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="card p-6">
      <div className="media-frame w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4" 
           style={{'--media-ar': '1/1'} as React.CSSProperties}>
        <Icon className="w-8 h-8 text-blue-600 media-contain" />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
```

### パターン3: CTAセクション

```tsx
export function CTASection() {
  return (
    <section className="deco-wrap cta-safe-minh bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="container-article content-above-deco">
        <h2>今すぐ始めましょう</h2>
        <p>あなたの企業情報をAI時代に最適化</p>
        <button>無料で始める</button>
      </div>
    </section>
  );
}
```

## 最小高・余白の基準値

### CTAセクション
- 最小高：`clamp(320px, 48vw, 540px)`
- 上下余白：`clamp(40px, 8vw, 88px)`

### 装飾要素の余白
- 親コンテナ内に90%以内で収まること
- 左右上下の余白 ≥ 5%

### レスポンシブブレイクポイント
- Mobile: 375px〜414px
- Tablet: 768px
- Desktop Small: 1024px
- Desktop Large: 1440px

## 受け入れ基準

### 各ブレイクポイントでの要件

1. **画像の naturalWidth:naturalHeight 比率維持**
   - `media-contain` クラスを使用した画像は原寸比を保持
   - 許容誤差：10%以内

2. **装飾の切り取り防止**
   - 背景装飾がビューポート外にオーバーフローしない
   - `deco-img` 内の要素がコンテナ内に収まる

3. **重要コンテンツとの重複回避**
   - CTAテキスト・ボタンと装飾の重複 ≤ 10%
   - `content-above-deco` の適切な z-index 設定

4. **最小寸法の確保**
   - CTAセクションが指定最小高を満たす
   - アイコン・画像が10px以上の表示サイズ

## テスト実行

E2Eテストによる自動検証：

```bash
# 全ブレイクポイントでのメディア表示テスト
npx playwright test tests/e2e/media-cropping.spec.ts

# 特定ページのみテスト  
npx playwright test tests/e2e/media-cropping.spec.ts --grep "Home Page"

# スクリーンショット生成付きテスト
npx playwright test tests/e2e/media-cropping.spec.ts --headed
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. ロゴ・アイコンが切り取られる
```tsx
// 問題のあるコード
<img src="/logo.png" className="w-16 h-16 object-cover" />

// 修正後
<div className="media-frame w-16 h-16" style={{'--media-ar': '1/1'} as React.CSSProperties}>
  <img src="/logo.png" className="media-contain" />
</div>
```

#### 2. 背景装飾がはみ出す
```tsx
// 問題のあるコード  
<div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full" />

// 修正後
<div className="deco-wrap">
  <div className="deco-img">
    <svg className="media-contain">
      <circle cx="200" cy="150" r="80" fill="#bfdbfe" />
    </svg>
  </div>
</div>
```

#### 3. CTAセクションが低すぎる
```tsx
// 問題のあるコード
<section className="py-12">

// 修正後  
<section className="cta-safe-minh">
```

## メンテナンス

### 新規コンポーネント追加時のチェックリスト

- [ ] 画像・アイコンに適切な `media-contain/media-cover` クラス
- [ ] 装飾要素に `deco-wrap` + `deco-img` 構造
- [ ] コンテンツに `content-above-deco` クラス
- [ ] CTAセクションに `cta-safe-minh` クラス
- [ ] `media-frame` に適切な `--media-ar` 設定
- [ ] E2Eテストでの検証実行

### 既存コンポーネント更新時のチェックリスト

- [ ] `object-fit: cover` から `media-contain` への移行検討
- [ ] absolute positioned装飾の `deco-img` への移行
- [ ] 固定サイズ設定の responsive clamp() への置換
- [ ] z-index競合の解決
- [ ] 全ブレイクポイントでの表示確認

このガイドラインに従うことで、すべてのデバイス・画面サイズで一貫した、見切れのない美しいUI体験を提供できます。