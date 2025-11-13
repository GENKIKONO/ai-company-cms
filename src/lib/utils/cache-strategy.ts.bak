import { logger } from '@/lib/utils/logger';

/**
 * キャッシュ戦略ユーティリティ (I2)
 * ブラウザキャッシュ、Service Worker、メモリキャッシュの管理
 */

export interface CacheConfig {
  maxAge: number; // seconds
  sMaxAge?: number; // seconds (CDN cache)
  staleWhileRevalidate?: number; // seconds
  mustRevalidate?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  etag?: boolean;
  lastModified?: boolean;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expires: number;
  key: string;
}

/**
 * Cache-Control ヘッダー生成
 */
export function generateCacheControlHeader(config: CacheConfig): string {
  const directives: string[] = [];

  if (config.noStore) {
    directives.push('no-store');
    return directives.join(', ');
  }

  if (config.noCache) {
    directives.push('no-cache');
  }

  if (config.mustRevalidate) {
    directives.push('must-revalidate');
  }

  if (config.maxAge !== undefined) {
    directives.push(`max-age=${config.maxAge}`);
  }

  if (config.sMaxAge !== undefined) {
    directives.push(`s-maxage=${config.sMaxAge}`);
  }

  if (config.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }

  return directives.join(', ');
}

/**
 * レスポンス用キャッシュヘッダー設定
 */
export function setCacheHeaders(
  headers: Headers,
  config: CacheConfig,
  lastModified?: Date,
  etag?: string
): void {
  headers.set('Cache-Control', generateCacheControlHeader(config));

  if (config.etag && etag) {
    headers.set('ETag', etag);
  }

  if (config.lastModified && lastModified) {
    headers.set('Last-Modified', lastModified.toUTCString());
  }

  // セキュリティヘッダー
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
}

/**
 * 静的アセット用キャッシュ設定
 */
export const STATIC_ASSET_CACHE: CacheConfig = {
  maxAge: 31536000, // 1年
  sMaxAge: 31536000,
  mustRevalidate: false,
  etag: true
};

/**
 * API レスポンス用キャッシュ設定
 */
export const API_RESPONSE_CACHE: CacheConfig = {
  maxAge: 300, // 5分
  sMaxAge: 60, // CDNで1分
  staleWhileRevalidate: 300,
  mustRevalidate: true,
  etag: true,
  lastModified: true
};

/**
 * 動的コンテンツ用キャッシュ設定
 */
export const DYNAMIC_CONTENT_CACHE: CacheConfig = {
  maxAge: 0,
  sMaxAge: 60, // CDNで1分
  staleWhileRevalidate: 300,
  mustRevalidate: true,
  etag: true
};

/**
 * 認証不要の公開コンテンツ用キャッシュ設定
 */
export const PUBLIC_CONTENT_CACHE: CacheConfig = {
  maxAge: 3600, // 1時間
  sMaxAge: 3600,
  staleWhileRevalidate: 1800,
  etag: true,
  lastModified: true
};

/**
 * プライベート/認証済みコンテンツ用キャッシュ設定
 */
export const PRIVATE_CONTENT_CACHE: CacheConfig = {
  maxAge: 0,
  noCache: true,
  mustRevalidate: true
};

/**
 * メモリキャッシュ実装
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 100, ttl = 300000) { // デフォルト5分
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set<T>(key: string, data: T, customTtl?: number): void {
    const now = Date.now();
    const expires = now + (customTtl || this.ttl);

    // サイズ制限チェック
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expires,
      key
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // 有効期限チェック
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expires) {
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

  size(): number {
    return this.cache.size;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // 期限切れエントリの一括削除
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }

  // キャッシュ統計
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    let oldest = Date.now();
    let newest = 0;

    for (const entry of Array.from(this.cache.values())) {
      if (entry.timestamp < oldest) oldest = entry.timestamp;
      if (entry.timestamp > newest) newest = entry.timestamp;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // 実装する場合はヒット/ミス カウンターが必要
      oldestEntry: oldest,
      newestEntry: newest
    };
  }
}

// グローバルメモリキャッシュインスタンス
export const memoryCache = new MemoryCache();

/**
 * ブラウザ ストレージ キャッシュ
 */
export class BrowserStorageCache {
  private storage: Storage;
  private prefix: string;

  constructor(useSessionStorage = false, prefix = 'aiohub_cache_') {
    if (typeof window === 'undefined') {
      throw new Error('BrowserStorageCache can only be used in browser environment');
    }
    
    this.storage = useSessionStorage ? sessionStorage : localStorage;
    this.prefix = prefix;
  }

  set<T>(key: string, data: T, ttl = 300000): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl,
      key
    };

    try {
      this.storage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      // ストレージ容量超過時は古いエントリを削除
      this.cleanup();
      try {
        this.storage.setItem(this.prefix + key, JSON.stringify(entry));
      } catch {
        // それでも失敗する場合は諦める
        logger.warn('Failed to store cache entry', key);
      }
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(this.prefix + key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      if (Date.now() > entry.expires) {
        this.storage.removeItem(this.prefix + key);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.storage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key);
      }
    }
    keys.forEach(key => this.storage.removeItem(key));
  }

  cleanup(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (!key || !key.startsWith(this.prefix)) continue;

      try {
        const item = this.storage.getItem(key);
        if (item) {
          const entry: CacheEntry = JSON.parse(item);
          if (now > entry.expires) {
            keysToRemove.push(key);
          }
        }
      } catch {
        // 無効なデータは削除
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.storage.removeItem(key));
  }
}

/**
 * ETag生成
 */
export function generateETag(data: string | Buffer): string {
  const crypto = require('crypto');
  return `"${crypto.createHash('md5').update(data).digest('hex')}"`;
}

/**
 * Last-Modified 比較
 */
export function isModifiedSince(lastModified: Date, ifModifiedSince?: string): boolean {
  if (!ifModifiedSince) return true;
  
  try {
    const since = new Date(ifModifiedSince);
    return lastModified > since;
  } catch {
    return true;
  }
}

/**
 * ETag 比較
 */
export function isETagMatch(etag: string, ifNoneMatch?: string): boolean {
  if (!ifNoneMatch) return false;
  
  // ワイルドカードチェック
  if (ifNoneMatch === '*') return true;
  
  // 複数ETagの比較
  const etags = ifNoneMatch.split(',').map(tag => tag.trim());
  return etags.includes(etag);
}

/**
 * キャッシュキー生成
 */
export function generateCacheKey(
  baseKey: string,
  params: Record<string, any> = {},
  userId?: string
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  const parts = [baseKey];
  if (sortedParams) parts.push(sortedParams);
  if (userId) parts.push(`user:${userId}`);
  
  return parts.join('::');
}

/**
 * 条件付きレスポンス生成
 */
export function createConditionalResponse(
  data: any,
  cacheConfig: CacheConfig,
  request: Request,
  lastModified?: Date,
  customETag?: string
): Response {
  const headers = new Headers();
  
  // ETag生成
  const etag = customETag || generateETag(JSON.stringify(data));
  
  // 条件付きリクエストチェック
  const ifModifiedSince = request.headers.get('If-Modified-Since');
  const ifNoneMatch = request.headers.get('If-None-Match');
  
  // 304 Not Modified判定
  let notModified = false;
  
  if (ifNoneMatch && isETagMatch(etag, ifNoneMatch)) {
    notModified = true;
  } else if (lastModified && ifModifiedSince && !isModifiedSince(lastModified, ifModifiedSince)) {
    notModified = true;
  }
  
  if (notModified) {
    setCacheHeaders(headers, cacheConfig, lastModified, etag);
    return new Response(null, { status: 304, headers });
  }
  
  // 通常のレスポンス
  setCacheHeaders(headers, cacheConfig, lastModified, etag);
  headers.set('Content-Type', 'application/json');
  
  return new Response(JSON.stringify(data), { headers });
}