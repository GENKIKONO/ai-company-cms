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
 * 簡素化: 必須項目は name と slug のみ
 */
export const organizationCreateSchema = z.object({
  // 必須項目（最小限 - nameのみ）
  name: requiredString(1, 255),
  slug: optionalSlugField(), // スラッグも任意に変更
  
  // 全ての項目を任意に変更
  description: optionalString(),
  address_region: optionalString(), // 都道府県
  address_locality: optionalString(), // 市区町村
  telephone: optionalString(), // 電話番号も任意に
  url: optionalString(), // URLも任意に
  
  // オプション項目
  legal_form: optionalString(),
  representative_name: optionalString(),
  establishment_date: optionalString(), // DATE型への変換はAPI側で処理
  founded: optionalString(), // DATE型への変換はAPI側で処理
  address_postal_code: optionalString(), // 郵便番号も任意に
  postal_code: optionalString(), // フロントエンドとの互換性のため
  address_street: optionalString(),
  street_address: optionalString(), // フロントエンドとの互換性のため
  address_country: optionalString(), // 要件定義準拠: "JP"
  email: emailField(),
  logo_url: urlField(),
  capital: numericField(),
  employees: numericField(),
  
  // SEO・メタデータ
  meta_title: optionalString(),
  meta_description: optionalString(),
  
  // ブランド・デザイン設定
  favicon_url: urlField(),
  brand_color_primary: colorField(),
  brand_color_secondary: colorField(),
  
  // JSON配列フィールド
  industries: jsonArrayField<string>(),
  same_as: jsonArrayField<string>(), // SNSリンク等
  area_served: jsonArrayField<string>(), // サービス提供地域
  
  // 拡張フィールド（I1）
  social_media: z.record(z.string()).optional(),
  business_hours: jsonArrayField<any>(),
  timezone: optionalString(),
  languages_supported: jsonArrayField<string>(),
  certifications: jsonArrayField<string>(),
  awards: jsonArrayField<string>(),
  company_culture: optionalString(),
  mission_statement: optionalString(),
  vision_statement: optionalString(),
  values: jsonArrayField<string>(),
  
  // 公開設定
  email_public: z.boolean().optional(),
  
  // システム項目（API側で自動設定）
  status: organizationStatusSchema.optional(),
  is_published: z.boolean().optional(),
  
  // Stripe関連（読み取り専用）
  plan: z.enum(['free', 'basic', 'pro']).optional(),
  subscription_status: z.enum(['active', 'trialing', 'past_due', 'canceled']).optional(),
  stripe_customer_id: z.string().optional(),
  current_period_end: z.string().optional(),
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