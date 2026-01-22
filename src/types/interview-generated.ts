/**
 * P2-8: コンテンツ × AIインタビュー連携型定義
 * AIインタビューからのコンテンツ生成機能
 */

// Supabase enumと完全一致
export type CmsGenerationSource = 
  | 'manual'
  | 'interview_blog'
  | 'interview_qna'
  | 'interview_case_study';

export type ContentGenerationType = 'blog' | 'qna' | 'case_study';

// 生成対象コンテンツタイプのマッピング
export const GENERATION_TYPE_MAPPING: Record<ContentGenerationType, {
  tableName: string;
  generationSource: CmsGenerationSource;
  cmsContentType: string;
}> = {
  blog: {
    tableName: 'posts',
    generationSource: 'interview_blog',
    cmsContentType: 'blog'
  },
  qna: {
    tableName: 'qa_entries',
    generationSource: 'interview_qna', 
    cmsContentType: 'qna'
  },
  case_study: {
    tableName: 'case_studies',
    generationSource: 'interview_case_study',
    cmsContentType: 'case_study'
  }
};

// AI生成ジョブ（ai_generation_jobs）
export interface AiGenerationJob {
  id: string;
  organization_id: string;
  interview_session_id: string;
  target_content_type: string;
  target_content_id: string | null;
  generation_source: CmsGenerationSource;
  openai_calls: number;
  cost_usd: number;
  error_message: string | null;
  meta: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// コンテンツ・インタビュー紐づけ（content_interview_links）
export interface ContentInterviewLink {
  content_type: string;
  content_id: string;
  interview_session_id: string;
  relation_type: string;
}

// AIコンテンツユニットリンク（ai_content_unit_links）
export interface AiContentUnitLink {
  interview_session_id: string;
  content_type: string;
  content_id: string;
  content_unit_id: string;
  relation_type: string;
  visibility_score: number | null;
}

// v_ai_generated_contents VIEW
export interface AiGeneratedContent {
  table_name: string;
  content_id: string;
  organization_id: string;
  interview_session_id: string;
  content_type: string;
  status: string;
  is_ai_generated: boolean;
  generation_source: string;
  slug: string | null;
  base_path: string | null;
  locale: string | null;
  region_code: string | null;
  created_at: string;
}

// API リクエスト・レスポンス型
export interface GenerateContentRequest {
  sessionId: string;
  contentType: ContentGenerationType;
  customPrompt?: string;
  includeKeywords?: boolean;
}

export interface GeneratedContentData {
  id: string;
  title: string;
  content: string;
  summary?: string;
  slug: string;
  contentType: ContentGenerationType;
  tableName: string;
}

export interface GenerateContentResponse {
  success: true;
  data: {
    content: GeneratedContentData;
    job: {
      id: string;
      openai_calls: number;
      cost_usd: number;
    };
    content_units: {
      linked_count: number;
      source_units: Array<{
        unit_id: string;
        section_key: string;
        title: string;
        visibility_score: number | null;
      }>;
    };
  };
}

export interface GenerateContentError {
  success: false;
  code: string;
  message: string;
  details?: {
    job_id?: string;
    openai_error?: string;
    validation_errors?: string[];
  };
}

export type GenerateContentApiResponse = GenerateContentResponse | GenerateContentError;

// OpenAI プロンプト生成用
export interface InterviewContentUnit {
  id: string;
  section_key: string;
  title: string;
  content: string;
  order_no: number;
  visibility_score?: number | null;
}

export interface InterviewSessionData {
  id: string;
  organization_id: string;
  user_id: string | null;  // DBカラム: user_id uuid (nullable)
  answers: Record<string, string>;
  generated_content: string | null;
  generated_content_json: Record<string, any> | null;
}

// プロンプトテンプレート型
export interface ContentGenerationPrompt {
  systemPrompt: string;
  userPrompt: string;
  expectedFormat: {
    title: string;
    content: string;
    summary?: string;
    keywords?: string[];
  };
}

// 生成統計・分析用
export interface GenerationStats {
  total_jobs: number;
  success_count: number;
  failure_count: number;
  avg_cost_usd: number;
  avg_openai_calls: number;
  by_content_type: Record<ContentGenerationType, {
    count: number;
    success_rate: number;
    avg_cost: number;
  }>;
}

// UI状態管理
export interface ContentGenerationState {
  isGenerating: boolean;
  selectedType: ContentGenerationType | null;
  currentJobId: string | null;
  error: string | null;
  generatedContent: GeneratedContentData | null;
}

// 生成設定
export interface GenerationConfig {
  max_tokens: number;
  temperature: number;
  model: string;
  include_content_units: boolean;
  min_visibility_score: number;
  custom_instructions?: string;
}

export const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  max_tokens: 2000,
  temperature: 0.7,
  model: 'gpt-4',
  include_content_units: true,
  min_visibility_score: 0.0,
};

// エラーコード
export const GENERATION_ERROR_CODES = {
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  INSUFFICIENT_CONTENT: 'INSUFFICIENT_CONTENT',
  OPENAI_ERROR: 'OPENAI_ERROR',
  CONTENT_SAVE_ERROR: 'CONTENT_SAVE_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  GENERATION_IN_PROGRESS: 'GENERATION_IN_PROGRESS',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const;

export type GenerationErrorCode = typeof GENERATION_ERROR_CODES[keyof typeof GENERATION_ERROR_CODES];

// コンテンツ生成タイプのメタデータ
export interface ContentTypeMetadata {
  label: string;
  description: string;
  icon: string;
  estimatedTokens: number;
  promptTemplate: string;
  outputFields: string[];
}

export const CONTENT_TYPE_METADATA: Record<ContentGenerationType, ContentTypeMetadata> = {
  blog: {
    label: 'ブログ記事',
    description: 'インタビュー内容を元にしたブログ記事を生成します',
    icon: '📝',
    estimatedTokens: 1500,
    promptTemplate: 'blog_generation',
    outputFields: ['title', 'content', 'summary', 'keywords']
  },
  qna: {
    label: 'Q&A',
    description: 'よくある質問と回答のペアを生成します',
    icon: '❓',
    estimatedTokens: 800,
    promptTemplate: 'qna_generation',
    outputFields: ['question', 'answer', 'category']
  },
  case_study: {
    label: 'ケーススタディ',
    description: 'インタビューを事例研究として整理します',
    icon: '📊',
    estimatedTokens: 2000,
    promptTemplate: 'case_study_generation',
    outputFields: ['title', 'content', 'summary', 'client', 'industry', 'results']
  }
};

// バリデーション用
export interface ContentValidationRule {
  field: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export const CONTENT_VALIDATION_RULES: Record<ContentGenerationType, ContentValidationRule[]> = {
  blog: [
    { field: 'title', required: true, minLength: 10, maxLength: 200 },
    { field: 'content', required: true, minLength: 300, maxLength: 10000 },
    { field: 'summary', required: false, maxLength: 500 }
  ],
  qna: [
    { field: 'question', required: true, minLength: 10, maxLength: 500 },
    { field: 'answer', required: true, minLength: 50, maxLength: 2000 }
  ],
  case_study: [
    { field: 'title', required: true, minLength: 10, maxLength: 200 },
    { field: 'content', required: true, minLength: 500, maxLength: 15000 },
    { field: 'client', required: false, maxLength: 100 },
    { field: 'industry', required: false, maxLength: 100 }
  ]
};