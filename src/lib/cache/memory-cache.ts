import { logger } from '@/lib/utils/logger';

/**
 * Memory Cache System
 * 高速なメモリベースキャッシュシステム
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  totalRequests: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = { hits: 0, misses: 0 };
  private maxSize: number;
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) { // 5分デフォルト
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // 定期的なクリーンアップ（30秒ごと）
    this.cleanupInterval = setInterval(() => this.cleanup(), 30000);
  }

  /**
   * キャッシュから値を取得
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // TTL チェック
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // ヒット統計更新
    entry.hits++;
    this.stats.hits++;
    
    return entry.data;
  }

  /**
   * キャッシュに値を保存
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // サイズ制限チェック
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0
    };

    this.cache.set(key, entry);
  }

  /**
   * 関数の結果をキャッシュするヘルパー
   */
  async wrap<T>(
    key: string, 
    fn: () => Promise<T> | T, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    this.set(key, result, ttl);
    return result;
  }

  /**
   * 特定のキーを削除
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * パターンマッチングで削除
   */
  deletePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let deleted = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    return deleted;
  }

  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * 統計情報を取得
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      totalRequests
    };
  }

  /**
   * 期限切れエントリのクリーンアップ
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Debug', `🧹 Cache cleanup: ${cleaned} expired entries removed`);
    }
  }

  /**
   * LRU（最も使用されていないアイテム）を削除
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let minHits = Infinity;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // ヒット数が少なく、かつ古いエントリを優先削除
      if (entry.hits < minHits || (entry.hits === minHits && entry.timestamp < oldestTime)) {
        lruKey = key;
        minHits = entry.hits;
        oldestTime = entry.timestamp;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * リソースクリーンアップ
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// グローバルキャッシュインスタンス
export const memoryCache = new MemoryCache(2000, 10 * 60 * 1000); // 2000エントリ、10分TTL

// 特定用途のキャッシュヘルパー
export const cacheHelpers = {
  /**
   * 組織データのキャッシュ
   */
  async organizations<T>(fn: () => Promise<T>, page = 1, limit = 24): Promise<T> {
    const key = `organizations:${page}:${limit}`;
    return memoryCache.wrap(key, fn, 5 * 60 * 1000); // 5分キャッシュ
  },

  /**
   * サービスデータのキャッシュ
   */
  async services<T>(orgId: string, fn: () => Promise<T>): Promise<T> {
    const key = `services:${orgId}`;
    return memoryCache.wrap(key, fn, 3 * 60 * 1000); // 3分キャッシュ
  },

  /**
   * 検索結果のキャッシュ
   */
  async search<T>(query: string, filters: any, fn: () => Promise<T>): Promise<T> {
    const key = `search:${query}:${JSON.stringify(filters)}`;
    return memoryCache.wrap(key, fn, 2 * 60 * 1000); // 2分キャッシュ
  },

  /**
   * JSON-LD データのキャッシュ
   */
  async jsonLd<T>(entityType: string, entityId: string, fn: () => Promise<T>): Promise<T> {
    const key = `jsonld:${entityType}:${entityId}`;
    return memoryCache.wrap(key, fn, 15 * 60 * 1000); // 15分キャッシュ
  },

  /**
   * キャッシュ無効化ヘルパー
   */
  invalidate: {
    organization: (orgId: string) => {
      memoryCache.deletePattern(`organizations:`);
      memoryCache.deletePattern(`services:${orgId}`);
      memoryCache.deletePattern(`jsonld:organization:${orgId}`);
    },
    
    service: (orgId: string, serviceId?: string) => {
      memoryCache.deletePattern(`services:${orgId}`);
      if (serviceId) {
        memoryCache.deletePattern(`jsonld:service:${serviceId}`);
      }
    },
    
    search: () => {
      memoryCache.deletePattern(`search:`);
    }
  }
};

export default memoryCache;