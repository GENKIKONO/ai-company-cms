/**
 * Supabase Type Helpers
 *
 * よく使用するテーブル型のエイリアス
 * NOTE: organization_groups テーブルは型生成に含まれていないため除外
 */
import type { Database } from '@/types/supabase';

// Organization Groups
export type OrgGroupMember = Database['public']['Tables']['org_group_members']['Row'];
export type OrgGroupInvite = Database['public']['Tables']['org_group_invites']['Row'];
export type OrgGroupJoinRequest = Database['public']['Tables']['org_group_join_requests']['Row'];

// Insert/Update types
export type OrgGroupMemberInsert = Database['public']['Tables']['org_group_members']['Insert'];
export type OrgGroupInviteInsert = Database['public']['Tables']['org_group_invites']['Insert'];
export type OrgGroupJoinRequestInsert = Database['public']['Tables']['org_group_join_requests']['Insert'];
