'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
  fallbackSrc?: string;
  fallbackText?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  sizes,
  fill = false,
  fallbackSrc,
  fallbackText,
  placeholder = 'empty',
  blurDataURL
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Create a simple blur placeholder if none provided
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // Show fallback if error occurred
  if (hasError) {
    if (fallbackSrc) {
      return (
        <Image
          src={fallbackSrc}
          alt={alt}
          width={width}
          height={height}
          className={className}
          priority={priority}
          sizes={sizes}
          fill={fill}
          onLoad={handleImageLoad}
        />
      );
    }

    // Show text fallback or placeholder
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={fill ? undefined : { width, height }}
      >
        {fallbackText || (
          <svg 
            className="w-8 h-8"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading skeleton */}
      {isLoading && (
        <div 
          className={`absolute inset-0 animate-pulse bg-gray-200 ${className}`}
          style={fill ? undefined : { width, height }}
        />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        priority={priority}
        sizes={sizes}
        fill={fill}
        placeholder={placeholder}
        blurDataURL={blurDataURL || defaultBlurDataURL}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
}

// Specialized components for common use cases
interface LogoImageProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  organizationName?: string;
}

export function LogoImage({ 
  src, 
  alt, 
  size = 'md', 
  className = '',
  organizationName 
}: LogoImageProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const dimensions = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 80, height: 80 }
  };

  const fallbackText = organizationName ? organizationName.charAt(0) : undefined;

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimensions[size].width}
      height={dimensions[size].height}
      className={`${sizeClasses[size]} rounded-md object-contain bg-white border border-gray-200 ${className}`}
      fallbackText={fallbackText}
      priority={size === 'lg' || size === 'xl'}
    />
  );
}

interface CoverImageProps {
  src: string;
  alt: string;
  aspectRatio?: 'square' | 'video' | 'wide' | 'tall';
  className?: string;
  priority?: boolean;
}

export function CoverImage({ 
  src, 
  alt, 
  aspectRatio = 'video', 
  className = '',
  priority = false 
}: CoverImageProps) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
    tall: 'aspect-[4/5]'
  };

  return (
    <div className={`relative overflow-hidden ${aspectClasses[aspectRatio]} ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}

interface AvatarImageProps {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  userName?: string;
}

export function AvatarImage({ 
  src, 
  alt, 
  size = 'md', 
  className = '',
  userName 
}: AvatarImageProps) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const dimensions = {
    xs: { width: 24, height: 24 },
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 }
  };

  const fallbackText = userName ? userName.charAt(0).toUpperCase() : undefined;

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimensions[size].width}
      height={dimensions[size].height}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      fallbackText={fallbackText}
    />
  );
}