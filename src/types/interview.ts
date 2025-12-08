/**
 * P2-4: Interview質問UI拡張用の型定義
 * 軸ごとのグルーピング / キーワード連動機能
 */

// TODO: [SUPABASE_TYPE_FOLLOWUP] Supabase Database 型定義を再構築後に復元する
import { InterviewContentType } from './interview-session'

// 基本型の定義（手動定義版）
export interface AiInterviewAxis {
  id: string
  axis_code: string
  label_ja: string | null
  label_en: string | null
  description_ja: string | null
  description_en: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AiInterviewQuestion {
  id: string
  axis_id: string
  question_text: string
  content_type: InterviewContentType
  lang: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Re-export for consistency
export type { InterviewContentType }

// P2-4用の拡張型定義（keywordsカラムを含む）
export interface InterviewQuestionWithKeywords extends Omit<AiInterviewQuestion, 'created_at' | 'updated_at'> {
  keywords: string[] | null
  created_at: string
  updated_at: string
}

// UI表示用の質問アイテム
export interface InterviewQuestionItem {
  id: string
  axisId: string
  questionText: string
  keywords: string[]
  matchCount: number
  sortOrder: number
  contentType: InterviewContentType
  lang: string
  isActive: boolean
}

// 軸ごとのグルーピング
export interface AxisGroup {
  axisId: string
  axisCode: string
  labelJa: string | null
  labelEn: string | null
  descriptionJa: string | null
  descriptionEn: string | null
  sortOrder: number
  questions: InterviewQuestionItem[]
}

// API レスポンス型
export interface InterviewQuestionsResponse {
  axes: AxisGroup[]
  totalCount: number
  orgKeywordsCount: number
}

// API クエリパラメータ
export interface InterviewQuestionsQuery {
  content_type: InterviewContentType
  lang: string
  orgId: string
}

// 組織キーワード型
export interface OrganizationKeyword {
  id: string
  organization_id: string
  keyword: string
  locale: string | null
  is_active: boolean
  priority: number | null
  created_at: string
}

// UI状態管理用
export interface InterviewQuestionSelectorState {
  selectedQuestionIds: string[]
  activeAxisId: string | null
  isLoading: boolean
  error: string | null
}

// コンポーネントProps型
export interface AxisSidebarProps {
  axes: AxisGroup[]
  activeAxisId: string | null
  onSelectAxis: (axisId: string | null) => void
  isLoading?: boolean
}

export interface QuestionListProps {
  axis: AxisGroup | null
  selectedQuestionIds: string[]
  onToggleSelect: (questionId: string) => void
  isLoading?: boolean
}

export interface SelectedQuestionListProps {
  questions: InterviewQuestionItem[]
  onRemove: (questionId: string) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
  isLoading?: boolean
}

export interface InterviewQuestionSelectorProps {
  contentType: InterviewContentType
  lang: string
  orgId: string
  initialSelectedIds?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

// Hook戻り値型
export interface UseInterviewQuestionsResult {
  data: InterviewQuestionsResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}