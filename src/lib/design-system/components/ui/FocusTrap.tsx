/**
 * FocusTrap コンポーネント
 * 要件定義準拠: アクセシビリティAA、キーボードナビゲーション
 */

import React from 'react';
import { useFocusManagement } from '../../accessibility';

export interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  restoreFocus = true,
  autoFocus = true,
  className,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);
  const { focusFirstElement, trapFocus } = useFocusManagement();

  React.useEffect(() => {
    if (!active || !containerRef.current) return;

    // Store the previously focused element
    if (restoreFocus) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
    }

    // Focus the first focusable element if autoFocus is enabled
    if (autoFocus) {
      focusFirstElement(containerRef.current);
    }

    // Set up focus trap
    const cleanup = trapFocus(containerRef.current);

    return () => {
      cleanup?.();
      
      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [active, autoFocus, restoreFocus, focusFirstElement, trapFocus]);

  return (
    <div
      ref={containerRef}
      className={className}
      data-focus-trap={active ? 'true' : 'false'}
    >
      {children}
    </div>
  );
};