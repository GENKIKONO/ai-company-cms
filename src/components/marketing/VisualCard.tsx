/**
 * VisualCard - プレースホルダー撤去用のLP標準ビジュアルカード
 */

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface VisualCardProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export const VisualCard: React.FC<VisualCardProps> = ({
  src,
  alt,
  width = 600,
  height = 400,
  className,
  priority = false,
}) => {
  return (
    <div
      className={cn(
        'rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden bg-white',
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="w-full h-auto object-cover"
      />
    </div>
  );
};

export default VisualCard;