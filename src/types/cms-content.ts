/**
 * P2-6: CMS統合ダッシュボード用型定義
 * TODO: [SUPABASE_CMS_MIGRATION] v_admin_contents VIEW は存在しない可能性があります
 * 新しい型定義は src/types/cms-supabase.ts を使用してください
 */

import type { CmsGenerationSource } from './interview-generated';
// TODO: [SUPABASE_CMS_MIGRATION] 新しい型をインポートして段階的に移行
// import type { PublicContentRow, CmsSectionRow } from './cms-supabase';

// Supabase enum と完全一致（重要）
export type CmsContentType =
  | 'qna'
  | 'faq'
  | 'blog'
  | 'news'
  | 'case_study'
  | 'material'
  | 'interview'
  | 'product'
  | 'service';

export type CmsContentStatus =
  | 'draft'
  | 'published'
  | 'archived';

// コンテンツタイプのラベル表示用
export const CMS_CONTENT_TYPE_LABELS: Record<CmsContentType, string> = {
  qna: 'Q&A',
  faq: 'FAQ',
  blog: 'ブログ',
  news: 'ニュース',
  case_study: 'ケーススタディ',
  material: '資料',
  interview: 'インタビュー',
  product: '製品',
  service: 'サービス'
};

export const CMS_CONTENT_STATUS_LABELS: Record<CmsContentStatus, string> = {
  draft: '下書き',
  published: '公開済み',
  archived: 'アーカイブ'
};

// TODO: [SUPABASE_CMS_MIGRATION] v_admin_contents VIEW は存在しない可能性があります
// 代わりに public_*_tbl 系のテーブルを直接使用することを検討してください
export interface AdminContentListItem {
  id: string;
  organization_id: string;
  content_type: CmsContentType;
  title: string | null;
  slug: string | null;
  status: CmsContentStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  locale: string | null;
  region_code: string | null;
  base_path: string | null;
  meta: Record<string, any>;
  // TODO: [SUPABASE_CMS_MIGRATION] public_*_tbl 系テーブルに変更予定
  source_table: string; // posts, news, faqs, case_studies, qa_entries, sales_materials, ai_interview_sessions
  generation_source: CmsGenerationSource | null;
}

// API レスポンス型（一覧）
export interface AdminContentListResponse {
  success: true;
  items: AdminContentListItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

// API レスポンス型（詳細）
export interface AdminContentDetailResponse {
  success: true;
  item: AdminContentListItem; // 基本情報は統一
  sourceData?: any; // 元テーブルの詳細データ（content, summary等）
}

// API レスポンス型（エラー）
export interface AdminContentApiError {
  success: false;
  code: string;
  message: string;
  details?: string;
}

export type AdminContentApiResponse<T> = T | AdminContentApiError;

// API クエリパラメータ（一覧取得）
export interface AdminContentListQuery {
  orgId: string;
  contentType?: string; // カンマ区切り可 'blog,news'
  status?: CmsContentStatus;
  q?: string; // 検索キーワード
  page?: number;
  pageSize?: number;
}

// API 更新リクエスト型
export interface AdminContentUpdateRequest {
  title?: string;
  slug?: string;
  status?: CmsContentStatus;
  meta?: Record<string, any>;
  base_path?: string;
  published_at?: string | null;
  locale?: string;
  region_code?: string;
}

// Source Table の型定義
// TODO: [SUPABASE_CMS_MIGRATION] public_*_tbl 系テーブルに変更を検討
export type SourceTableType = 
  | 'posts' // TODO: → public_posts_tbl
  | 'news'  // TODO: → public_news_tbl
  | 'faqs'  // TODO: → public_faqs_tbl
  | 'case_studies'  // TODO: → public_case_studies_tbl
  | 'qa_entries'
  | 'sales_materials'
  | 'ai_interview_sessions';

// TODO: [SUPABASE_CMS_MIGRATION] Supabaseの「正」に合わせた新しい型も定義
export type PublicSourceTableType = 
  | 'public_posts_tbl'
  | 'public_news_tbl'
  | 'public_services_tbl'
  | 'public_products_tbl'
  | 'public_case_studies_tbl'
  | 'public_faqs_tbl';

// Source Table の妥当性チェック用
export const VALID_SOURCE_TABLES: SourceTableType[] = [
  'posts',
  'news',
  'faqs', 
  'case_studies',
  'qa_entries',
  'sales_materials',
  'ai_interview_sessions'
];

// TODO: [SUPABASE_CMS_MIGRATION] 新しいテーブル用
export const VALID_PUBLIC_SOURCE_TABLES: PublicSourceTableType[] = [
  'public_posts_tbl',
  'public_news_tbl',
  'public_services_tbl',
  'public_products_tbl',
  'public_case_studies_tbl',
  'public_faqs_tbl'
];

export function isValidSourceTable(value: string): value is SourceTableType {
  return VALID_SOURCE_TABLES.includes(value as SourceTableType);
}

// コンテンツタイプのグルーピング（UI用）
export interface ContentTypeGroup {
  key: string;
  label: string;
  contentTypes: CmsContentType[];
  color: string;
}

export const CONTENT_TYPE_GROUPS: ContentTypeGroup[] = [
  {
    key: 'all',
    label: 'すべて',
    contentTypes: ['qna', 'faq', 'blog', 'news', 'case_study', 'material', 'interview', 'product', 'service'],
    color: 'gray'
  },
  {
    key: 'blog_news',
    label: 'Blog / News',
    contentTypes: ['blog', 'news'],
    color: 'blue'
  },
  {
    key: 'qna_faq', 
    label: 'Q&A / FAQ',
    contentTypes: ['qna', 'faq'],
    color: 'green'
  },
  {
    key: 'case',
    label: 'Case',
    contentTypes: ['case_study'],
    color: 'purple'
  },
  {
    key: 'materials',
    label: 'Materials',
    contentTypes: ['material'],
    color: 'orange'
  },
  {
    key: 'interview',
    label: 'Interview',
    contentTypes: ['interview'],
    color: 'pink'
  },
  {
    key: 'products_services',
    label: 'Products / Services',
    contentTypes: ['product', 'service'],
    color: 'indigo'
  }
];

// フロントエンド状態管理用
export interface AdminContentDashboardState {
  selectedGroup: string;
  selectedStatus: CmsContentStatus | 'all';
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  aiGeneratedFilter: 'all' | 'ai_only' | 'manual_only';
}

// ソート設定
export interface ContentSortOption {
  key: string;
  label: string;
  field: keyof AdminContentListItem;
  order: 'asc' | 'desc';
}

export const CONTENT_SORT_OPTIONS: ContentSortOption[] = [
  {
    key: 'created_desc',
    label: '作成日時（新しい順）',
    field: 'created_at',
    order: 'desc'
  },
  {
    key: 'created_asc', 
    label: '作成日時（古い順）',
    field: 'created_at',
    order: 'asc'
  },
  {
    key: 'updated_desc',
    label: '更新日時（新しい順）',
    field: 'updated_at', 
    order: 'desc'
  },
  {
    key: 'title_asc',
    label: 'タイトル（昇順）',
    field: 'title',
    order: 'asc'
  },
  {
    key: 'status_asc',
    label: 'ステータス（昇順）',
    field: 'status',
    order: 'asc'
  }
];

// 一括操作用
export interface BulkOperation {
  action: 'publish' | 'archive' | 'delete';
  itemIds: string[];
  sourceTable: SourceTableType;
}

// メタデータ編集用のヘルパー型
export interface MetadataField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  description?: string;
}

// 各コンテンツタイプの推奨メタデータ構造（今後の拡張用）
export const CONTENT_TYPE_METADATA_SCHEMAS: Record<CmsContentType, MetadataField[]> = {
  blog: [
    { key: 'excerpt', label: '抜粋', type: 'string', description: 'ブログの要約文' },
    { key: 'featured_image', label: 'アイキャッチ画像', type: 'string' },
    { key: 'tags', label: 'タグ', type: 'array', description: 'カンマ区切りのタグ' },
    { key: 'author', label: '著者', type: 'string' }
  ],
  news: [
    { key: 'excerpt', label: '抜粋', type: 'string', description: 'ニュースの要約文' },
    { key: 'featured_image', label: 'アイキャッチ画像', type: 'string' },
    { key: 'source', label: '情報源', type: 'string' }
  ],
  faq: [
    { key: 'category', label: 'カテゴリ', type: 'string' },
    { key: 'priority', label: '優先度', type: 'number', description: '表示順序の優先度' },
    { key: 'keywords', label: 'キーワード', type: 'array', description: '検索キーワード' }
  ],
  qna: [
    { key: 'category', label: 'カテゴリ', type: 'string' },
    { key: 'difficulty', label: '難易度', type: 'string', description: 'beginner, intermediate, advanced' },
    { key: 'keywords', label: 'キーワード', type: 'array' }
  ],
  case_study: [
    { key: 'client_name', label: 'クライアント名', type: 'string' },
    { key: 'industry', label: '業界', type: 'string' },
    { key: 'project_duration', label: 'プロジェクト期間', type: 'string' },
    { key: 'technologies', label: '使用技術', type: 'array' },
    { key: 'results', label: '結果・効果', type: 'string' }
  ],
  material: [
    { key: 'file_type', label: 'ファイル形式', type: 'string', description: 'PDF, DOCX, PPTX等' },
    { key: 'file_size', label: 'ファイルサイズ', type: 'number' },
    { key: 'download_count', label: 'ダウンロード数', type: 'number' },
    { key: 'category', label: 'カテゴリ', type: 'string' }
  ],
  interview: [
    { key: 'interviewee', label: 'インタビュー対象者', type: 'string' },
    { key: 'session_type', label: 'セッション種別', type: 'string' },
    { key: 'duration_minutes', label: '所要時間（分）', type: 'number' },
    { key: 'ai_model', label: '使用AIモデル', type: 'string' }
  ],
  product: [
    { key: 'price', label: '価格', type: 'number' },
    { key: 'features', label: '機能一覧', type: 'array' },
    { key: 'category', label: 'カテゴリ', type: 'string' }
  ],
  service: [
    { key: 'service_type', label: 'サービス種別', type: 'string' },
    { key: 'pricing_model', label: '料金体系', type: 'string' },
    { key: 'target_audience', label: 'ターゲット', type: 'string' }
  ]
};