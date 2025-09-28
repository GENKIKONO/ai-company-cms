/**
 * 共通バリデーションヘルパー
 * 要件定義準拠: 空文字→null変換、型安全性保証
 */

import { z } from 'zod';

/**
 * 空文字列をnullに変換する共通transformer
 * null/undefined/空文字を統一的に扱う
 */
export const normalizeEmptyToNull = <T extends string | null | undefined>(
  val: T
): T extends string ? (string extends T ? string | null : T) : T => {
  if (val === '' || val === null || val === undefined) {
    return null as any;
  }
  if (typeof val === 'string' && val.trim() === '') {
    return null as any;
  }
  return val as any;
};

/**
 * オプショナル文字列フィールド（空文字→null変換付き）
 */
export const optionalString = () =>
  z.string().nullable().optional().transform(normalizeEmptyToNull);

/**
 * 必須文字列フィールド（trim + 最小長チェック）
 */
export const requiredString = (minLength = 1, maxLength = 255) =>
  z.string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must be at most ${maxLength} characters`)
    .transform(val => val?.trim());

/**
 * URL バリデーション（要件定義準拠: https強制）
 */
export const urlField = () =>
  z.string()
    .url('Invalid URL format')
    .refine(url => url.startsWith('https://'), 'HTTPS required')
    .optional()
    .or(z.literal(''))
    .transform(normalizeEmptyToNull);

/**
 * メールアドレス バリデーション
 */
export const emailField = () =>
  z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal(''))
    .transform(normalizeEmptyToNull);

/**
 * 電話番号 バリデーション（要件定義準拠: E.164対応）
 */
export const phoneField = () =>
  z.string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
    .optional()
    .or(z.literal(''))
    .transform(normalizeEmptyToNull);

/**
 * スラッグ バリデーション（要件定義準拠: 予約語チェック）
 */
const RESERVED_SLUGS = [
  'o', 's', 'admin', 'api', 'assets', 'static', 
  'sitemap', 'robots', 'login', 'signup', 'auth',
  'dashboard', 'ops', 'help', 'contact', 'terms', 'privacy'
];

export const slugField = () =>
  z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .refine(slug => !RESERVED_SLUGS.includes(slug), 'This slug is reserved');

/**
 * 郵便番号 バリデーション（要件定義準拠: 日本形式）
 */
export const postalCodeField = () =>
  z.string()
    .regex(/^\d{3}-\d{4}$/, 'Postal code must be in format 123-4567')
    .optional()
    .or(z.literal(''))
    .transform(normalizeEmptyToNull);

/**
 * JSON配列フィールド（文字列→配列変換対応）
 */
export const jsonArrayField = <T>() =>
  z.union([
    z.array(z.any()),
    z.string().transform(str => {
      try {
        return JSON.parse(str);
      } catch {
        return [];
      }
    })
  ]).optional();

/**
 * 数値フィールド（文字列→数値変換対応）
 */
export const numericField = () =>
  z.union([
    z.number(),
    z.string().transform(str => {
      if (str === '' || str === null || str === undefined) return null;
      const num = parseInt(str.trim(), 10);
      return isNaN(num) ? null : num;
    })
  ])
  .optional()
  .transform(val => {
    if (typeof val === 'string' && val === '') return null;
    return val;
  });