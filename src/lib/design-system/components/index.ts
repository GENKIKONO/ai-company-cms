/**
 * Design System Components - Central Export
 * 要件定義準拠: 一貫したデザインシステム、コンポーネントライブラリ
 */

// Core UI Components
export * from './ui/Button';
export * from './ui/Input';
export * from './ui/Textarea';
export * from './ui/Card';
export * from './ui/Modal';
export * from './ui/LoadingSpinner';
export * from './ui/Toast';
export * from './ui/FocusTrap';
export * from './ui/VisuallyHidden';
export * from './ui/LazyImage';
export * from './ui/VirtualList';

// Form Components
export * from './forms';

// Navigation Components
export * from './navigation';

// Accessibility Utilities
export * from '../accessibility';

// Design Tokens
export { designTokens } from '../tokens';
export type { DesignTokens, ColorScale, Spacing, FontSize } from '../tokens';

// Performance Utilities
export * from '../../performance';

// Utility Functions
export { cn } from '@/lib/utils';

// Common Types
export interface ComponentVariants {
  variant?: string;
  size?: string;
  className?: string;
}

export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  role?: string;
}

export interface FormFieldProps extends AccessibilityProps {
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  success?: boolean;
}

// Component Constants
export const DESIGN_SYSTEM_VERSION = '1.0.0';

export const ACCESSIBILITY_STANDARDS = {
  WCAG_AA: 'WCAG 2.1 AA',
  CONTRAST_RATIO: 4.5,
  FOCUS_RING: 'focus-visible:ring-2 focus-visible:ring-ring',
} as const;