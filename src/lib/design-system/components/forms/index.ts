/**
 * Forms Components - Central Export
 * 要件定義準拠: フォーム体験最適化、統一されたエラーハンドリング
 */

// Form Components
export * from './FormField';
export * from './FormWrapper';
export * from './ValidationMessage';

// Re-export commonly used form types
export type {
  Control,
  FieldPath,
  FieldValues,
  UseFormReturn,
  DefaultValues,
} from 'react-hook-form';

// Form Constants
export const FORM_VALIDATION_RULES = {
  REQUIRED: 'この項目は必須です',
  EMAIL: '有効なメールアドレスを入力してください',
  URL: '有効なURLを入力してください',
  PHONE: '有効な電話番号を入力してください',
  MIN_LENGTH: (min: number) => `${min}文字以上で入力してください`,
  MAX_LENGTH: (max: number) => `${max}文字以下で入力してください`,
} as const;

// Common form validation schemas (can be extended)
export const COMMON_VALIDATIONS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\-\+\(\)\s]+$/,
  url: /^https?:\/\/.+/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  postalCode: /^\d{3}-?\d{4}$/,
} as const;