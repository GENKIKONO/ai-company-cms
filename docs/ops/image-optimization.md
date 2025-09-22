# 画像最適化とVercel料金体系について

## 概要

Next.js の `next/image` を使用すると、ESLint で以下の警告が表示される場合があります：

```
Warning: Using <img> could result in slower LCP and higher bandwidth. 
Consider using <Image /> from next/image to automatically optimize images. 
This may incur additional usage or cost from your provider.
```

この「追加料金」の正体とLuxuCareプロジェクトでの対応方針について説明します。

## 「追加料金」の正体：Vercel Image Optimization

### 仕組み
- Vercelでは `next/image` を使用すると、**Vercel Image Optimization** が自動的に有効化されます
- リクエスト時にオンデマンドで画像を最適化（WebP/AVIF変換、リサイズ、品質調整）
- 最適化された画像はVercelのCDNでキャッシュされます

### 課金対象
- **画像変換リクエスト数**：初回アクセス時の最適化処理
- **転送量（帯域幅）**：最適化された画像の配信量
- **参考リンク**：[Vercel Pricing - Image Optimization](https://vercel.com/pricing)

## 料金が増加するケース

### 高コストになりやすいパターン
1. **大量の大きな画像**
   - 高解像度の画像（4K、8K）
   - ファイルサイズが数MBを超える画像

2. **キャッシュ未ヒット**
   - 新しい画像や稀にアクセスされる画像
   - 異なるサイズバリエーションの大量生成

3. **高解像度ディスプレイ対応**
   - Retina等での2x、3x画像
   - `sizes` 属性で多数のブレークポイント指定

4. **外部画像の大量使用**
   - 外部URLからの画像を `next/image` で処理する場合

## LuxuCareプロジェクトの推奨方針

### 基本方針：next/image優先 + 適切な最適化

```tsx
import Image from 'next/image';

// ✅ 推奨：適切なsizesとplaceholder指定
<Image
  src="/hero-image.jpg"
  alt="企業ロゴ"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
  quality={85}
/>
```

### 外部画像の設定

`next.config.js` で外部ドメインを許可：

```javascript
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};
```

## 費用抑制オプション

### Option 1: 事前最適化 + next/image
```bash
# 画像を事前にWebPで最適化
npx sharp-cli --input ./public/images --output ./public/images/optimized --format webp
```

### Option 2: 最適化無効化（費用ゼロ優先）
```javascript
// next.config.js
module.exports = {
  images: {
    unoptimized: true, // Vercel最適化を使わない
  },
};
```

### Option 3: 外部画像CDN使用
```javascript
// next.config.js
module.exports = {
  images: {
    loader: 'cloudinary', // Cloudinary等を使用
    path: 'https://res.cloudinary.com/[cloud_name]/image/fetch/',
  },
};
```

## 採用判断基準

| 条件 | 推奨オプション | 理由 |
|------|---------------|------|
| 月間PV < 10,000 | Option 2 (unoptimized) | 費用対効果を重視 |
| 月間PV 10,000〜100,000 | Option 1 (事前最適化) | バランス型 |
| 月間PV > 100,000 | next/image標準 | パフォーマンス優先 |
| 国際配信あり | 外部CDN (Option 3) | 地域分散配信 |
| 動的画像多数 | next/image標準 | オンデマンド最適化必須 |

## 運用SOP（標準作業手順）

### 新規画像追加時のチェックリスト

1. **推奨仕様**
   - ✅ 最大幅：1600px以下
   - ✅ フォーマット：WebP or JPEG
   - ✅ ファイルサイズ：500KB以下

2. **必須属性**
   - ✅ `alt` 属性（アクセシビリティ）
   - ✅ `width` / `height` または `fill`
   - ✅ 適切な `sizes` 属性

3. **推奨設定**
   - ✅ `placeholder="blur"` でLQIP
   - ✅ `quality={85}` で品質調整
   - ✅ `priority={true}` はLCP対象画像のみ

### 例外対応

SVGアイコンや装飾画像で `next/image` が不要な場合：

```tsx
{/* eslint-disable @next/next/no-img-element */}
<img src="/icon.svg" alt="" role="presentation" />
```

**注意**：例外は最小限にとどめ、理由をコメントで明記してください。

## モニタリング

### 確認項目
- Vercelダッシュボードでの画像最適化使用量
- Core Web Vitals (LCP) のスコア
- 月次画像転送量の推移

### アラート基準
- 画像最適化コストが月額予算の50%を超過
- LCPスコアが2.5秒を超過

## 関連リンク

- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Vercel Image Optimization Pricing](https://vercel.com/pricing)
- [Web.dev - Optimize LCP](https://web.dev/optimize-lcp/)
- [Sharp (画像処理ライブラリ)](https://sharp.pixelplumbing.com/)

---

**最終更新**：2024年12月 | **次回見直し**：2025年3月