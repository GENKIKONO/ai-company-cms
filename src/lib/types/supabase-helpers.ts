/**
 * Supabase Type Helpers
 *
 * よく使用するテーブル型のエイリアス
 */
import type { Database } from '@/types/supabase';

// Organization Groups
export type OrgGroup = Database['public']['Tables']['org_groups']['Row'];
export type OrgGroupInsert = Database['public']['Tables']['org_groups']['Insert'];
export type OrgGroupUpdate = Database['public']['Tables']['org_groups']['Update'];

export type OrgGroupMember = Database['public']['Tables']['org_group_members']['Row'];
export type OrgGroupInvite = Database['public']['Tables']['org_group_invites']['Row'];
export type OrgGroupJoinRequest = Database['public']['Tables']['org_group_join_requests']['Row'];

// Insert/Update types
export type OrgGroupMemberInsert = Database['public']['Tables']['org_group_members']['Insert'];
export type OrgGroupInviteInsert = Database['public']['Tables']['org_group_invites']['Insert'];
export type OrgGroupJoinRequestInsert = Database['public']['Tables']['org_group_join_requests']['Insert'];
