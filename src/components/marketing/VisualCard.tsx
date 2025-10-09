/**
 * VisualCard - LP標準ビジュアルカード（プレースホルダー完全撤去版）
 */

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface VisualCardProps {
  src: string;
  alt: string;
  ratio?: '16:9' | '4:3' | '1:1';
  caption?: string;
  contain?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export const VisualCard: React.FC<VisualCardProps> = ({
  src,
  alt,
  ratio = '16:9',
  caption,
  contain = true,
  width = 600,
  height = 400,
  className,
  priority = false,
}) => {
  const aspectRatio = {
    '16:9': 'aspect-16-9',
    '4:3': 'aspect-4-3',
    '1:1': 'aspect-1-1',
  }[ratio];

  return (
    <div className={cn('visual-container', className)}>
      <div
        className={cn(
          'rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden bg-white',
          aspectRatio,
          contain && 'p-6'
        )}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={cn(
            'w-full h-full',
            contain ? 'object-contain' : 'object-cover'
          )}
        />
      </div>
      {caption && (
        <p className="caption">{caption}</p>
      )}
    </div>
  );
};

export default VisualCard;