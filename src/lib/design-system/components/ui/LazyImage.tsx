/**
 * LazyImage コンポーネント
 * 要件定義準拠: パフォーマンス最適化、遅延読み込み
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '../../../performance';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  fallback,
  width,
  height,
  priority = false,
  quality = 75,
  className,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState<string>('');
  const [ref, isIntersecting] = useIntersectionObserver({
    rootMargin: '50px',
    threshold: 0.1,
  });

  // Load image when component mounts (priority) or when intersecting
  const shouldLoad = priority || isIntersecting;

  React.useEffect(() => {
    if (!shouldLoad || imageSrc) return;

    // Generate optimized image URL
    let optimizedSrc = src;
    if (src.startsWith('/') && (width || height || quality !== 75)) {
      const params = new URLSearchParams();
      if (width) params.set('w', width.toString());
      if (height) params.set('h', height.toString());
      if (quality !== 75) params.set('q', quality.toString());
      
      optimizedSrc = `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`;
    }

    // Preload image
    const img = new Image();
    img.onload = () => {
      setImageSrc(optimizedSrc);
      setIsLoaded(true);
      onLoad?.();
    };
    img.onerror = () => {
      setHasError(true);
      if (fallback) {
        setImageSrc(fallback);
        setIsLoaded(true);
      }
      onError?.();
    };
    img.src = optimizedSrc;
  }, [shouldLoad, src, width, height, quality, fallback, imageSrc, onLoad, onError]);

  // Show placeholder while loading
  if (!isLoaded && !hasError) {
    return (
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={cn(
          'bg-muted animate-pulse flex items-center justify-center',
          className
        )}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          aspectRatio: width && height ? `${width}/${height}` : undefined,
        }}
        aria-label={`${alt} - 読み込み中`}
      >
        {placeholder && (
          <span className="text-muted-foreground text-sm">{placeholder}</span>
        )}
      </div>
    );
  }

  // Show error state
  if (hasError && !fallback) {
    return (
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={cn(
          'bg-muted flex items-center justify-center border border-dashed border-muted-foreground/25',
          className
        )}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          aspectRatio: width && height ? `${width}/${height}` : undefined,
        }}
        aria-label={`${alt} - 読み込みエラー`}
      >
        <span className="text-muted-foreground text-sm">画像を読み込めません</span>
      </div>
    );
  }

  // Show loaded image
  return (
    <img
      ref={ref as React.RefObject<HTMLImageElement>}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      {...props}
    />
  );
};

// Progressive Image Component with Blur-up Effect
export interface ProgressiveImageProps extends LazyImageProps {
  blurDataURL?: string;
  sizes?: string;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  blurDataURL,
  sizes,
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [currentSrc, setCurrentSrc] = React.useState(blurDataURL || '');

  const handleImageLoad = () => {
    setIsLoaded(true);
    props.onLoad?.();
  };

  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
    if (props.onError) {
      img.onerror = () => props.onError?.();
    }
    img.src = src;
  }, [src, props.onError]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {blurDataURL && (
        <img
          src={blurDataURL}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500 blur-sm scale-105',
            isLoaded ? 'opacity-0' : 'opacity-100'
          )}
          aria-hidden="true"
        />
      )}
      <LazyImage
        {...props}
        src={currentSrc || src}
        alt={alt}
        className={cn(
          'relative z-10 transition-opacity duration-500',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={handleImageLoad}
      />
    </div>
  );
};