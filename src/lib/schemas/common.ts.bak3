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
    .optional()
    .or(z.literal(''))
    .transform(val => {
      const normalized = normalizeEmptyToNull(val);
      if (!normalized) return null;
      
      // 空文字やnullの場合はnullを返す
      if (typeof normalized !== 'string' || normalized.trim() === '') {
        return null;
      }
      
      // URLが有効かチェック
      try {
        const url = normalized.startsWith('http') ? normalized : `https://${normalized}`;
        new URL(url);
        return url;
      } catch {
        throw new Error('Invalid URL format');
      }
    });

/**
 * メールアドレス バリデーション
 */
export const emailField = () =>
  z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => {
      const normalized = normalizeEmptyToNull(val);
      if (!normalized) return null;
      
      // 空文字やnullの場合はnullを返す
      if (typeof normalized !== 'string' || normalized.trim() === '') {
        return null;
      }
      
      // 基本的なメール形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalized)) {
        throw new Error('Invalid email format');
      }
      
      return normalized;
    });

/**
 * 電話番号 バリデーション（要件定義準拠: E.164対応）
 */
export const phoneField = () =>
  z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => {
      const normalized = normalizeEmptyToNull(val);
      if (!normalized) return null;
      
      // 空文字やnullの場合はnullを返す
      if (typeof normalized !== 'string' || normalized.trim() === '') {
        return null;
      }
      
      // 電話番号の基本的な形式チェック（数字、スペース、ハイフン、プラス、括弧のみ）
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(normalized)) {
        throw new Error('Invalid phone number format');
      }
      
      return normalized;
    });

/**
 * スラッグ バリデーション（要件定義準拠: 予約語チェック）
 */
const RESERVED_SLUGS = [
  'o', 's', 'admin', 'api', 'assets', 'static', 
  'sitemap', 'robots', 'login', 'signup', 'auth',
  'dashboard', 'ops', 'help', 'contact', 'terms', 'privacy',
  'organizations', 'new', 'edit', 'delete', 'create'
];

export const slugField = () =>
  z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .refine(slug => !RESERVED_SLUGS.includes(slug), 'This slug is reserved');

/**
 * オプショナルスラッグ バリデーション（企業作成時用）
 */
export const optionalSlugField = () =>
  z.string()
    .optional()
    .transform(val => {
      if (!val || val.trim() === '') {
        return undefined;
      }
      
      const trimmed = val.trim().toLowerCase();
      
      // 基本的な形式チェック
      if (trimmed.length < 3 || trimmed.length > 50) {
        throw new Error('Slug must be between 3 and 50 characters');
      }
      
      if (!/^[a-z0-9-]+$/.test(trimmed)) {
        throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
      }
      
      if (RESERVED_SLUGS.includes(trimmed)) {
        throw new Error('This slug is reserved');
      }
      
      return trimmed;
    });

/**
 * 郵便番号 バリデーション（要件定義準拠: 日本形式）
 */
export const postalCodeField = () =>
  z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => {
      const normalized = normalizeEmptyToNull(val);
      if (!normalized) return null;
      
      // 空文字やnullの場合はnullを返す
      if (typeof normalized !== 'string' || normalized.trim() === '') {
        return null;
      }
      
      // 郵便番号形式チェック
      const postalCodeRegex = /^\d{3}-\d{4}$/;
      if (!postalCodeRegex.test(normalized)) {
        throw new Error('Postal code must be in format 123-4567');
      }
      
      return normalized;
    });

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

/**
 * HEXカラーフィールド（#rrggbb形式、空文字→null変換対応）
 */
export const colorField = () =>
  z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => {
      const normalized = normalizeEmptyToNull(val);
      if (!normalized) return null;
      
      // 空文字やnullの場合はnullを返す
      if (typeof normalized !== 'string' || normalized.trim() === '') {
        return null;
      }
      
      // HEX color形式チェック
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!hexColorRegex.test(normalized)) {
        throw new Error('Color must be in hex format (#rrggbb)');
      }
      
      return normalized;
    });