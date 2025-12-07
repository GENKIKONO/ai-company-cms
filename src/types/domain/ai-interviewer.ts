/**
 * AI インタビュアー関連のUI専用型定義
 * Supabaseのベース型から派生したビジネスロジック・UI専用の型を定義
 */

// Supabaseの型定義から必要な型をimport（実装時に調整）
// import { Database } from '../supabase'

// P1-2: レガシーCONTENT_TYPES（段階的置き換え予定）
// @deprecated 新しいコードでは @/types/enums の INTERVIEW_CONTENT_TYPE を使用
export const CONTENT_TYPES = {
  SERVICE: 'service',
  PRODUCT: 'product',
  FAQ: 'faq',
  CASE_STUDY: 'case_study'
} as const

// @deprecated 新しいコードでは @/types/enums の InterviewContentType を使用
export type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES]

// 言語サポート
export const SUPPORTED_LANGUAGES = {
  JA: 'ja',
  EN: 'en'
} as const

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[keyof typeof SUPPORTED_LANGUAGES]

// UI専用の拡張インターフェース（Supabaseのベース型に追加フィールドを付与）
export interface UIInterviewSession {
  // ベースの型フィールドはSupabaseから継承予定
  id: string
  user_id: string
  content_type: ContentType
  status: 'draft' | 'in_progress' | 'completed'
  answers: Record<string, string>
  created_at: string
  updated_at: string
  
  // UI専用の計算フィールド
  progress: number // 0-100
  estimatedTimeRemaining: number // 分
  totalQuestions: number
  answeredQuestions: number
}

export interface UIInterviewQuestion {
  id: string
  axis_code: string
  question_text: string
  content_type: ContentType
  lang: SupportedLanguage
  sort_order: number
  is_active: boolean
  
  // UI専用フィールド
  isRequired: boolean
  characterLimit?: number
}

export interface UIInterviewAxis {
  id: string
  axis_code: string
  label_ja: string
  label_en: string
  description_ja?: string
  description_en?: string
  sort_order: number
  is_active: boolean
  
  // UI専用フィールド
  questionCount: number
  completedQuestionCount: number
}

// API レスポンス型
export interface CreateInterviewSessionRequest {
  organizationId?: string | null
  contentType: ContentType
  questionIds: string[]
}

export interface CreateInterviewSessionResponse {
  success: boolean
  sessionId?: string
  error?: string
}

export interface SaveInterviewAnswerRequest {
  questionId: string
  answer: string
}

export interface SaveInterviewAnswerResponse {
  success: boolean
  warnings?: string[]
  error?: string
}

export interface FinalizeInterviewSessionResponse {
  success: boolean
  generatedContent?: string
  error?: string
}