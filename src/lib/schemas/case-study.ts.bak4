/**
 * CaseStudy バリデーションスキーマ
 * 要件定義準拠: JSON-LD CaseStudy 対応
 */

import { z } from 'zod';
import { requiredString, optionalString, jsonArrayField } from './common';

/**
 * 導入事例ステータス
 */
export const caseStudyStatusSchema = z.enum(['draft', 'published', 'archived']);

/**
 * 導入事例作成スキーマ
 */
export const caseStudyCreateSchema = z.object({
  // 必須項目
  title: requiredString(1, 255),
  
  // クライアント情報
  client_type: optionalString(), // 業種・規模等
  client_name: optionalString(), // 匿名化オプション対応
  
  // 事例内容（要件定義準拠）
  problem: optionalString(), // 課題
  solution: optionalString(), // 解決策
  outcome: optionalString(), // 成果
  
  // 成果指標
  metrics: jsonArrayField<{
    name: string;
    value: string;
    unit?: string;
  }>(),
  
  // 公開設定
  published_at: z.string().datetime().optional(),
  is_anonymous: z.boolean().default(false), // クライアント名匿名化
  
  // システム項目
  status: caseStudyStatusSchema.optional(),
  organization_id: z.string().uuid().optional(), // API側で自動設定
  
  // SEO
  meta_title: optionalString(),
  meta_description: optionalString(),
});

/**
 * 導入事例更新スキーマ
 */
export const caseStudyUpdateSchema = caseStudyCreateSchema.partial().extend({
  id: z.string().uuid('Invalid case study ID'),
});

// 型エクスポート
export type CaseStudyCreate = z.infer<typeof caseStudyCreateSchema>;
export type CaseStudyUpdate = z.infer<typeof caseStudyUpdateSchema>;
export type CaseStudyStatus = z.infer<typeof caseStudyStatusSchema>;