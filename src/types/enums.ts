/**
 * P1-2 Enum Types - Supabase enum実装前の型安全性確保
 * 
 * Supabaseアシスタント仕様に完全準拠した値定義
 * 将来的にDatabase['public']['Enums']に置き換え予定
 */

// 1. interview_session_status (Supabaseアシスタント仕様)
export const INTERVIEW_SESSION_STATUS = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress', 
  COMPLETED: 'completed'
} as const

export type InterviewSessionStatus = typeof INTERVIEW_SESSION_STATUS[keyof typeof INTERVIEW_SESSION_STATUS]

// 2. interview_content_type (Supabaseアシスタント仕様)
export const INTERVIEW_CONTENT_TYPE = {
  SERVICE: 'service',
  PRODUCT: 'product', 
  POST: 'post',
  NEWS: 'news',
  FAQ: 'faq',
  CASE_STUDY: 'case_study'
} as const

export type InterviewContentType = typeof INTERVIEW_CONTENT_TYPE[keyof typeof INTERVIEW_CONTENT_TYPE]

// 型ガード関数
export function isValidInterviewSessionStatus(value: any): value is InterviewSessionStatus {
  return Object.values(INTERVIEW_SESSION_STATUS).includes(value)
}

export function isValidInterviewContentType(value: any): value is InterviewContentType {
  return Object.values(INTERVIEW_CONTENT_TYPE).includes(value)
}

// Contract Violations用の許可値配列
export const VALID_INTERVIEW_SESSION_STATUS = Object.values(INTERVIEW_SESSION_STATUS)
export const VALID_INTERVIEW_CONTENT_TYPE = Object.values(INTERVIEW_CONTENT_TYPE)

// 将来的なDatabase型との互換性確保
// TODO: Supabase enum実装後にこれらの型を置き換え
// type FutureInterviewSessionStatus = Database['public']['Enums']['interview_session_status']
// type FutureInterviewContentType = Database['public']['Enums']['interview_content_type']