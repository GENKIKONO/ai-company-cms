/**
 * FAQ バリデーションスキーマ
 * 要件定義準拠: JSON-LD FAQPage 対応
 */

import { z } from 'zod';
import { requiredString, optionalString } from './common';

/**
 * FAQステータス
 */
export const faqStatusSchema = z.enum(['draft', 'published', 'archived']);

/**
 * FAQ作成スキーマ
 */
export const faqCreateSchema = z.object({
  // 必須項目（要件定義準拠: FAQPage JSON-LD）
  question: requiredString(1, 500),
  answer: requiredString(1, 2000),
  
  // 表示順序
  order: z.number().min(0).default(0),
  
  // カテゴリ分類
  category: optionalString(),
  
  // システム項目
  status: faqStatusSchema.optional(),
  organization_id: z.string().uuid().optional(), // API側で自動設定
});

/**
 * FAQ更新スキーマ
 */
export const faqUpdateSchema = faqCreateSchema.partial().extend({
  id: z.string().uuid('Invalid FAQ ID'),
});

/**
 * FAQ並び替えスキーマ
 */
export const faqReorderSchema = z.object({
  faqs: z.array(z.object({
    id: z.string().uuid(),
    order: z.number().min(0)
  }))
});

// 型エクスポート
export type FaqCreate = z.infer<typeof faqCreateSchema>;
export type FaqUpdate = z.infer<typeof faqUpdateSchema>;
export type FaqReorder = z.infer<typeof faqReorderSchema>;
export type FaqStatus = z.infer<typeof faqStatusSchema>;