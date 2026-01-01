/**
 * Type Guards for Org-Groups Domain
 *
 * 実行時にクエリ結果の shape を検証し、型安全性を担保する。
 */
import type {
  OrgGroup,
  OrgGroupWithOwner,
  OrgGroupMember,
  OrgGroupMemberWithOrg,
  OrgGroupInvite,
  OrgGroupJoinRequest,
} from '@/lib/types/supabase-helpers';

// Extended type for join requests with relations (defined locally since complex)
type OrgGroupJoinRequestWithRelations = OrgGroupJoinRequest & {
  group?: OrgGroup | null;
  organization?: { id: string; name: string } | null;
};

/**
 * OrgGroup の基本型ガード
 */
export function isOrgGroup(v: unknown): v is OrgGroup {
  if (v === null || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    ('owner_organization_id' in obj)
  );
}

/**
 * OrgGroupWithOwner の型ガード（JOIN結果用）
 */
export function isOrgGroupWithOwner(v: unknown): v is OrgGroupWithOwner {
  if (!isOrgGroup(v)) return false;
  const obj = v as Record<string, unknown>;
  // owner_organization は null または { id, name } オブジェクト
  if (!('owner_organization' in obj)) return false;
  const owner = obj.owner_organization;
  if (owner === null) return true;
  if (typeof owner !== 'object') return false;
  const ownerObj = owner as Record<string, unknown>;
  return typeof ownerObj.id === 'string' && typeof ownerObj.name === 'string';
}

/**
 * OrgGroupMember の基本型ガード
 */
export function isOrgGroupMember(v: unknown): v is OrgGroupMember {
  if (v === null || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.group_id === 'string' &&
    typeof obj.organization_id === 'string'
  );
}

/**
 * OrgGroupMemberWithOrg の型ガード（JOIN結果用）
 */
export function isOrgGroupMemberWithOrg(v: unknown): v is OrgGroupMemberWithOrg {
  if (!isOrgGroupMember(v)) return false;
  const obj = v as Record<string, unknown>;
  // organization は null または { id, name } オブジェクト
  if (!('organization' in obj)) return false;
  const org = obj.organization;
  if (org === null) return true;
  if (typeof org !== 'object') return false;
  const orgObj = org as Record<string, unknown>;
  return typeof orgObj.id === 'string';
}

/**
 * OrgGroupInvite の基本型ガード
 */
export function isOrgGroupInvite(v: unknown): v is OrgGroupInvite {
  if (v === null || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.group_id === 'string' &&
    typeof obj.code === 'string'
  );
}

/**
 * OrgGroupJoinRequest の基本型ガード
 */
export function isOrgGroupJoinRequest(v: unknown): v is OrgGroupJoinRequest {
  if (v === null || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.group_id === 'string' &&
    typeof obj.organization_id === 'string' &&
    typeof obj.status === 'string'
  );
}

/**
 * OrgGroupJoinRequestWithRelations の型ガード（JOIN結果用）
 */
export function isOrgGroupJoinRequestWithRelations(v: unknown): v is OrgGroupJoinRequestWithRelations {
  if (!isOrgGroupJoinRequest(v)) return false;
  const obj = v as Record<string, unknown>;
  // group と organization がオプショナルで存在
  return 'group' in obj || 'organization' in obj;
}

/**
 * 配列の型ガード（任意の要素型に対応）
 */
export function isArrayOf<T>(
  arr: unknown,
  guard: (v: unknown) => v is T
): arr is T[] {
  return Array.isArray(arr) && arr.every(guard);
}
