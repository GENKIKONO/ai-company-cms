/**
 * AIインタビュアー関連の型定義
 * 実際のSupabaseスキーマに準拠
 */

// TODO: [SUPABASE_TYPE_FOLLOWUP] Supabase Database 型定義を再構築後に復元する

// Supabase生成型のエイリアス
export type InterviewAxisRow = any;
export type InterviewAxisInsert = any;
export type InterviewAxisUpdate = any;

export type InterviewQuestionRow = any;
export type InterviewQuestionInsert = any;
export type InterviewQuestionUpdate = any;

export type OrganizationKeywordRow = any;
export type OrganizationKeywordInsert = any;
export type OrganizationKeywordUpdate = any;

// 質問軸コード（想定される値）
export const INTERVIEW_AXES = {
  BASIC: 'basic',
  PRICING: 'pricing',
  VALUE: 'value',
  DIFFERENTIATION: 'differentiation',
  USE_CASES: 'use_cases',
  CUSTOMER: 'customer',
  RISKS: 'risks',
} as const;

export type InterviewAxisCode = typeof INTERVIEW_AXES[keyof typeof INTERVIEW_AXES];

// コンテンツタイプ（ai_interview_questions.content_typeで使用）
export const CONTENT_TYPES = {
  SERVICE: 'service',
  PRODUCT: 'product', 
  POST: 'post',
  NEWS: 'news',
  FAQ: 'faq',
  CASE_STUDY: 'case_study',
} as const;

export type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES];

// 言語コード（ai_interview_questions.lang、organization_keywords.localeで使用）
export const SUPPORTED_LANGUAGES = {
  JA: 'ja',
  EN: 'en',
} as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[keyof typeof SUPPORTED_LANGUAGES];

// バリデーション用のヘルパー型
export interface InterviewAxisValidation {
  id: string;
  code: string;
  is_active: boolean;
  has_questions: boolean; // 関連する質問が存在するか
}

export interface InterviewQuestionValidation {
  id: string;
  axis_code: string;
  content_type: ContentType;
  lang: SupportedLanguage;
  question_text: string;
  is_active: boolean;
  axis_exists: boolean; // 軸が存在するか
}

export interface OrganizationKeywordValidation {
  id: string;
  organization_id: string;
  keyword: string;
  locale: string | null;
  priority: number;
  is_active: boolean;
  is_valid_priority: boolean; // priorityが適切な範囲内か
}

// ユーティリティ関数の型定義
export interface AIInterviewerUtils {
  validateAxisCode: (code: string) => boolean;
  validateContentType: (contentType: string) => boolean;
  validateLanguage: (lang: string) => boolean;
  validatePriority: (priority: number) => boolean;
}