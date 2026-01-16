/**
 * Dashboard Data Sources Configuration
 *
 * DBテーブルとDashboardページの接続を一元管理
 *
 * @description
 * - 各テーブルのデフォルト設定を定義
 * - 権限設定を一元管理
 * - UI表示用のメタ情報を提供
 */

import type { SupabaseDatabase } from '@/types/database.types';
import type { UserRole } from '@/types/utils/database';

// =====================================================
// TYPES
// =====================================================

export type TableName = keyof SupabaseDatabase['public']['Tables'];

// ダッシュボード用セキュアビュー名（厳密な union 型）
export type SecureViewName =
  | 'v_dashboard_posts_secure'
  | 'v_dashboard_services_secure'
  | 'v_dashboard_case_studies_secure'
  | 'v_dashboard_faqs_secure';

// ダッシュボード用書き込み可能テーブル（厳密な union 型）
export type DashboardWritableTable = 'posts' | 'services' | 'case_studies' | 'faqs';

// ダッシュボードエンティティキー
export type DashboardEntityKey = 'posts' | 'services' | 'case_studies' | 'faqs';

export interface DataSourceConfig {
  /** テーブル名またはビュー名（DB）- 読み取り用 */
  table: TableName | SecureViewName;
  /** 書き込み用のテーブル名（ビューの場合に元テーブルを指定） */
  writeTable?: TableName;
  /** 日本語表示名 */
  displayName: string;
  /** デフォルトで取得するカラム（* で全カラム） */
  defaultSelect: string;
  /** デフォルトのソート設定 */
  defaultOrder: {
    column: string;
    ascending: boolean;
  };
  /** 権限設定 */
  permissions: {
    /** 読み取り可能なロール */
    read: UserRole[];
    /** 書き込み可能なロール */
    write: UserRole[];
    /** 削除可能なロール */
    delete: UserRole[];
  };
  /** organization_id でフィルタが必要か */
  requiresOrgScope: boolean;
  /** ソフトデリート対応（deleted_at カラム） */
  softDelete?: boolean;
  /** 検索可能なカラム */
  searchableColumns?: string[];
  /** UI表示設定 */
  ui?: {
    /** 空状態のメッセージ */
    emptyMessage: string;
    /** 作成ページへのパス */
    createPath?: string;
    /** アイコン名 */
    icon?: string;
  };
}

// =====================================================
// DATA SOURCES DEFINITION
// =====================================================

export const DATA_SOURCES: Record<string, DataSourceConfig> = {
  // ----- コンテンツ管理 -----
  posts: {
    table: 'v_dashboard_posts_secure',
    writeTable: 'posts',
    displayName: '投稿',
    defaultSelect: 'id, title, slug, is_published, published_at, organization_id, status, created_at, updated_at, summary',
    defaultOrder: { column: 'created_at', ascending: false },
    permissions: {
      read: ['viewer', 'editor', 'admin'],
      write: ['editor', 'admin'],
      delete: ['admin'],
    },
    requiresOrgScope: true,
    searchableColumns: ['title', 'content', 'excerpt'],
    ui: {
      emptyMessage: '投稿がありません',
      createPath: '/dashboard/posts/new',
      icon: 'document',
    },
  },

  services: {
    table: 'v_dashboard_services_secure',
    writeTable: 'services',
    displayName: 'サービス',
    // NOTE: ビュー v_dashboard_services_secure のカラムに合わせる
    // ビューに含まれないカラム: description, duration_months, category, price
    defaultSelect: 'id, title, slug, status, is_published, published_at, organization_id, created_at, updated_at, summary',
    defaultOrder: { column: 'created_at', ascending: false },
    permissions: {
      read: ['viewer', 'editor', 'admin'],
      write: ['editor', 'admin'],
      delete: ['admin'],
    },
    requiresOrgScope: true,
    searchableColumns: ['title', 'summary'],
    ui: {
      emptyMessage: 'サービスがありません',
      createPath: '/dashboard/services/new',
      icon: 'cube',
    },
  },

  faqs: {
    table: 'v_dashboard_faqs_secure',
    writeTable: 'faqs',
    displayName: 'FAQ',
    defaultSelect: 'id, question, slug, is_published, published_at, organization_id, status, answer, category, created_at, updated_at',
    defaultOrder: { column: 'created_at', ascending: false },
    permissions: {
      read: ['viewer', 'editor', 'admin'],
      write: ['editor', 'admin'],
      delete: ['admin'],
    },
    requiresOrgScope: true,
    searchableColumns: ['question', 'answer'],
    ui: {
      emptyMessage: 'FAQがありません',
      createPath: '/dashboard/faqs/new',
      icon: 'question-mark-circle',
    },
  },

  case_studies: {
    table: 'v_dashboard_case_studies_secure',
    writeTable: 'case_studies',
    displayName: '事例紹介',
    defaultSelect: 'id, title, slug, is_published, published_at, organization_id, status, problem, solution, result, tags, created_at, updated_at, summary, client_name, industry',
    defaultOrder: { column: 'created_at', ascending: false },
    permissions: {
      read: ['viewer', 'editor', 'admin'],
      write: ['editor', 'admin'],
      delete: ['admin'],
    },
    requiresOrgScope: true,
    searchableColumns: ['title', 'summary', 'challenge', 'solution', 'result'],
    ui: {
      emptyMessage: '事例がありません',
      createPath: '/dashboard/case-studies/new',
      icon: 'briefcase',
    },
  },

  // ----- Q&A -----
  qa_entries: {
    table: 'qa_entries',
    displayName: 'Q&A',
    defaultSelect: 'id, question, answer, visibility, status, category_id, view_count, created_at, updated_at',
    defaultOrder: { column: 'created_at', ascending: false },
    permissions: {
      read: ['viewer', 'editor', 'admin'],
      write: ['editor', 'admin'],
      delete: ['admin'],
    },
    requiresOrgScope: true,
    searchableColumns: ['question', 'answer'],
    ui: {
      emptyMessage: 'Q&Aがありません',
      createPath: '/dashboard/questions/new',
      icon: 'chat-bubble',
    },
  },

  // ----- 営業資料 -----
  sales_materials: {
    table: 'sales_materials',
    displayName: '営業資料',
    // NOTE: 実際のDBカラム名に合わせる（file_path, mime_type, size_bytes）
    defaultSelect: 'id, title, description, file_path, mime_type, size_bytes, created_at, organization_id, is_public, status',
    defaultOrder: { column: 'created_at', ascending: false },
    permissions: {
      read: ['viewer', 'editor', 'admin'],
      write: ['editor', 'admin'],
      delete: ['admin'],
    },
    requiresOrgScope: true,
    searchableColumns: ['title', 'description'],
    ui: {
      emptyMessage: '営業資料がありません',
      createPath: '/dashboard/materials/new',
      icon: 'document-text',
    },
  },

  // ----- 組織情報 -----
  organizations: {
    table: 'organizations',
    displayName: '組織',
    defaultSelect: 'id, name, slug, description, status, plan, logo_url, created_at, updated_at',
    defaultOrder: { column: 'name', ascending: true },
    permissions: {
      read: ['viewer', 'editor', 'admin'],
      write: ['admin'],
      delete: ['admin'],
    },
    requiresOrgScope: false, // 組織自体にはorgスコープ不要
    ui: {
      emptyMessage: '組織が見つかりません',
    },
  },

  // ----- プロフィール -----
  profiles: {
    table: 'profiles',
    displayName: 'プロフィール',
    defaultSelect: 'id, full_name, avatar_url, created_at, updated_at',
    defaultOrder: { column: 'created_at', ascending: false },
    permissions: {
      read: ['viewer', 'editor', 'admin'],
      write: ['viewer', 'editor', 'admin'], // 自分のプロフィールは編集可能
      delete: ['admin'],
    },
    requiresOrgScope: false,
    ui: {
      emptyMessage: 'プロフィールがありません',
    },
  },
} as const;

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * データソースが存在するかチェック
 */
export function isValidDataSource(key: string): key is keyof typeof DATA_SOURCES {
  return key in DATA_SOURCES;
}

/**
 * データソースの設定を取得
 */
export function getDataSource(key: string): DataSourceConfig | null {
  if (!isValidDataSource(key)) return null;
  return DATA_SOURCES[key];
}

/**
 * 権限チェック
 */
export function hasDataSourcePermission(
  dataSourceKey: string,
  action: 'read' | 'write' | 'delete',
  userRole: UserRole
): boolean {
  const config = getDataSource(dataSourceKey);
  if (!config) return false;

  const allowedRoles = config.permissions[action];
  return allowedRoles.includes(userRole);
}

/**
 * 組織スコープが必要なデータソース一覧を取得
 */
export function getOrgScopedDataSources(): string[] {
  return Object.entries(DATA_SOURCES)
    .filter(([, config]) => config.requiresOrgScope)
    .map(([key]) => key);
}

// Type exports
export type DataSourceKey = keyof typeof DATA_SOURCES;

// =====================================================
// DASHBOARD SPECIFIC HELPERS
// =====================================================

/**
 * ダッシュボードエンティティかどうかをチェック
 */
export function isDashboardEntity(key: string): key is DashboardEntityKey {
  return ['posts', 'services', 'case_studies', 'faqs'].includes(key);
}

/**
 * ダッシュボードエンティティのビュー名を取得（型安全）
 */
export function getDashboardViewName(entity: DashboardEntityKey): SecureViewName {
  const viewMap: Record<DashboardEntityKey, SecureViewName> = {
    posts: 'v_dashboard_posts_secure',
    services: 'v_dashboard_services_secure',
    case_studies: 'v_dashboard_case_studies_secure',
    faqs: 'v_dashboard_faqs_secure',
  };
  return viewMap[entity];
}

/**
 * ダッシュボードエンティティの書き込みテーブル名を取得（型安全）
 */
export function getDashboardWriteTable(entity: DashboardEntityKey): DashboardWritableTable {
  // エンティティ名とテーブル名は同一
  return entity;
}
