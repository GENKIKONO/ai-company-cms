/**
 * SWRキャッシュキー集中管理
 * アプリケーション全体のAPIキャッシュキーを統一管理
 */

export const CACHE_KEYS = {
  // 認証・組織情報
  organization: '/api/me',
  
  // コンテンツ管理
  posts: '/api/my/posts',
  services: '/api/my/services',
  faqs: '/api/my/faqs',
  caseStudies: '/api/my/case-studies',
  
  // Analytics（組織ID依存）
  analyticsSummary: (orgId: string) =>
    `/api/analytics/ai/summary?organization_id=${orgId}`,
  
  analyticsVisibility: (orgId: string) =>
    `/api/analytics/ai/visibility?organization_id=${orgId}`,
  
  analyticsGsc: (orgId: string) =>
    `/api/analytics/seo/gsc?organization_id=${orgId}`,
  
  analyticsCombined: (orgId: string, trendDays: number = 30) =>
    `/api/analytics/ai/combined?organization_id=${orgId}&trend_days=${trendDays}`,
  
  analyticsBotLogs: (orgId: string, limit: number = 10) =>
    `/api/analytics/ai/bot-logs?organization_id=${orgId}&limit=${limit}`,
} as const;

/**
 * 特定のコンテンツタイプのキーを取得
 */
export function getContentKey(contentType: 'posts' | 'services' | 'faqs' | 'case-studies'): string {
  const keyMap = {
    'posts': CACHE_KEYS.posts,
    'services': CACHE_KEYS.services,
    'faqs': CACHE_KEYS.faqs,
    'case-studies': CACHE_KEYS.caseStudies,
  };
  return keyMap[contentType];
}

/**
 * 組織関連のすべてのキーを取得
 */
export function getOrganizationRelatedKeys(orgId?: string): string[] {
  const baseKeys: string[] = [
    CACHE_KEYS.organization,
    CACHE_KEYS.posts,
    CACHE_KEYS.services,
    CACHE_KEYS.faqs,
    CACHE_KEYS.caseStudies,
  ];
  
  if (orgId) {
    baseKeys.push(
      CACHE_KEYS.analyticsSummary(orgId),
      CACHE_KEYS.analyticsVisibility(orgId),
      CACHE_KEYS.analyticsGsc(orgId),
      CACHE_KEYS.analyticsCombined(orgId),
      CACHE_KEYS.analyticsBotLogs(orgId)
    );
  }
  
  return baseKeys;
}