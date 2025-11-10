/**
 * 統合キャッシュ戦略
 * 要件定義準拠: API応答時間 < 1秒達成のためのキャッシュ最適化
 */

import { QueryCacheManager } from './database-optimization';
import { logger } from '@/lib/utils/logger';

// キャッシュ戦略設定
export interface CacheStrategy {
  ttl: number; // Time to live in seconds
  tags: string[]; // Cache invalidation tags
  staleWhileRevalidate?: number; // SWR duration in seconds
  maxStale?: number; // Maximum stale time in seconds
}

// プリセットキャッシュ戦略
export const CACHE_STRATEGIES = {
  // 組織データ（中頻度更新）
  organization: {
    ttl: 300, // 5分
    tags: ['organization'] as string[],
    staleWhileRevalidate: 600, // 10分
    maxStale: 1800 // 30分
  },
  
  // 組織一覧（低頻度更新）
  organizationList: {
    ttl: 600, // 10分
    tags: ['organization', 'list'] as string[],
    staleWhileRevalidate: 1200, // 20分
    maxStale: 3600 // 1時間
  },
  
  // サービス情報（中頻度更新）
  service: {
    ttl: 300, // 5分
    tags: ['service'] as string[],
    staleWhileRevalidate: 600, // 10分
    maxStale: 1800 // 30分
  },
  
  // JSON-LD（低頻度更新）
  jsonLd: {
    ttl: 3600, // 1時間
    tags: ['jsonld'] as string[],
    staleWhileRevalidate: 7200, // 2時間
    maxStale: 86400 // 24時間
  },
  
  // 統計情報（高頻度更新）
  stats: {
    ttl: 60, // 1分
    tags: ['stats'] as string[],
    staleWhileRevalidate: 120, // 2分
    maxStale: 300 // 5分
  },
  
  // 検索結果（短時間キャッシュ）
  search: {
    ttl: 180, // 3分
    tags: ['search'] as string[],
    staleWhileRevalidate: 300, // 5分
    maxStale: 600 // 10分
  }
} as const;

/**
 * キャッシュキー生成ユーティリティ
 */
export class CacheKeyBuilder {
  static organization(slug: string, includeRelations: boolean = false): string {
    return `org:${slug}:${includeRelations ? 'full' : 'basic'}`;
  }
  
  static organizationList(options: {
    page?: number;
    search?: string;
    category?: string;
    sortBy?: string;
  }): string {
    const parts = ['org-list'];
    if (options.page) parts.push(`page:${options.page}`);
    if (options.search) parts.push(`search:${encodeURIComponent(options.search)}`);
    if (options.category) parts.push(`cat:${options.category}`);
    if (options.sortBy) parts.push(`sort:${options.sortBy}`);
    return parts.join(':');
  }
  
  static userOrganizations(userId: string): string {
    return `user-orgs:${userId}`;
  }
  
  static popularOrganizations(limit: number): string {
    return `popular-orgs:${limit}`;
  }
  
  static search(query: string, types: string[], limit: number): string {
    return `search:${encodeURIComponent(query)}:${types.join(',')}:${limit}`;
  }
  
  static jsonLd(type: string, identifier: string): string {
    return `jsonld:${type}:${identifier}`;
  }
  
  static stats(type: string, period: string): string {
    return `stats:${type}:${period}`;
  }
}

/**
 * 高レベルキャッシュ管理クラス
 */
export class CacheManager {
  /**
   * データを取得（キャッシュファーストアプローチ）
   */
  static async get<T>(
    key: string,
    strategy: CacheStrategy,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // キャッシュから取得を試行
    const cached = await QueryCacheManager.get<T>(key);
    
    if (cached) {
      logger.debug('Debug', `🎯 Cache hit: ${key}`);
      return cached;
    }
    
    logger.debug('Debug', `🔄 Cache miss: ${key}, fetching fresh data`);
    
    // フレッシュデータを取得
    const data = await fetchFn();
    
    // キャッシュに保存
    QueryCacheManager.set(key, data, strategy.ttl);
    
    return data;
  }
  
  /**
   * データを設定
   */
  static set<T>(key: string, data: T, strategy: CacheStrategy): void {
    QueryCacheManager.set(key, data, strategy.ttl);
  }
  
  /**
   * タグベースのキャッシュ無効化
   */
  static invalidateByTags(tags: string[]): void {
    tags.forEach(tag => {
      QueryCacheManager.invalidate(`.*:${tag}:.*`);
    });
  }
  
  /**
   * 組織関連のキャッシュを無効化
   */
  static invalidateOrganization(slug?: string): void {
    if (slug) {
      // 特定の組織のキャッシュを無効化
      QueryCacheManager.invalidate(`org:${slug}:.*`);
    } else {
      // 全組織関連のキャッシュを無効化
      this.invalidateByTags(['organization', 'list']);
    }
  }
  
  /**
   * サービス関連のキャッシュを無効化
   */
  static invalidateService(organizationSlug?: string): void {
    this.invalidateByTags(['service']);
    if (organizationSlug) {
      this.invalidateOrganization(organizationSlug);
    }
  }
  
  /**
   * 検索関連のキャッシュを無効化
   */
  static invalidateSearch(): void {
    this.invalidateByTags(['search']);
  }
  
  /**
   * JSON-LD関連のキャッシュを無効化
   */
  static invalidateJsonLd(): void {
    this.invalidateByTags(['jsonld']);
  }
}

/**
 * 条件付きキャッシュデコレータ
 */
export function withCache<T extends unknown[], R>(
  keyBuilder: (...args: T) => string,
  strategy: CacheStrategy
) {
  return function(
    target: object,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ) {
    const method = descriptor.value!;
    
    descriptor.value = async function(...args: T): Promise<R> {
      const key = keyBuilder(...args);
      
      return CacheManager.get(
        key,
        strategy,
        () => method.apply(this, args)
      );
    };
  };
}

/**
 * キャッシュウォーミング（事前キャッシュ生成）
 */
export class CacheWarmer {
  /**
   * 人気組織のキャッシュをウォーミング
   */
  static async warmPopularOrganizations(): Promise<void> {
    const { OptimizedQueryBuilder } = await import('./database-optimization');
    const builder = new OptimizedQueryBuilder('cache_warming');
    
    try {
      const popularOrgs = await builder.getPopularOrganizations(20);
      logger.debug('Debug', `🔥 Warmed cache for ${popularOrgs.length} popular organizations`);
    } catch (error) {
      logger.error('Cache warming failed for popular organizations', error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * 組織詳細のキャッシュをウォーミング
   */
  static async warmOrganizationDetails(slugs: string[]): Promise<void> {
    const { OptimizedQueryBuilder } = await import('./database-optimization');
    
    const promises = slugs.map(async (slug) => {
      try {
        const builder = new OptimizedQueryBuilder('cache_warming');
        await builder.getOrganizationOptimized(slug, true);
        logger.debug('Debug', `🔥 Warmed cache for organization: ${slug}`);
      } catch (error) {
        console.error(`Cache warming failed for organization ${slug}:`, error);
      }
    });
    
    await Promise.allSettled(promises);
  }
  
  /**
   * 検索結果のキャッシュをウォーミング
   */
  static async warmPopularSearches(queries: string[]): Promise<void> {
    const { OptimizedQueryBuilder } = await import('./database-optimization');
    
    const promises = queries.map(async (query) => {
      try {
        const builder = new OptimizedQueryBuilder('cache_warming');
        await builder.searchOptimized(query);
        logger.debug('Debug', `🔥 Warmed cache for search: ${query}`);
      } catch (error) {
        console.error(`Cache warming failed for search "${query}":`, error);
      }
    });
    
    await Promise.allSettled(promises);
  }
}

/**
 * キャッシュパフォーマンス統計
 */
export class CacheAnalytics {
  private static stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    bytesSaved: 0
  };
  
  static recordHit(key: string, bytesSaved: number = 0): void {
    this.stats.hits++;
    this.stats.totalRequests++;
    this.stats.bytesSaved += bytesSaved;
  }
  
  static recordMiss(key: string): void {
    this.stats.misses++;
    this.stats.totalRequests++;
  }
  
  static getStats() {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
    
    return {
      ...this.stats,
      hitRate,
      averageBytesSaved: this.stats.hits > 0 ? this.stats.bytesSaved / this.stats.hits : 0
    };
  }
  
  static resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      bytesSaved: 0
    };
  }
}