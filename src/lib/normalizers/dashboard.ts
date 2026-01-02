/**
 * ダッシュボード統計データの正規化ユーティリティ
 * undefined/null アクセスによるクラッシュを防止
 */

interface TableCount {
  count: number | null;
  missing: boolean;
}

interface DashboardStats {
  ok: boolean;
  counts: {
    services: TableCount;
    case_studies: TableCount;
    posts: TableCount;
    faqs: TableCount;
    contacts: TableCount;
  };
  analytics: {
    pageViews: number;
    avgDurationSec: number;
    conversionRate: number;
  };
  missingTables: string[];
  error?: string;
}

// 安全な数値正規化
export const nz = (value: unknown): number => {
  return typeof value === 'number' && !isNaN(value) ? value : 0;
};

// デフォルトテーブルカウント構造
const DEFAULT_TABLE_COUNT: TableCount = { count: 0, missing: true };

// デフォルト統計データ構造
export const getDefaultStats = (): DashboardStats => ({
  ok: false,
  counts: {
    services: DEFAULT_TABLE_COUNT,
    case_studies: DEFAULT_TABLE_COUNT,
    posts: DEFAULT_TABLE_COUNT,
    faqs: DEFAULT_TABLE_COUNT,
    contacts: DEFAULT_TABLE_COUNT,
  },
  analytics: {
    pageViews: 0,
    avgDurationSec: 0,
    conversionRate: 0,
  },
  missingTables: []
});

/** 入力統計データの部分型（API応答など） */
interface RawDashboardStats {
  ok?: boolean;
  counts?: Partial<DashboardStats['counts']>;
  analytics?: Partial<DashboardStats['analytics']>;
  missingTables?: string[];
  error?: string;
}

// 統計データ正規化：undefined/null でもクラッシュしない
export const normalizeDashboardStats = (stats: RawDashboardStats | null | undefined): DashboardStats => {
  if (!stats) {
    return getDefaultStats();
  }

  const defaultStats = getDefaultStats();

  // counts の正規化：各プロパティが存在しない場合もデフォルト値で補完
  const normalizedCounts = stats.counts ? {
    services: stats.counts.services || defaultStats.counts.services,
    case_studies: stats.counts.case_studies || defaultStats.counts.case_studies,
    posts: stats.counts.posts || defaultStats.counts.posts,
    faqs: stats.counts.faqs || defaultStats.counts.faqs,
    contacts: stats.counts.contacts || defaultStats.counts.contacts,
  } : defaultStats.counts;

  // analytics の正規化：数値以外は0で補完
  const normalizedAnalytics = {
    pageViews: nz(stats.analytics?.pageViews),
    avgDurationSec: nz(stats.analytics?.avgDurationSec),
    conversionRate: nz(stats.analytics?.conversionRate),
  };

  return {
    ok: stats.ok ?? false,
    counts: normalizedCounts,
    analytics: normalizedAnalytics,
    missingTables: Array.isArray(stats.missingTables) ? stats.missingTables : [],
    error: stats.error
  };
};

export type { DashboardStats, TableCount };