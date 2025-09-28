/**
 * VisuallyHidden コンポーネント
 * 要件定義準拠: アクセシビリティAA、スクリーンリーダー対応
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface VisuallyHiddenProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({
  children,
  asChild = false,
  className,
}) => {
  const visuallyHiddenClasses = cn(
    'absolute w-px h-px p-0 -m-px overflow-hidden clip-[rect(0,0,0,0)] whitespace-nowrap border-0',
    className
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(children.props.className, visuallyHiddenClasses),
    });
  }

  return <span className={visuallyHiddenClasses}>{children}</span>;
};