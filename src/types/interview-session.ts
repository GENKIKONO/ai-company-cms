import type { Database } from '@/types/supabase';

// 新仕様のanswerとgenerated_content_json構造型定義
export interface InterviewAnswerTurn {
  turn_index: number;          // 0: 初回, 1,2: 深掘り
  question_text: string;       // 実際に聞いた質問文
  answer_text: string;         // ユーザーの回答
  followup_prompt?: string;    // 追撃質問を生成した元プロンプト（任意）
  evidence?: {
    source: 'url' | 'post' | 'faq' | 'other';
    ref_id: string;
  }[];
  meta?: Record<string, any>;  // モデル名・トークン数など（任意）
}

export interface InterviewAnswerQuestion {
  question_id: string;         // ai_interview_questions.id
  axis_id: string | null;      // ai_interview_axes.id（なければnull）
  content_type: string;        // 'service' | 'product' | 'post' など
  lang: string;                // 'ja' | 'en' など
  turns: InterviewAnswerTurn[];
}

export interface InterviewAnswersJson {
  questions: InterviewAnswerQuestion[];
}

export interface StructuredJsonData {
  category: 'service' | 'product' | 'company' | string;
  summary_one_line: string;
  unique_value: string;
  target_customers: string[];
  main_pain_points: string[];
  main_features: string[];
  representative_case: string;
  pricing_overview: string;
}

export interface EmbeddingContextData {
  version: number;
  text: string;
  chunks: any[];
}

export interface GeneratedContentJson {
  structured_json: StructuredJsonData;
  embedding_context: EmbeddingContextData;
}

export interface InterviewSession {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  content_type: Database['public']['Enums']['interview_content_type'];
  status: Database['public']['Enums']['interview_session_status'];
  answers: InterviewAnswersJson;
  generated_content?: string | null;
  generated_content_json?: GeneratedContentJson | null;
  meta?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // NOTE: version カラムは Supabase 側 DDL で追加済み前提
  version: number;
}

export interface CreateInterviewSessionInput {
  organizationId: string | null;
  userId: string | null;
  contentType: Database['public']['Enums']['interview_content_type'];
  questionIds: string[];
}

export interface SaveAnswerInput {
  sessionId: string;
  questionId: string;
  answer: string;
}

export interface FinalizeSessionInput {
  sessionId: string;
}

export interface InterviewQuestion {
  id: string;
  axis_code: string;
  question_text: string;
  content_type?: Database['public']['Enums']['interview_content_type'];
  lang: string;
  sort_order: number;
  is_active: boolean;
}

export interface InterviewAxis {
  id: string;
  axis_code: string;
  label_ja: string;
  label_en: string;
  description_ja?: string;
  description_en?: string;
  sort_order: number;
  is_active: boolean;
}

// Phase 2-1: Session management types
export interface SessionListParams {
  organization_id?: string;
  status?: Database['public']['Enums']['interview_session_status'];
  page?: number;
  page_size?: number;
}

export interface SessionListResponse {
  data: InterviewSession[];
  page: number;
  pageSize: number;
  total: number;
}

export interface SessionDetailResponse {
  data: InterviewSession;
  readOnly: boolean;
}

export interface SessionDeleteResponse {
  ok: boolean;
}

export interface SessionRestoreResponse {
  ok: boolean;
}

// Phase 2-2: Auto-save with optimistic locking types
export interface SaveAnswersRequest {
  answers: Record<string, unknown>;
  clientVersion: number;
}

export interface SaveAnswersSuccessResponse {
  ok: true;
  newVersion: number;
  updatedAt: string;
}

export interface SaveAnswersConflictResponse {
  conflict: true;
  latest: {
    id: string;
    version: number;
    updated_at: string;
    answers: Record<string, unknown>;
  };
}

export interface SaveAnswersErrorResponse {
  message: string;
}

export type SaveAnswersResponse = 
  | SaveAnswersSuccessResponse 
  | SaveAnswersConflictResponse 
  | SaveAnswersErrorResponse;

// Phase 2 Addendum: 差分保存API (EPIC 2-2)
export interface SaveAnswerDiffRequest {
  questionId: string;
  newAnswer: string | null;        // 空文字/NULL の場合はキーを削除
  previousUpdatedAt: string;       // クライアントが保持していた updated_at (ISO文字列)
}

export interface SaveAnswerDiffSuccessResponse {
  ok: true;
  updatedAt: string;
  answers: Record<string, unknown>;
  version: number;
}

export interface SaveAnswerDiffConflictResponse {
  success: false;
  code: 'conflict';
  message: string;
  latest: {
    id: string;
    version: number;
    updated_at: string;
    answers: Record<string, unknown>;
  };
}

export interface SaveAnswerDiffErrorResponse {
  success: false;
  code: string;
  message: string;
}

export type SaveAnswerDiffResponse = 
  | SaveAnswerDiffSuccessResponse 
  | SaveAnswerDiffConflictResponse 
  | SaveAnswerDiffErrorResponse;

// Phase 2-2: RPC レスポンス型定義
export interface RPCSaveAnswersResult {
  success: boolean;
  new_version?: number;
  updated_at?: string;
  conflict?: boolean;
  current_version?: number;
}