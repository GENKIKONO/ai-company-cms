/**
 * 画像最適化ユーティリティ
 * 要件定義準拠: LCP < 2.5秒達成のための画像最適化
 */

import { NextRequest, NextResponse } from 'next/server';

// 画像最適化設定
export interface ImageOptimizationConfig {
  quality: number;
  format: 'webp' | 'avif' | 'jpeg' | 'png';
  width?: number;
  height?: number;
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

// プリセット設定
export const IMAGE_PRESETS = {
  thumbnail: {
    quality: 80,
    format: 'webp' as const,
    width: 300,
    height: 200,
    fit: 'cover' as const
  },
  card: {
    quality: 85,
    format: 'webp' as const,
    width: 400,
    height: 300,
    fit: 'cover' as const
  },
  hero: {
    quality: 90,
    format: 'webp' as const,
    width: 1200,
    height: 600,
    fit: 'cover' as const
  },
  logo: {
    quality: 95,
    format: 'png' as const,
    width: 200,
    height: 200,
    fit: 'contain' as const
  }
} as const;

/**
 * 画像URLの最適化
 */
export function optimizeImageUrl(
  originalUrl: string,
  preset: keyof typeof IMAGE_PRESETS,
  options?: Partial<ImageOptimizationConfig>
): string {
  if (!originalUrl || originalUrl.startsWith('data:')) {
    return originalUrl;
  }

  const config = { ...IMAGE_PRESETS[preset], ...options };
  
  // Next.js Image Optimization API を使用
  const params = new URLSearchParams({
    url: originalUrl,
    w: config.width?.toString() || '800',
    q: config.quality.toString()
  });

  return `/_next/image?${params.toString()}`;
}

/**
 * レスポンシブ画像のsrcSetを生成
 */
export function generateResponsiveSrcSet(
  originalUrl: string,
  baseWidth: number = 400
): string {
  if (!originalUrl || originalUrl.startsWith('data:')) {
    return originalUrl;
  }

  const sizes = [1, 1.5, 2, 3]; // 1x, 1.5x, 2x, 3x
  
  return sizes
    .map(multiplier => {
      const width = Math.round(baseWidth * multiplier);
      const optimizedUrl = optimizeImageUrl(originalUrl, 'card', { width });
      return `${optimizedUrl} ${multiplier}x`;
    })
    .join(', ');
}

/**
 * 画像遅延読み込み用のプレースホルダー生成
 */
export function generateImagePlaceholder(width: number, height: number): string {
  // Base64エンコードされた小さなプレースホルダー画像
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="var(--color-placeholder-bg)"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="var(--color-placeholder-text)" font-family="sans-serif" font-size="14">
        読み込み中...
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * 画像フォーマット検出とサポート確認
 */
export function detectSupportedImageFormat(userAgent: string): 'avif' | 'webp' | 'jpeg' {
  // Chrome 85+, Firefox 93+でAVIFサポート
  if (userAgent.includes('Chrome/') && parseInt(userAgent.match(/Chrome\/(\d+)/)?.[1] || '0') >= 85) {
    return 'avif';
  }
  
  // Chrome 23+, Firefox 65+, Safari 14+でWebPサポート
  if (userAgent.includes('Chrome/') || 
      (userAgent.includes('Firefox/') && parseInt(userAgent.match(/Firefox\/(\d+)/)?.[1] || '0') >= 65) ||
      (userAgent.includes('Safari/') && parseInt(userAgent.match(/Version\/(\d+)/)?.[1] || '0') >= 14)) {
    return 'webp';
  }
  
  return 'jpeg';
}

/**
 * Critical Resource Hintsの生成
 */
export function generateCriticalResourceHints(imageUrls: string[]): string {
  return imageUrls
    .slice(0, 3) // 最初の3つの画像のみ
    .map(url => {
      const optimizedUrl = optimizeImageUrl(url, 'hero');
      return `<link rel="preload" as="image" href="${optimizedUrl}">`;
    })
    .join('\n');
}

/**
 * 画像圧縮設定の自動調整
 */
export function getAdaptiveQuality(
  imageType: 'photo' | 'graphic' | 'logo',
  connectionSpeed: 'slow' | 'fast' = 'fast'
): number {
  const baseQuality = {
    photo: 85,
    graphic: 90,
    logo: 95
  };
  
  const adjustment = connectionSpeed === 'slow' ? -10 : 0;
  return Math.max(60, baseQuality[imageType] + adjustment);
}

/**
 * 画像の遅延読み込み設定
 */
export interface LazyLoadingConfig {
  threshold: number; // viewportからの距離（px）
  rootMargin: string; // Intersection Observer用のマージン
  placeholder: boolean; // プレースホルダー画像の使用
  blurHash?: string; // BlurHash文字列
}

export const LAZY_LOADING_PRESETS = {
  aggressive: {
    threshold: 0,
    rootMargin: '50px',
    placeholder: true
  },
  balanced: {
    threshold: 100,
    rootMargin: '100px',
    placeholder: true
  },
  conservative: {
    threshold: 200,
    rootMargin: '200px',
    placeholder: false
  }
} as const;

/**
 * CDN用の画像URL変換
 */
export function transformToCdnUrl(originalUrl: string, cdnDomain?: string): string {
  if (!cdnDomain || originalUrl.startsWith('data:') || originalUrl.startsWith('http')) {
    return originalUrl;
  }
  
  // 相対URLをCDN URLに変換
  if (originalUrl.startsWith('/')) {
    return `https://${cdnDomain}${originalUrl}`;
  }
  
  return originalUrl;
}

/**
 * 画像最適化の統計情報
 */
export class ImageOptimizationStats {
  private static stats = {
    totalRequests: 0,
    cacheHits: 0,
    totalBytesSaved: 0,
    averageCompressionRatio: 0
  };
  
  static recordOptimization(originalSize: number, optimizedSize: number, fromCache: boolean = false) {
    this.stats.totalRequests++;
    if (fromCache) this.stats.cacheHits++;
    
    const bytesSaved = originalSize - optimizedSize;
    this.stats.totalBytesSaved += bytesSaved;
    
    const compressionRatio = optimizedSize / originalSize;
    this.stats.averageCompressionRatio = 
      (this.stats.averageCompressionRatio * (this.stats.totalRequests - 1) + compressionRatio) / 
      this.stats.totalRequests;
  }
  
  static getStats() {
    return {
      ...this.stats,
      cacheHitRate: this.stats.cacheHits / this.stats.totalRequests,
      averageBytesSavedPerRequest: this.stats.totalBytesSaved / this.stats.totalRequests
    };
  }
  
  static resetStats() {
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      totalBytesSaved: 0,
      averageCompressionRatio: 0
    };
  }
}

/**
 * 画像最適化ミドルウェア
 */
export async function imageOptimizationMiddleware(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  // 画像リクエストの最適化ヘッダーを追加
  if (request.nextUrl.pathname.startsWith('/_next/image')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('X-Image-Optimized', 'true');
  }
  
  return response;
}