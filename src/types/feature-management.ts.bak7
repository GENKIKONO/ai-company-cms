/**
 * Feature Management API 型定義
 */

export type FeatureControlType = 'limit_number' | 'on_off' | 'enum';
export type PlanType = 'starter' | 'pro' | 'business' | 'enterprise';

export interface FeatureRegistry {
  id: string;
  feature_key: string;
  display_name: string;
  control_type: FeatureControlType;
  category: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanFeature {
  id: string;
  plan_type: PlanType;
  feature_key: string;
  config_value: {
    limit?: number;  // -1 = 無制限
    enabled?: boolean;
    level?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  target_type: string;
  target_id?: string;
  user_id?: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
}

// API Request/Response types
export interface FeatureManagementGetResponse {
  features: FeatureRegistry[];
  planFeatures: PlanFeature[];
}

export interface FeatureManagementUpdateRequest {
  updates: {
    plan_type: PlanType;
    feature_key: string;
    config_value: {
      limit?: number;
      enabled?: boolean;
      level?: string;
    };
  }[];
}

export interface FeatureManagementUpdateResponse {
  success: boolean;
  updated_count: number;
  audit_log_id: string;
}

// UI用の統合型
export interface FeatureMatrixData {
  feature_key: string;
  display_name: string;
  control_type: FeatureControlType;
  category: string;
  plan_values: {
    [K in PlanType]: {
      limit?: number;
      enabled?: boolean;
      level?: string;
    };
  };
}