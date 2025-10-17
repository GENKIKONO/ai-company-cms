/**
 * Organization バリデーションスキーマ
 * 要件定義準拠: 必須項目、正規化、型安全性保証
 */

import { z } from 'zod';
import {
  requiredString,
  optionalString,
  urlField,
  emailField,
  phoneField,
  slugField,
  optionalSlugField,
  postalCodeField,
  numericField,
  jsonArrayField,
  colorField
} from './common';

/**
 * 企業ステータス（要件定義準拠）
 */
export const organizationStatusSchema = z.enum([
  'draft',
  'waiting_approval',
  'public_unverified',
  'published', 
  'paused',
  'archived'
]);

/**
 * 企業作成スキーマ（POST /api/my/organization）
 * ✅ 実際のDBスキーマ（001_initial_schema.sql）に完全一致
 * 最小限: nameのみ必須、その他は任意
 */
export const organizationCreateSchema = z.object({
  name: requiredString(1, 255),
  slug: optionalSlugField(),
  // ✅ 実際のDBに存在するフィールドのみ定義
  description: optionalString(),
  legal_form: optionalString(),
  representative_name: optionalString(),
  corporate_number: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined;
    const trimmed = val.trim();
    if (!/^\d{13}$/.test(trimmed)) {
      throw new Error('法人番号は13桁の数字で入力してください');
    }
    return trimmed;
  }),
  // founded フィールドはUIに存在しないため完全除去
  capital: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === null || val === undefined || val === '') return undefined;
    if (typeof val === 'number') return val;
    const num = parseInt(val.toString().trim(), 10);
    return isNaN(num) ? undefined : num;
  }),
  employees: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === null || val === undefined || val === '') return undefined;
    if (typeof val === 'number') return val;
    const num = parseInt(val.toString().trim(), 10);
    return isNaN(num) ? undefined : num;
  }),
  // 住所情報
  address_country: optionalString(),
  address_region: optionalString(),
  address_locality: optionalString(),
  address_postal_code: optionalString(),
  address_street: optionalString(),
  // 連絡先情報
  telephone: phoneField().optional(),
  email: emailField().optional(),
  email_public: z.boolean().optional(),
  url: urlField().optional(),
  logo_url: urlField().optional(),
  // ビジネス情報
  industries: z.array(z.string()).optional().transform(val => {
    if (!val || !Array.isArray(val) || val.length === 0) return undefined;
    return val.filter(item => item && item.trim() !== '');
  }),
  same_as: z.array(z.string()).optional().transform(val => {
    if (!val || !Array.isArray(val) || val.length === 0) return undefined;
    return val.filter(item => item && item.trim() !== '');
  }),
  status: organizationStatusSchema.optional(),
  // SEO情報
  meta_title: optionalString(),
  meta_description: optionalString(),
  meta_keywords: z.array(z.string()).optional().transform(val => {
    if (!val || !Array.isArray(val) || val.length === 0) return undefined;
    return val.filter(item => item && item.trim() !== '');
  }),
  // 拡張フィールドは本番DBに未適用のため一時的に除外
  // favicon_url: urlField().optional(),
  // brand_color_primary: colorField().optional(),
  // brand_color_secondary: colorField().optional(),
  // social_media: z.record(z.string()).optional(),
  // business_hours: z.array(z.any()).optional(),
  // timezone: optionalString(),
  // languages_supported: z.array(z.string()).optional(),
  // certifications: z.array(z.string()).optional(),
  // awards: z.array(z.string()).optional(),
  // company_culture: optionalString(),
  // mission_statement: optionalString(),
  // vision_statement: optionalString(),
  // values: z.array(z.string()).optional(),
});

/**
 * 企業更新スキーマ（PUT /api/my/organization）
 */
export const organizationUpdateSchema = organizationCreateSchema.partial().extend({
  id: z.string().uuid('Invalid organization ID'),
});

/**
 * 企業公開バリデーション（要件定義準拠の必須項目チェック）
 */
export const organizationPublishSchema = z.object({
  name: requiredString(1, 255),
  description: requiredString(10, 2000), // 公開時は詳細必須
  address_region: requiredString(1, 50),
  address_locality: requiredString(1, 50), 
  telephone: phoneField().refine(val => val !== null, 'Telephone is required for publishing'),
  url: urlField().refine(val => val !== null, 'Website URL is required for publishing'),
  slug: slugField(),
});

/**
 * 企業検索スキーマ
 */
export const organizationSearchSchema = z.object({
  q: z.string().optional(),
  status: organizationStatusSchema.optional(),
  plan: z.enum(['free', 'basic', 'pro']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// 型エクスポート（zod-to-typescript 使用時に自動生成予定）
export type OrganizationCreate = z.infer<typeof organizationCreateSchema>;
export type OrganizationUpdate = z.infer<typeof organizationUpdateSchema>;
export type OrganizationPublish = z.infer<typeof organizationPublishSchema>;
export type OrganizationSearch = z.infer<typeof organizationSearchSchema>;
export type OrganizationStatus = z.infer<typeof organizationStatusSchema>;