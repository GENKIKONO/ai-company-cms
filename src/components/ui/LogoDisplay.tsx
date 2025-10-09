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

  const roundedClasses = {
    full: 'rounded-full',
    lg: 'rounded-lg',
    md: 'rounded-md',
    sm: 'rounded-sm',
  };

  return (
    <div
      className={cn(
        'flex-shrink-0 bg-white ring-1 ring-gray-200 overflow-hidden',
        roundedClasses[rounded],
        className
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
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