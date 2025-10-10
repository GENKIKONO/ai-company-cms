'use client';

import { useMemo } from 'react';
import { formatJP, formatJPHeading, formatJPBody, formatJPButton } from '@/lib/jpText';

type JPTextMode = 'auto' | 'heading' | 'body' | 'button';

interface JPTextProps {
  as?: keyof JSX.IntrinsicElements;
  children: string;
  className?: string;
  mode?: JPTextMode;
}

/**
 * 日本語組版最適化コンポーネント
 * 自動的に改行位置・句読点処理を適用
 */
export default function JPText({
  as: Tag = 'span',
  children,
  className = '',
  mode = 'auto',
}: JPTextProps) {
  const processedText = useMemo(() => {
    switch (mode) {
      case 'heading':
        return formatJPHeading(children);
      case 'body':
        return formatJPBody(children);
      case 'button':
        return formatJPButton(children);
      case 'auto':
      default:
        return formatJP(children);
    }
  }, [children, mode]);

  // dangerouslySetInnerHTMLを使用して改行制御文字を適用
  return (
    <Tag 
      className={className} 
      dangerouslySetInnerHTML={{ __html: processedText }} 
    />
  );
}

/**
 * 見出し専用コンポーネント
 */
export function JPHeading({ 
  as: Tag = 'h2', 
  children, 
  className = '' 
}: JPTextProps) {
  return (
    <JPText 
      as={Tag} 
      mode="heading" 
      className={`jp-heading ${className}`.trim()}
    >
      {children}
    </JPText>
  );
}

/**
 * 本文専用コンポーネント
 */
export function JPBody({ 
  as: Tag = 'p', 
  children, 
  className = '' 
}: JPTextProps) {
  return (
    <JPText 
      as={Tag} 
      mode="body" 
      className={`jp-body ${className}`.trim()}
    >
      {children}
    </JPText>
  );
}

/**
 * ボタン専用コンポーネント
 */
export function JPButton({ 
  as: Tag = 'span', 
  children, 
  className = '' 
}: JPTextProps) {
  return (
    <JPText 
      as={Tag} 
      mode="button" 
      className={`u-nowrap ${className}`.trim()}
    >
      {children}
    </JPText>
  );
}