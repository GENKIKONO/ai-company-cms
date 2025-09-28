/**
 * データベースクエリ最適化
 * 要件定義準拠: API応答時間 < 1秒達成のためのクエリ最適化
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { logPerformanceMetrics } from '@/lib/api/audit-logger';
import { CacheManager, CacheKeyBuilder, CACHE_STRATEGIES } from './cache-strategy';

// クエリパフォーマンス監視用の型
export interface QueryPerformanceMetrics {
  query: string;
  duration: number;
  rowCount?: number;
  cached: boolean;
  timestamp: string;
}

// キャッシュ設定
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  tags?: string[]; // Cache invalidation tags
  revalidate?: boolean; // Enable background revalidation
}

// 最適化されたクエリビルダー
export class OptimizedQueryBuilder {
  private supabase: any = null;
  private startTime: number;
  private queryDescription: string;

  constructor(queryDescription: string = 'database_query') {
    this.queryDescription = queryDescription;
    this.startTime = Date.now();
  }

  async getSupabaseClient() {
    if (!this.supabase) {
      const cookieStore = await cookies();
      this.supabase = createServerClient(
        env.SUPABASE_URL,
        env.SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch (error) {
                // Server Component での cookie 設定エラーをハンドル
              }
            },
          },
        }
      );
    }
    return this.supabase;
  }

  /**
   * 組織データの最適化取得（キャッシュ付き）
   */
  async getOrganizationOptimized(slug: string, includeRelations: boolean = false) {
    const cacheKey = CacheKeyBuilder.organization(slug, includeRelations);
    
    return CacheManager.get(
      cacheKey,
      CACHE_STRATEGIES.organization,
      async () => {
        const supabase = await this.getSupabaseClient();
        
        let selectClause = `
          id, name, slug, description, url, logo_url, 
          address_region, address_locality, address_postal_code, address_street,
          telephone, email, email_public, founded, status, is_published,
          created_at, updated_at
        `;
        
        if (includeRelations) {
          selectClause += `, 
            services:services(id, name, summary, category, price, status),
            faqs:faqs(id, question, answer, order_index, status),
            posts:posts(id, title, slug, excerpt, published_at, status)
          `;
        }

        const startTime = Date.now();
        const { data, error } = await supabase
          .from('organizations')
          .select(selectClause)
          .eq('slug', slug)
          .eq('is_published', true)
          .eq('status', 'published')
          .single();

        this.logQueryPerformance('get_organization_optimized', startTime, data ? 1 : 0);
        
        if (error) throw error;
        return data;
      }
    );
  }

  /**
   * 組織一覧の最適化取得（ページネーション付き）
   */
  async getOrganizationsOptimized(options: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sortBy?: 'name' | 'created_at' | 'updated_at';
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      sortBy = 'updated_at',
      sortOrder = 'desc'
    } = options;

    const supabase = await this.getSupabaseClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('organizations')
      .select(`
        id, name, slug, description, url, logo_url,
        address_region, address_locality,
        created_at, updated_at,
        services:services(count)
      `, { count: 'exact' })
      .eq('is_published', true)
      .eq('status', 'published');

    // 検索フィルター
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // カテゴリフィルター（サービスのカテゴリでフィルタ）
    if (category) {
      query = query.filter('services.category', 'eq', category);
    }

    // ソート
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // ページネーション
    query = query.range(offset, offset + limit - 1);

    const startTime = Date.now();
    const { data, error, count } = await query;

    this.logQueryPerformance('get_organizations_optimized', startTime, data?.length || 0);

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page * limit < (count || 0),
        hasPrev: page > 1
      }
    };
  }

  /**
   * ユーザーの組織アクセス情報の最適化取得
   */
  async getUserOrganizationAccess(userId: string) {
    const supabase = await this.getSupabaseClient();
    
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('organization_profiles')
      .select(`
        organization_id, role,
        organizations:organizations(id, name, slug, status)
      `)
      .eq('user_id', userId);

    this.logQueryPerformance('get_user_organization_access', startTime, data?.length || 0);

    if (error) throw error;
    return data || [];
  }

  /**
   * 人気組織の取得（キャッシュ付き）
   */
  async getPopularOrganizations(limit: number = 10) {
    const cacheKey = CacheKeyBuilder.popularOrganizations(limit);
    
    return CacheManager.get(
      cacheKey,
      CACHE_STRATEGIES.organizationList,
      async () => {
        const supabase = await this.getSupabaseClient();
        
        const startTime = Date.now();
        const { data, error } = await supabase
          .from('organizations')
          .select(`
            id, name, slug, description, logo_url,
            services:services(count),
            posts:posts(count)
          `)
          .eq('is_published', true)
          .eq('status', 'published')
          .order('updated_at', { ascending: false })
          .limit(limit);

        this.logQueryPerformance('get_popular_organizations', startTime, data?.length || 0, true);

        if (error) throw error;
        return data || [];
      }
    );
  }

  /**
   * フルテキスト検索（最適化版）
   */
  async searchOptimized(query: string, options: {
    types?: ('organizations' | 'services' | 'posts')[];
    limit?: number;
    offset?: number;
  } = {}) {
    const { types = ['organizations'], limit = 20, offset = 0 } = options;
    const supabase = await this.getSupabaseClient();
    const results: any = {};

    const startTime = Date.now();

    // 並列クエリで複数のテーブルを検索
    const promises = [];

    if (types.includes('organizations')) {
      promises.push(
        supabase
          .from('organizations')
          .select('id, name, slug, description, logo_url')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .eq('is_published', true)
          .eq('status', 'published')
          .range(offset, offset + limit - 1)
          .then((result: any) => ({ type: 'organizations', ...result }))
      );
    }

    if (types.includes('services')) {
      promises.push(
        supabase
          .from('services')
          .select(`
            id, name, summary, category,
            organizations:organizations(id, name, slug)
          `)
          .or(`name.ilike.%${query}%,summary.ilike.%${query}%`)
          .eq('status', 'published')
          .range(offset, offset + limit - 1)
          .then((result: any) => ({ type: 'services', ...result }))
      );
    }

    if (types.includes('posts')) {
      promises.push(
        supabase
          .from('posts')
          .select(`
            id, title, slug, excerpt,
            organizations:organizations(id, name, slug)
          `)
          .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
          .eq('status', 'published')
          .range(offset, offset + limit - 1)
          .then((result: any) => ({ type: 'posts', ...result }))
      );
    }

    const searchResults = await Promise.all(promises);
    
    searchResults.forEach((result: any) => {
      results[result.type] = result.data || [];
    });

    this.logQueryPerformance('search_optimized', startTime, 
      Object.values(results).reduce((acc: number, arr: any) => acc + arr.length, 0));

    return results;
  }

  /**
   * バッチ処理用の最適化クエリ
   */
  async batchUpdateOptimized(table: string, updates: any[], key: string = 'id') {
    const supabase = await this.getSupabaseClient();
    const batchSize = 100; // Supabaseの推奨バッチサイズ
    const results = [];

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      const startTime = Date.now();
      const { data, error } = await supabase
        .from(table)
        .upsert(batch);

      this.logQueryPerformance(`batch_update_${table}`, startTime, batch.length);

      if (error) throw error;
      results.push(...(data || []));
    }

    return results;
  }

  /**
   * クエリパフォーマンスのログ記録
   */
  private logQueryPerformance(queryType: string, startTime: number, rowCount: number, cached: boolean = false) {
    const duration = Date.now() - startTime;
    
    logPerformanceMetrics({
      timestamp: new Date().toISOString(),
      endpoint: `database.${queryType}`,
      method: 'QUERY',
      responseTime: duration,
      dbQueryTime: duration,
      cacheHit: cached,
      metadata: {
        queryType,
        rowCount,
        cached
      }
    });

    // パフォーマンス警告
    if (duration > 500) {
      console.warn(`🐌 Slow query detected: ${queryType} took ${duration}ms`);
    }
  }
}

/**
 * クエリキャッシュマネージャー
 */
export class QueryCacheManager {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  static set<T>(key: string, data: T, ttl: number = 300) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  static invalidate(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  static getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * データベース接続プール最適化
 */
export class DatabaseConnectionOptimizer {
  private static connectionCount = 0;
  private static maxConnections = 10;

  static async withConnection<T>(operation: () => Promise<T>): Promise<T> {
    if (this.connectionCount >= this.maxConnections) {
      throw new Error('Too many database connections');
    }

    this.connectionCount++;
    try {
      return await operation();
    } finally {
      this.connectionCount--;
    }
  }

  static getConnectionStats() {
    return {
      active: this.connectionCount,
      max: this.maxConnections,
      utilization: (this.connectionCount / this.maxConnections) * 100
    };
  }
}

/**
 * クエリパフォーマンス分析ユーティリティ
 */
export class QueryAnalyzer {
  private static queries: QueryPerformanceMetrics[] = [];
  private static maxQueries = 1000;

  static recordQuery(metrics: QueryPerformanceMetrics) {
    this.queries.push(metrics);
    
    // 古いデータを削除
    if (this.queries.length > this.maxQueries) {
      this.queries = this.queries.slice(-this.maxQueries);
    }
  }

  static getSlowQueries(threshold: number = 1000) {
    return this.queries
      .filter(q => q.duration > threshold)
      .sort((a, b) => b.duration - a.duration);
  }

  static getQueryStats() {
    if (this.queries.length === 0) {
      return { avgDuration: 0, totalQueries: 0, cacheHitRate: 0 };
    }

    const totalDuration = this.queries.reduce((sum, q) => sum + q.duration, 0);
    const cachedQueries = this.queries.filter(q => q.cached).length;

    return {
      avgDuration: totalDuration / this.queries.length,
      totalQueries: this.queries.length,
      cacheHitRate: (cachedQueries / this.queries.length) * 100,
      slowQueries: this.getSlowQueries().length
    };
  }

  static resetStats() {
    this.queries = [];
  }
}