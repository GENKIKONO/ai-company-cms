export type PartnerStatus = 'pending' | 'active' | 'suspended' | 'terminated';
export type PartnerTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type CommissionType = 'percentage' | 'flat_rate' | 'tiered';
export type PayoutFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
export type PayoutMethod = 'bank_transfer' | 'paypal' | 'stripe' | 'crypto';

export interface Partner {
  id: string;
  user_id: string;
  business_name: string;
  business_type: 'agency' | 'freelancer' | 'consultant' | 'integrator' | 'reseller';
  status: PartnerStatus;
  tier: PartnerTier;
  contact_email: string;
  contact_phone?: string;
  website?: string;
  description?: string;
  
  // Address and Legal
  business_address: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  tax_id?: string;
  business_license?: string;
  
  // Partnership Details
  referral_code: string;
  commission_config: CommissionConfig;
  payment_config: PaymentConfig;
  contract_start_date: string;
  contract_end_date?: string;
  
  // Performance Metrics (read-only, computed)
  metrics: PartnerMetrics;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_activity_at?: string;
}

export interface CommissionConfig {
  type?: CommissionType;
  base_rate?: number; // percentage (0-100) or flat amount in cents
  tiers?: CommissionTier[]; // for tiered commission
  minimum_payout?: number; // in cents
  maximum_monthly_payout?: number; // in cents
  performance_bonus?: PerformanceBonus[];
}

export interface CommissionTier {
  min_revenue?: number; // in cents
  max_revenue?: number; // in cents
  rate?: number; // percentage or flat rate
}

export interface PerformanceBonus {
  metric?: 'monthly_revenue' | 'client_retention' | 'client_count';
  threshold?: number;
  bonus_rate?: number; // percentage bonus
  max_bonus?: number; // in cents
}

export interface PaymentConfig {
  frequency?: PayoutFrequency;
  method?: PayoutMethod;
  account_details?: {
    bank_name?: string;
    account_number?: string;
    routing_number?: string;
    paypal_email?: string;
    stripe_account_id?: string;
    crypto_wallet?: string;
  };
  tax_withholding?: number; // percentage
  payment_day?: number; // 1-31 for monthly, 1-7 for weekly
}

export interface PartnerMetrics {
  total_referrals: number;
  active_clients: number;
  total_revenue_generated: number; // in cents
  total_commission_earned: number; // in cents
  pending_commission: number; // in cents
  last_30_days: {
    new_referrals: number;
    revenue_generated: number;
    commission_earned: number;
  };
  conversion_rate: number; // percentage
  average_client_value: number; // in cents
  client_retention_rate: number; // percentage
  performance_score: number; // 0-100
}

export interface PartnerReferral {
  id: string;
  partner_id: string;
  organization_id: string;
  referral_code: string;
  status: 'pending' | 'converted' | 'expired' | 'invalid';
  conversion_date?: string;
  initial_plan?: string;
  current_plan?: string;
  lifetime_value: number; // in cents
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  partner_id: string;
  referral_id: string;
  organization_id: string;
  amount: number; // in cents
  currency: 'USD' | 'JPY' | 'EUR';
  commission_rate: number; // percentage used
  revenue_amount: number; // in cents - original revenue
  period_start: string;
  period_end: string;
  status: 'pending' | 'approved' | 'paid' | 'disputed' | 'cancelled';
  payout_id?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface Payout {
  id: string;
  partner_id: string;
  total_amount: number; // in cents
  currency: 'USD' | 'JPY' | 'EUR';
  commission_count: number;
  period_start: string;
  period_end: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  method: PayoutMethod;
  transaction_id?: string;
  processed_at?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerActivity {
  id: string;
  partner_id: string;
  type: 'referral_created' | 'referral_converted' | 'commission_earned' | 'payout_requested' | 'status_changed' | 'profile_updated';
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
  created_by?: string;
}

export interface PartnerApplication {
  id: string;
  user_id: string;
  business_name: string;
  business_type: Partner['business_type'];
  contact_email: string;
  contact_phone?: string;
  website?: string;
  description: string;
  experience_description: string;
  estimated_monthly_referrals: number;
  target_market: string[];
  marketing_channels: string[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// API Request/Response Types
export interface CreatePartnerRequest {
  business_name: string;
  business_type: Partner['business_type'];
  contact_email: string;
  contact_phone?: string;
  website?: string;
  description?: string;
  business_address: Partner['business_address'];
  tax_id?: string;
  commission_config: CommissionConfig;
  payment_config: Omit<PaymentConfig, 'account_details'>;
}

export interface UpdatePartnerRequest {
  business_name?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  description?: string;
  business_address?: Partial<Partner['business_address']>;
  tax_id?: string;
  commission_config?: Partial<CommissionConfig>;
  payment_config?: Partial<PaymentConfig>;
  status?: PartnerStatus;
  tier?: PartnerTier;
}

export interface PartnerDashboardData {
  partner: Partner;
  recent_referrals: PartnerReferral[];
  pending_commissions: Commission[];
  recent_payouts: Payout[];
  activity_feed: PartnerActivity[];
  performance_chart_data: {
    period: string;
    referrals: number;
    revenue: number;
    commission: number;
  }[];
}

export interface PartnerFilters {
  status?: PartnerStatus;
  tier?: PartnerTier;
  business_type?: Partner['business_type'];
  search?: string;
  date_from?: string;
  date_to?: string;
  min_revenue?: number;
  max_revenue?: number;
  sort_by?: 'name' | 'revenue' | 'commission' | 'referrals' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

// Utility Types
export type PartnerWithMetrics = Partner & {
  monthly_metrics: PartnerMetrics['last_30_days'];
  trend_data: {
    revenue_trend: number; // percentage change
    referral_trend: number;
    commission_trend: number;
  };
};

export type PartnerSummary = Pick<Partner, 'id' | 'business_name' | 'status' | 'tier' | 'referral_code'> & {
  total_revenue: number;
  total_commission: number;
  active_referrals: number;
};