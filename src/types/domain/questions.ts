/**
 * Questions Box Domain Types
 * 
 * 質問ボックス機能関連の専用型
 */

// Question System Enums
export type QuestionStatus = 'open' | 'answered' | 'closed';

// Core Question Types
export interface Question {
  id: string;
  company_id: string;
  user_id: string;
  question_text: string;
  status: QuestionStatus;
  answer_text?: string;
  created_at: string;
  answered_at?: string;
  answered_by?: string;
}

// Extended Types with Details
export interface QuestionWithDetails extends Question {
  user_email?: string;
  user_full_name?: string;
  company_name?: string;
  answerer_name?: string;
}

// Form Data Types
export interface QuestionFormData {
  company_id: string;
  question_text: string;
}

export interface QuestionAnswerData {
  answer_text: string;
}