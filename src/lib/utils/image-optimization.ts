/**
 * 画像最適化ユーティリティ (I2)
 * 画像のリサイズ、圧縮、フォーマット変換機能
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface OptimizedImageResult {
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

/**
 * 画像最適化URL生成
 * Next.js Image Optimizationを使用
 */
export function generateOptimizedImageUrl(
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): string {
  if (!originalUrl) return '';

  // 外部画像の場合は元のURLをそのまま返す（設定による）
  if (originalUrl.startsWith('http') && !originalUrl.includes(process.env.NEXT_PUBLIC_APP_URL || '')) {
    return originalUrl;
  }

  const params = new URLSearchParams();
  
  if (options.width) params.set('w', options.width.toString());
  if (options.height) params.set('h', options.height.toString());
  if (options.quality) params.set('q', Math.min(100, Math.max(1, options.quality)).toString());
  if (options.format) params.set('f', options.format);
  if (options.fit) params.set('fit', options.fit);

  const queryString = params.toString();
  const separator = originalUrl.includes('?') ? '&' : '?';
  
  return queryString ? `${originalUrl}${separator}${queryString}` : originalUrl;
}

/**
 * レスポンシブ画像URL生成
 * 複数サイズの画像URLを生成
 */
export function generateResponsiveImageUrls(
  originalUrl: string,
  breakpoints: number[] = [320, 640, 768, 1024, 1280]
): Array<{ url: string; width: number }> {
  return breakpoints.map(width => ({
    url: generateOptimizedImageUrl(originalUrl, { width, quality: 85 }),
    width
  }));
}

/**
 * srcSet文字列生成
 */
export function generateSrcSet(urls: Array<{ url: string; width: number }>): string {
  return urls.map(({ url, width }) => `${url} ${width}w`).join(', ');
}

/**
 * 画像プリロード用のlink要素生成
 */
export function generatePreloadLink(
  url: string,
  options: { as?: string; crossorigin?: string; sizes?: string } = {}
): string {
  const { as = 'image', crossorigin, sizes } = options;
  
  let link = `<link rel="preload" href="${url}" as="${as}"`;
  if (crossorigin) link += ` crossorigin="${crossorigin}"`;
  if (sizes) link += ` imagesizes="${sizes}"`;
  link += '>';
  
  return link;
}

/**
 * 画像の遅延読み込み用intersection observer設定
 */
export function createLazyLoadObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !window.IntersectionObserver) {
    return null;
  }

  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px 0px',
    threshold: 0.01,
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
}

/**
 * 画像フォーマット対応チェック
 */
export function getSupportedImageFormats(): {
  webp: boolean;
  avif: boolean;
  jpeg: boolean;
  png: boolean;
} {
  if (typeof window === 'undefined') {
    return { webp: false, avif: false, jpeg: true, png: true };
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  return {
    webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
    avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0,
    jpeg: true,
    png: true,
  };
}

/**
 * 最適な画像フォーマット選択
 */
export function selectOptimalImageFormat(
  supportedFormats = getSupportedImageFormats()
): 'avif' | 'webp' | 'jpeg' {
  if (supportedFormats.avif) return 'avif';
  if (supportedFormats.webp) return 'webp';
  return 'jpeg';
}

/**
 * 画像サイズ計算（アスペクト比保持）
 */
export function calculateImageDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number,
  fit: 'cover' | 'contain' = 'contain'
): { width: number; height: number } {
  if (!targetWidth && !targetHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (targetWidth && targetHeight) {
    const targetAspectRatio = targetWidth / targetHeight;
    
    if (fit === 'cover') {
      if (aspectRatio > targetAspectRatio) {
        return { width: targetHeight * aspectRatio, height: targetHeight };
      } else {
        return { width: targetWidth, height: targetWidth / aspectRatio };
      }
    } else { // contain
      if (aspectRatio > targetAspectRatio) {
        return { width: targetWidth, height: targetWidth / aspectRatio };
      } else {
        return { width: targetHeight * aspectRatio, height: targetHeight };
      }
    }
  }

  if (targetWidth) {
    return { width: targetWidth, height: targetWidth / aspectRatio };
  }

  if (targetHeight) {
    return { width: targetHeight * aspectRatio, height: targetHeight };
  }

  return { width: originalWidth, height: originalHeight };
}

/**
 * 画像URL検証
 */
export function validateImageUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    new URL(url);
    return /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i.test(url);
  } catch {
    return false;
  }
}

/**
 * 画像メタデータ取得
 */
export function getImageMetadata(url: string): Promise<{
  width: number;
  height: number;
  aspectRatio: number;
}> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not available'));
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * 画像プリロード
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to preload image'));
    img.src = url;
  });
}

/**
 * 画像の平均色抽出（プレースホルダー用）
 */
export function extractImageColors(
  imageUrl: string
): Promise<{ dominant: string; palette: string[] }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve({ dominant: '#cccccc', palette: ['#cccccc'] });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve({ dominant: '#cccccc', palette: ['#cccccc'] });
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        let r = 0, g = 0, b = 0;
        const pixelCount = pixels.length / 4;

        for (let i = 0; i < pixels.length; i += 4) {
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
        }

        r = Math.round(r / pixelCount);
        g = Math.round(g / pixelCount);
        b = Math.round(b / pixelCount);

        const dominant = `rgb(${r}, ${g}, ${b})`;
        
        resolve({
          dominant,
          palette: [dominant] // 簡略化、実際の実装ではより詳細なパレット抽出が可能
        });
      } catch (error) {
        resolve({ dominant: '#cccccc', palette: ['#cccccc'] });
      }
    };
    
    img.onerror = () => {
      resolve({ dominant: '#cccccc', palette: ['#cccccc'] });
    };
    
    img.src = imageUrl;
  });
}