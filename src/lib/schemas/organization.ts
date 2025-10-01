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
  'published',
  'paused',
  'archived'
]);

/**
 * 企業作成スキーマ（POST /api/my/organization）
 * 最小限: nameのみ必須
 */
export const organizationCreateSchema = z.object({
  name: requiredString(1, 255),
}).strict(); // 不要なフィールドは受け付けない

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