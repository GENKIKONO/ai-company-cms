/**
 * Phase 7-B: Org-Groups ドメイン型定義
 * Supabase の「正」のスキーマに合わせた型定義
 */

// ===== Organization Groups =====
// Supabase の正: org_groups テーブル
export interface OrganizationGroupRow {
  id: string;
  owner_organization_id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

// Insert 型
export type OrganizationGroupInsert = Omit<OrganizationGroupRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

// Update 型
export type OrganizationGroupUpdate = Partial<Omit<OrganizationGroupRow, 'id' | 'owner_organization_id' | 'created_at'>> & {
  updated_at?: string;
};

// ===== Org Group Members =====
// Supabase の「正」: org_group_members テーブル
export interface OrgGroupMemberRow {
  id: string;
  group_id: string; // → org_groups.id
  organization_id: string; // → organizations.id
  role: 'admin' | 'member'; // TODO: [SUPABASE_ORG_GROUP_MIGRATION] 実際のenum値を確認
  created_at: string;
}

// Insert 型
export type OrgGroupMemberInsert = Omit<OrgGroupMemberRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
  added_by?: string; // 追加者の organization_id
};

// Update 型
export type OrgGroupMemberUpdate = Partial<Omit<OrgGroupMemberRow, 'id' | 'group_id' | 'organization_id' | 'created_at'>>;

// ===== Org Group Invites =====
// Supabase の「正」: org_group_invites テーブル
export interface OrgGroupInviteRow {
  id: string;
  group_id: string; // → org_groups.id
  code: string; // 招待コード
  expires_at: string;
  max_uses: number;
  used_count: number;
  created_by: string; // organization_id
  note?: string | null;
  created_at: string;
  revoked_at?: string | null;
}

// Insert 型
export type OrgGroupInviteInsert = Omit<OrgGroupInviteRow, 'id' | 'used_count' | 'created_at' | 'revoked_at'> & {
  id?: string;
  used_count?: number;
  created_at?: string;
};

// Update 型
export type OrgGroupInviteUpdate = Partial<Omit<OrgGroupInviteRow, 'id' | 'group_id' | 'code' | 'created_at'>>;

// ===== Org Group Join Requests =====
// Supabase の「正」: org_group_join_requests テーブル
export interface OrgGroupJoinRequestRow {
  id: string;
  group_id: string; // → org_groups.id
  organization_id: string; // → organizations.id
  status: 'pending' | 'approved' | 'rejected'; // TODO: [SUPABASE_ORG_GROUP_MIGRATION] 実際のenum値を確認
  invite_code?: string | null;
  requested_by: string; // organization_id
  reason?: string | null;
  decision_note?: string | null;
  decided_by?: string | null; // organization_id
  decided_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Insert 型
export type OrgGroupJoinRequestInsert = Omit<OrgGroupJoinRequestRow, 'id' | 'status' | 'decided_by' | 'decided_at' | 'created_at' | 'updated_at'> & {
  id?: string;
  status?: 'pending';
  created_at?: string;
  updated_at?: string;
};

// Update 型
export type OrgGroupJoinRequestUpdate = Partial<Omit<OrgGroupJoinRequestRow, 'id' | 'group_id' | 'organization_id' | 'created_at'>> & {
  updated_at?: string;
};

// ===== Extended Types with Relations =====
// JOIN用の拡張型
export interface OrganizationGroupWithOwner extends OrganizationGroupRow {
  owner_organization?: {
    id: string;
    name: string;
    company_name: string;
  } | null;
}

export interface OrganizationGroupWithMembersAndOwner extends OrganizationGroupWithOwner {
  members?: (OrgGroupMemberRow & {
    organization?: {
      id: string;
      name: string;
      company_name: string;
    } | null;
    added_by_org?: {
      id: string;
      name: string;
      company_name: string;
    } | null;
  })[] | null;
  member_count?: number;
}

export interface OrgGroupInviteWithGroup extends OrgGroupInviteRow {
  group?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
}

export interface OrgGroupJoinRequestWithGroup extends OrgGroupJoinRequestRow {
  group?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  requesting_organization?: {
    id: string;
    name: string;
    company_name: string;
  } | null;
}

// ===== API Response Types =====
export interface OrgGroupListApiResponse {
  data: OrganizationGroupWithMembersAndOwner[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface OrgGroupDetailApiResponse {
  data: OrganizationGroupWithMembersAndOwner;
}

export interface OrgGroupMemberListApiResponse {
  data: (OrgGroupMemberRow & {
    organization?: {
      id: string;
      name: string;
      company_name: string;
    } | null;
  })[];
}

export interface OrgGroupInviteListApiResponse {
  data: OrgGroupInviteWithGroup[];
}

export interface OrgGroupJoinRequestListApiResponse {
  data: OrgGroupJoinRequestWithGroup[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

// ===== Validation Schemas (for existing Zod schemas) =====
export interface CreateGroupRequest {
  name: string;
  description?: string;
  owner_organization_id: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
}

export interface AddMemberRequest {
  organization_id: string;
  role?: 'admin' | 'member';
}

export interface CreateInviteRequest {
  max_uses?: number;
  expires_in_hours?: number;
  note?: string;
}

export interface JoinRequestRequest {
  invite_code?: string;
  reason?: string;
}

export interface ProcessJoinRequestRequest {
  action: 'approve' | 'reject';
  decision_note?: string;
}

// ===== Utility Types =====
export type OrgGroupRole = 'admin' | 'member';
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

// ===== Legacy Compatibility =====
// TODO: [SUPABASE_ORG_GROUP_MIGRATION] 既存コードとの互換性用（段階的に廃止）
export interface LegacyOrgGroupMember {
  org_id: string; // → organization_id に移行予定
  role: string;
  added_at: string; // → created_at に移行予定
}

// ===== Error Types =====
export interface OrgGroupApiError {
  error: string;
  details?: any;
}

// ===== Constants =====
export const ORG_GROUP_ROLES: OrgGroupRole[] = ['admin', 'member'];
export const JOIN_REQUEST_STATUSES: JoinRequestStatus[] = ['pending', 'approved', 'rejected'];

// Foreign Key Reference Names (for API queries)
// 実際のDB FK制約名と一致させる
export const FK_REFERENCES = {
  ORG_GROUPS_OWNER: 'org_groups_owner_org_fkey',
  ORG_GROUP_MEMBERS_GROUP: 'org_group_members_group_id_fkey',
  ORG_GROUP_MEMBERS_ORG: 'org_group_members_organization_id_fkey',
  ORG_GROUP_INVITES_GROUP: 'org_group_invites_group_id_fkey',
  ORG_GROUP_JOIN_REQUESTS_GROUP: 'org_group_join_requests_group_id_fkey',
  ORG_GROUP_JOIN_REQUESTS_ORG: 'org_group_join_requests_organization_id_fkey'
} as const;