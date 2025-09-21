'use client';

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  compression?: boolean; // Enable compression for large data
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

class CacheManager<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
    compression: false,
  };

  constructor(private config: Partial<CacheConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
    this.startCleanupInterval();
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTtl = ttl || this.config.ttl || this.defaultConfig.ttl;
    
    // Calculate data size (rough estimation)
    const size = this.calculateDataSize(data);
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: entryTtl,
      size,
      accessCount: 0,
      lastAccessed: now,
    };

    // Compress data if enabled and data is large
    if (this.config.compression && size > 10000) {
      entry.data = this.compressData(data);
    }

    this.cache.set(key, entry);
    this.enforceMaxSize();
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    // Decompress data if needed
    const data = this.config.compression && entry.size > 10000 
      ? this.decompressData(entry.data)
      : entry.data;

    return data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): {
    entries: number;
    totalSize: number;
    hitRate: number;
    avgAccessCount: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const avgAccessCount = entries.length > 0 ? totalAccess / entries.length : 0;

    return {
      entries: entries.length,
      totalSize,
      hitRate: this.calculateHitRate(),
      avgAccessCount,
    };
  }

  private calculateDataSize(data: T): number {
    // Rough estimation of data size in bytes
    return JSON.stringify(data).length * 2; // Rough UTF-16 character size
  }

  private calculateHitRate(): number {
    // This would require tracking hits and misses
    // For simplicity, we'll estimate based on access counts
    const entries = Array.from(this.cache.values());
    if (entries.length === 0) return 0;
    
    const avgAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0) / entries.length;
    return Math.min(avgAccess / 10, 1); // Normalize to 0-1 range
  }

  private compressData(data: T): T {
    // Simple compression placeholder
    // In a real implementation, you might use a compression library
    try {
      const jsonString = JSON.stringify(data);
      // Placeholder for actual compression
      return data;
    } catch {
      return data;
    }
  }

  private decompressData(data: T): T {
    // Simple decompression placeholder
    return data;
  }

  private enforceMaxSize(): void {
    if (!this.config.maxSize) return;

    while (this.cache.size > this.config.maxSize) {
      // Use LRU eviction strategy
      let oldestKey: string | null = null;
      let oldestTime = Date.now();

      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccessed < oldestTime) {
          oldestTime = entry.lastAccessed;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      } else {
        break;
      }
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }
}

// Specialized cache managers for different data types
export const organizationCache = new CacheManager({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 500,
  compression: true,
});

export const searchCache = new CacheManager({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 200,
});

export const userPreferencesCache = new CacheManager({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 100,
});

export const analyticsCache = new CacheManager({
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 50,
  compression: true,
});

// Cache utility functions
export class CacheOptimizer {
  static generateCacheKey(...parts: (string | number)[]): string {
    return parts.map(part => String(part)).join(':');
  }

  static async withCache<T>(
    cache: CacheManager<T>,
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();
    
    // Store in cache
    cache.set(key, data, ttl);
    
    return data;
  }

  static async withCacheAndStale<T>(
    cache: CacheManager<T>,
    key: string,
    fetcher: () => Promise<T>,
    staleTtl?: number,
    freshTtl?: number
  ): Promise<T> {
    const cached = cache.get(key);
    
    if (cached !== null) {
      // Return cached data immediately
      return cached;
    }

    // Check if we have stale data
    const staleKey = `stale:${key}`;
    const stale = cache.get(staleKey);
    
    if (stale !== null) {
      // Return stale data and refresh in background
      this.refreshInBackground(cache, key, staleKey, fetcher, freshTtl);
      return stale;
    }

    // No cache or stale data, fetch fresh
    const data = await fetcher();
    cache.set(key, data, freshTtl);
    cache.set(staleKey, data, staleTtl || (freshTtl || 0) * 2);
    
    return data;
  }

  private static async refreshInBackground<T>(
    cache: CacheManager<T>,
    key: string,
    staleKey: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<void> {
    try {
      const data = await fetcher();
      cache.set(key, data, ttl);
      cache.set(staleKey, data, (ttl || 0) * 2);
    } catch (error) {
      console.warn('Background cache refresh failed:', error);
    }
  }

  static preloadCache<T>(
    cache: CacheManager<T>,
    items: Array<{ key: string; data: T; ttl?: number }>
  ): void {
    items.forEach(({ key, data, ttl }) => {
      cache.set(key, data, ttl);
    });
  }

  static invalidatePattern(cache: CacheManager, pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete = cache.keys().filter(key => regex.test(key));
    keysToDelete.forEach(key => cache.delete(key));
  }
}

// Browser storage integration
export class PersistentCache extends CacheManager {
  private storageKey: string;

  constructor(storageKey: string, config: Partial<CacheConfig> = {}) {
    super(config);
    this.storageKey = storageKey;
    this.loadFromStorage();
  }

  set(key: string, data: any, ttl?: number): void {
    super.set(key, data, ttl);
    this.saveToStorage();
  }

  delete(key: string): boolean {
    const result = super.delete(key);
    this.saveToStorage();
    return result;
  }

  clear(): void {
    super.clear();
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, entry]) => {
          // Validate entry structure and TTL
          if (this.isValidEntry(entry)) {
            this.cache.set(key, entry as any);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = Object.fromEntries(this.cache.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  private isValidEntry(entry: any): boolean {
    return (
      entry &&
      typeof entry === 'object' &&
      'data' in entry &&
      'timestamp' in entry &&
      'ttl' in entry
    );
  }
}

// Export default cache instances
export default {
  organization: organizationCache,
  search: searchCache,
  userPreferences: userPreferencesCache,
  analytics: analyticsCache,
  CacheManager,
  CacheOptimizer,
  PersistentCache,
};