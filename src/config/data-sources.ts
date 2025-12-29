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

export interface DataSourceConfig {
  /** テーブル名（DB） */
  table: TableName;
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
    table: 'posts',
    displayName: '投稿',
    defaultSelect: 'id, title, slug, status, excerpt, featured_image_url, published_at, created_at, updated_at',
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
    table: 'services',
    displayName: 'サービス',
    defaultSelect: 'id, name, description, price, duration_months, category, image_url, created_at, updated_at',
    defaultOrder: { column: 'created_at', ascending: false },
    permissions: {
      read: ['viewer', 'editor', 'admin'],
      write: ['editor', 'admin'],
      delete: ['admin'],
    },
    requiresOrgScope: true,
    searchableColumns: ['name', 'description'],
    ui: {
      emptyMessage: 'サービスがありません',
      createPath: '/dashboard/services/new',
      icon: 'cube',
    },
  },

  faqs: {
    table: 'faqs',
    displayName: 'FAQ',
    defaultSelect: 'id, question, answer, category, display_order, is_published, created_at, updated_at',
    defaultOrder: { column: 'display_order', ascending: true },
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
    table: 'case_studies',
    displayName: '事例紹介',
    defaultSelect: 'id, title, summary, challenge, solution, result, image_url, is_published, created_at, updated_at',
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
    defaultSelect: 'id, title, description, file_url, file_type, file_size, download_count, created_at, updated_at',
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
