/**
 * Service バリデーションスキーマ
 * 要件定義準拠: JSON-LD Service 対応
 */

import { z } from 'zod';
import { requiredString, optionalString, urlField, jsonArrayField, numericField } from './common';

/**
 * サービスステータス
 */
export const serviceStatusSchema = z.enum(['draft', 'published', 'archived']);

/**
 * サービス作成スキーマ
 */
export const serviceCreateSchema = z.object({
  // 必須項目
  name: requiredString(1, 255),
  summary: optionalString(),
  
  // サービス詳細
  features: jsonArrayField<string>(),
  price: optionalString(), // 価格は文字列（「要相談」等も含むため）
  category: optionalString(),
  
  // メディア・リンク
  media: jsonArrayField<string>(), // 画像・動画URL配列
  cta_url: urlField(),
  
  // システム項目
  status: serviceStatusSchema.optional(),
  organization_id: z.string().uuid().optional(), // API側で自動設定
  
  // SEO
  meta_title: optionalString(),
  meta_description: optionalString(),
});

/**
 * サービス更新スキーマ
 */
export const serviceUpdateSchema = serviceCreateSchema.partial().extend({
  id: z.string().uuid('Invalid service ID'),
});

// 型エクスポート
export type ServiceCreate = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdate = z.infer<typeof serviceUpdateSchema>;
export type ServiceStatus = z.infer<typeof serviceStatusSchema>;