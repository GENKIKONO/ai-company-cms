/**
 * Accessibility Utilities
 * 要件定義準拠: WCAG 2.1 AA準拠、キーボードナビゲーション
 */

import React from 'react';

// ARIA Labels and Descriptions
export const ARIA_LABELS = {
  // Navigation
  MAIN_NAVIGATION: 'メインナビゲーション',
  BREADCRUMB: 'パンくずリスト',
  PAGINATION: 'ページネーション',
  
  // Forms
  FORM_ERROR: 'フォームエラー',
  REQUIRED_FIELD: '必須項目',
  OPTIONAL_FIELD: '任意項目',
  FIELD_DESCRIPTION: '項目の説明',
  
  // Actions
  CLOSE: '閉じる',
  SUBMIT: '送信',
  CANCEL: 'キャンセル',
  EDIT: '編集',
  DELETE: '削除',
  SEARCH: '検索',
  
  // Status
  LOADING: '読み込み中',
  SUCCESS: '成功',
  ERROR: 'エラー',
  WARNING: '警告',
  INFO: '情報',
} as const;

// Screen Reader Only Text
export interface ScreenReaderOnlyProps {
  children: React.ReactNode;
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ children }) => {
  return React.createElement('span', { className: 'sr-only' }, children);
};

// Skip Links for Keyboard Navigation
export interface SkipLinksProps {
  links: Array<{
    href: string;
    label: string;
  }>;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ links }) => {
  return React.createElement('div', 
    { className: 'sr-only focus-within:not-sr-only' },
    React.createElement('div',
      { className: 'fixed top-0 left-0 z-50 bg-primary text-primary-foreground p-2 space-x-2' },
      links.map((link) => 
        React.createElement('a', {
          key: link.href,
          href: link.href,
          className: 'underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-ring'
        }, link.label)
      )
    )
  );
};

// Keyboard Navigation Hook
export function useKeyboardNavigation(
  keys: string[],
  handler: (key: string, event: KeyboardEvent) => void,
  deps: React.DependencyList = []
) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (keys.includes(event.key)) {
        handler(event.key, event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, deps);
}

// Focus Management
export function useFocusManagement() {
  const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const focusFirstElement = React.useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(focusableSelector);
    const firstElement = focusableElements[0] as HTMLElement;
    firstElement?.focus();
  }, []);

  const focusLastElement = React.useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(focusableSelector);
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    lastElement?.focus();
  }, []);

  const trapFocus = React.useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(focusableSelector);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    focusFirstElement,
    focusLastElement,
    trapFocus,
  };
}

// Color Contrast Utilities
export const COLOR_CONTRAST = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
} as const;

// Calculate relative luminance
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
export function getContrastRatio(color1: string, color2: string): number {
  // Simple implementation for hex colors
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);
  
  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);
  
  const lum1 = getLuminance(r1, g1, b1);
  const lum2 = getLuminance(r2, g2, b2);
  
  const bright = Math.max(lum1, lum2);
  const dark = Math.min(lum1, lum2);
  
  return (bright + 0.05) / (dark + 0.05);
}

// Check if color combination meets WCAG standards
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requirement = level === 'AA' 
    ? (isLargeText ? COLOR_CONTRAST.AA_LARGE : COLOR_CONTRAST.AA_NORMAL)
    : (isLargeText ? COLOR_CONTRAST.AAA_LARGE : COLOR_CONTRAST.AAA_NORMAL);
  
  return ratio >= requirement;
}

// Reduced Motion Preference
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// High Contrast Preference
export function useHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
}

// Live Region Hook for Dynamic Content
export function useLiveRegion() {
  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;
    
    document.body.appendChild(liveRegion);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }, []);

  return { announce };
}

// Accessible Button Props Generator
export function getAccessibleButtonProps(
  label: string,
  options: {
    describedBy?: string;
    expanded?: boolean;
    pressed?: boolean;
    disabled?: boolean;
  } = {}
) {
  return {
    'aria-label': label,
    'aria-describedby': options.describedBy,
    'aria-expanded': options.expanded,
    'aria-pressed': options.pressed,
    'disabled': options.disabled,
    'aria-disabled': options.disabled,
  };
}