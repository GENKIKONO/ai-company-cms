'use client';

import { useState, useEffect, useRef } from 'react';
import {
  generateOptimizedImageUrl,
  generateResponsiveImageUrls,
  generateSrcSet,
  createLazyLoadObserver,
  selectOptimalImageFormat,
  validateImageUrl,
  preloadImage,
  extractImageColors,
  type ImageOptimizationOptions
} from '@/lib/utils/image-optimization';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  quality?: number;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  breakpoints?: number[];
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  loading = 'lazy',
  quality = 85,
  sizes,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  breakpoints = [320, 640, 768, 1024, 1280, 1920]
}: OptimizedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [placeholderColor, setPlaceholderColor] = useState('#f3f4f6');
  const [inView, setInView] = useState(priority || loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 画像URL検証
  const isValidImage = validateImageUrl(src);

  // 最適な画像フォーマット選択
  const optimalFormat = selectOptimalImageFormat();

  // 最適化オプション
  const optimizationOptions: ImageOptimizationOptions = {
    width,
    height,
    quality,
    format: optimalFormat,
    fit: objectFit === 'cover' ? 'cover' : 'contain'
  };

  // レスポンシブ画像URL生成
  const responsiveUrls = generateResponsiveImageUrls(src, breakpoints);
  const srcSet = generateSrcSet(responsiveUrls);

  // 最適化された画像URL
  const optimizedSrc = generateOptimizedImageUrl(src, optimizationOptions);

  // Intersection Observer設定（遅延読み込み用）
  useEffect(() => {
    if (priority || loading === 'eager' || !imgRef.current) return;

    observerRef.current = createLazyLoadObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      { rootMargin: '50px 0px' }
    );

    if (observerRef.current && imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, loading]);

  // プリロード処理
  useEffect(() => {
    if (priority && isValidImage) {
      preloadImage(optimizedSrc).catch(() => {
        // プリロード失敗は無視
      });
    }
  }, [priority, optimizedSrc, isValidImage]);

  // プレースホルダー色抽出
  useEffect(() => {
    if (placeholder === 'blur' && !blurDataURL && isValidImage) {
      extractImageColors(src)
        .then(({ dominant }) => {
          setPlaceholderColor(dominant);
        })
        .catch(() => {
          // 色抽出失敗時はデフォルト色を使用
        });
    }
  }, [src, placeholder, blurDataURL, isValidImage]);

  // 画像読み込み処理
  const handleLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    setImageLoaded(false);
    onError?.();
  };

  // エラー時のフォールバック
  if (imageError || !isValidImage) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 text-gray-500 ${className}`}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          aspectRatio: width && height ? `${width}/${height}` : undefined
        }}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  // スタイル計算
  const imageStyle: React.CSSProperties = {
    objectFit: objectFit,
    objectPosition: objectPosition,
    width: fill ? '100%' : width,
    height: fill ? '100%' : height,
    transition: 'opacity 0.3s ease-in-out',
    opacity: imageLoaded ? 1 : 0
  };

  const placeholderStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: placeholderColor,
    backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: blurDataURL ? 'blur(8px)' : undefined,
    transition: 'opacity 0.3s ease-in-out',
    opacity: imageLoaded ? 0 : 1,
    zIndex: -1
  };

  const containerStyle: React.CSSProperties = {
    position: fill ? 'absolute' : 'relative',
    width: fill ? '100%' : width,
    height: fill ? '100%' : height,
    inset: fill ? 0 : undefined,
    display: 'inline-block'
  };

  return (
    <div style={containerStyle} className={fill ? 'absolute inset-0' : ''}>
      {/* プレースホルダー */}
      {placeholder !== 'empty' && (
        <div style={placeholderStyle} aria-hidden="true" />
      )}
      
      {/* 画像 */}
      {inView && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          className={className}
          style={imageStyle}
          loading={loading}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          draggable={false}
        />
      )}
      
      {/* プリロード用link要素（priority時のみ） */}
      {priority && typeof document !== 'undefined' && (
        <link
          rel="preload"
          as="image"
          href={optimizedSrc}
          imageSizes={sizes}
          imageSrcSet={srcSet}
        />
      )}
    </div>
  );
}

export default OptimizedImage;

/**
 * 背景画像最適化フック
 */
export function useOptimizedBackgroundImage(
  src: string,
  options: ImageOptimizationOptions = {}
) {
  const [optimizedUrl, setOptimizedUrl] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!validateImageUrl(src)) {
      setOptimizedUrl('');
      return;
    }

    const optimized = generateOptimizedImageUrl(src, options);
    setOptimizedUrl(optimized);

    // プリロード
    preloadImage(optimized)
      .then(() => setIsLoaded(true))
      .catch(() => setIsLoaded(false));
  }, [src, options.width, options.height, options.quality, options.format]);

  return { url: optimizedUrl, isLoaded };
}

/**
 * 画像ギャラリー用コンポーネント
 */
export interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  className?: string;
  itemClassName?: string;
  quality?: number;
  sizes?: string;
}

export function ImageGallery({
  images,
  className = '',
  itemClassName = '',
  quality = 85,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
}: ImageGalleryProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {images.map((image, index) => (
        <figure key={index} className={`relative ${itemClassName}`}>
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            fill
            quality={quality}
            sizes={sizes}
            className="rounded-lg"
            priority={index < 3} // 最初の3枚を優先読み込み
          />
          {image.caption && (
            <figcaption className="mt-2 text-sm text-gray-600">
              {image.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}