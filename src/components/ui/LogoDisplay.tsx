/**
 * LogoDisplay - 企業ロゴ表示用コンポーネント（フォールバック機能付き）
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import LetterAvatar from './LetterAvatar';
import { cn } from '@/lib/utils';

interface LogoDisplayProps {
  logoUrl?: string | null;
  organizationName: string;
  size?: number;
  className?: string;
  rounded?: 'full' | 'lg' | 'md' | 'sm';
  priority?: boolean;
}

export const LogoDisplay: React.FC<LogoDisplayProps> = ({
  logoUrl,
  organizationName,
  size = 48,
  className,
  rounded = 'lg',
  priority = false,
}) => {
  const [imageError, setImageError] = useState(false);

  if (!logoUrl || imageError) {
    return (
      <LetterAvatar
        name={organizationName}
        size={size}
        rounded={rounded}
        className={className}
      />
    );
  }

  // Use pre-defined size classes for common sizes, fall back to inline styles for custom sizes
  const getSizeClass = (size: number): string | null => {
    switch (size) {
      case 24: return 'avatar-size-xs';
      case 32: return 'avatar-size-sm';
      case 48: return 'avatar-size-md';
      case 64: return 'avatar-size-lg';
      case 80: return 'avatar-size-xl';
      default: return null;
    }
  };

  const roundedClasses = {
    full: 'rounded-full',
    lg: 'rounded-lg',
    md: 'rounded-md',
    sm: 'rounded-sm',
  };

  const sizeClass = getSizeClass(size);
  const customStyle = sizeClass ? {} : {
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <div
      className={cn(
        'flex-shrink-0 bg-white ring-1 ring-gray-200 overflow-hidden',
        sizeClass,
        roundedClasses[rounded],
        className
      )}
      style={customStyle}
    >
      <Image
        src={logoUrl}
        alt={`${organizationName}のロゴ`}
        width={size}
        height={size}
        className="w-full h-full object-contain"
        priority={priority}
        onError={() => setImageError(true)}
      />
    </div>
  );
};

export default LogoDisplay;