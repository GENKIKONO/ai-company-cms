// Review and audit system types

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'under_review';
export type ReviewAction = 'approve' | 'reject' | 'request_changes' | 'reopen';
export type ReportCategory = 'fake_info' | 'inappropriate' | 'copyright' | 'spam' | 'other';

export interface ReviewAudit {
  id: string;
  organization_id: string;
  reviewer_id: string;
  action: ReviewAction;
  previous_status?: ReviewStatus;
  new_status: ReviewStatus;
  reason?: string;
  category?: ReportCategory;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewAuditWithDetails extends ReviewAudit {
  organization_name: string;
  reviewer_name: string;
  reviewer_email: string;
}

export interface ReviewFilters {
  status?: ReviewStatus;
  category?: ReportCategory;
  reviewer_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface ReportStats {
  total_reports: number;
  pending_reviews: number;
  approved_this_week: number;
  rejected_this_week: number;
  categories: Record<ReportCategory, number>;
}

export interface ReopenRequest {
  organization_id: string;
  reason: string;
  category?: ReportCategory;
  notes?: string;
}