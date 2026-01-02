/**
 * ペイロード型定義
 * normalize関数・API間で共通使用する最小保証型
 */

import type { JsonObject, JsonValue } from '@/lib/utils/ab-testing';

/**
 * 最小ペイロード型
 * すべてのnormalize関数の戻り値が満たすべき最小構造
 */
export interface MinimalPayload extends JsonObject {
  id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * コンテンツペイロード型
 * コンテンツ系normalize関数の戻り値型
 */
export interface ContentPayload extends MinimalPayload {
  title?: string;
  slug?: string;
  is_published?: boolean;
  status?: 'draft' | 'published' | 'archived';
}

/**
 * 組織ペイロード型
 */
export interface OrganizationPayload extends MinimalPayload {
  name?: string;
  slug?: string;
  description?: string;
  is_published?: boolean;
  status?: 'draft' | 'published' | 'archived';
}

/**
 * 型ガード: MinimalPayloadかどうか
 */
export function isMinimalPayload(value: unknown): value is MinimalPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  // id があれば string であること
  if (obj.id !== undefined && typeof obj.id !== 'string') {
    return false;
  }
  return true;
}

/**
 * unknown → MinimalPayload 変換（境界用）
 */
export function toMinimalPayload(value: unknown): MinimalPayload {
  if (isMinimalPayload(value)) {
    return value;
  }
  return {};
}

// Re-export for convenience
export type { JsonObject, JsonValue };
