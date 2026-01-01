/**
 * Supabase Type Helpers
 *
 * よく使用するテーブル型のエイリアス
 * 注意: DBスキーマと型定義に差分がある場合があるため、拡張型を使用
 */
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// Organization Groups - Base types from generated schema
export type OrgGroup = Database['public']['Tables']['org_groups']['Row'];
export type OrgGroupMember = Database['public']['Tables']['org_group_members']['Row'];
export type OrgGroupInvite = Database['public']['Tables']['org_group_invites']['Row'];
export type OrgGroupJoinRequest = Database['public']['Tables']['org_group_join_requests']['Row'];

// Organization type
export type Organization = Database['public']['Tables']['organizations']['Row'];

// 拡張Insert/Update型 (DBスキーマに存在するが型生成に含まれないカラムを追加)
export type OrgGroupInsert = Database['public']['Tables']['org_groups']['Insert'] & {
  description?: string | null;
};
export type OrgGroupUpdate = Database['public']['Tables']['org_groups']['Update'] & {
  description?: string | null;
  updated_at?: string;
};

export type OrgGroupMemberInsert = Database['public']['Tables']['org_group_members']['Insert'] & {
  added_by?: string | null;
};
export type OrgGroupMemberUpdate = Database['public']['Tables']['org_group_members']['Update'];

export type OrgGroupInviteInsert = Database['public']['Tables']['org_group_invites']['Insert'];
export type OrgGroupInviteUpdate = Database['public']['Tables']['org_group_invites']['Update'];

export type OrgGroupJoinRequestInsert = Database['public']['Tables']['org_group_join_requests']['Insert'];
export type OrgGroupJoinRequestUpdate = Database['public']['Tables']['org_group_join_requests']['Update'];

// Organization基本情報型 (JOINクエリ結果用)
export interface OrganizationBasic {
  id: string;
  name: string;
  company_name?: string | null;
}

// JOIN result types for org-groups queries
export type OrgGroupWithOwner = OrgGroup & {
  description?: string | null;
  updated_at?: string;
  owner_organization: OrganizationBasic | null;
};

export type OrgGroupWithMemberCount = OrgGroup & {
  description?: string | null;
  owner_organization: OrganizationBasic | null;
  member_count: { count: number }[] | null;
};

export type OrgGroupMemberWithOrg = OrgGroupMember & {
  organization: OrganizationBasic | null;
  added_by_org: OrganizationBasic | null;
};

/**
 * Untyped Supabase client for complex queries with JOINs
 * 型生成に含まれないカラム (company_name, description等) を含むクエリに使用
 */
export type UntypedSupabaseClient = SupabaseClient<never, 'public', never>;
