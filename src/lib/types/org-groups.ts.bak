/**
 * Organization Groups Types
 * Type definitions for Enterprise Groups functionality
 */

export interface Organization {
  id: string;
  name: string;
  company_name?: string;
}

export interface GroupMember {
  id: string;
  role: 'member' | 'admin';
  added_at: string;
  organization: Organization;
  added_by_org: Organization;
}

export interface OrganizationGroup {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  owner_organization: Organization;
  members: GroupMember[];
}

export interface GroupInvite {
  id: string;
  group_id: string;
  code: string;
  expires_at?: string | null;
  max_uses?: number | null;
  used_count: number;
  created_by: string;
  note?: string | null;
  created_at: string;
  revoked_at?: string | null;
}

export interface JoinRequest {
  id: string;
  group_id: string;
  organization_id: string;
  status: 'pending' | 'approved' | 'rejected';
  invite_code: string;
  requested_by: string;
  reason?: string | null;
  decision_note?: string | null;
  decided_by?: string | null;
  decided_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  group?: {
    id: string;
    name: string;
    owner_organization: Organization;
  };
  organization?: Organization;
  requested_by_user?: {
    id: string;
    email?: string;
  };
}