export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertStatus = 'active' | 'resolved' | 'suppressed' | 'acknowledged';
export type MonitoringSource = 'application' | 'infrastructure' | 'database' | 'external_api' | 'user_activity';

export interface Metric {
  id: string;
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  labels: Record<string, string>;
  timestamp: string;
  source: MonitoringSource;
  organization_id?: string;
  user_id?: string;
}

export interface Alert {
  id: string;
  rule_id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  source: MonitoringSource;
  
  // Trigger information
  triggered_at: string;
  resolved_at?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  
  // Alert data
  current_value: number;
  threshold_value: number;
  metric_name: string;
  labels: Record<string, string>;
  
  // Context
  organization_id?: string;
  affected_users?: string[];
  related_incidents?: string[];
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric_name: string;
  condition: AlertCondition;
  threshold: number;
  severity: AlertSeverity;
  
  // Rule configuration
  evaluation_interval: number; // seconds
  evaluation_duration: number; // seconds  
  labels: Record<string, string>;
  annotations: Record<string, string>;
  
  // Notification settings
  notification_channels: string[];
  suppress_notifications: boolean;
  notification_cooldown: number; // seconds
  
  // Scope
  organization_id?: string;
  applies_to: 'all' | 'organization' | 'user';
  
  // Status
  enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  last_evaluated_at?: string;
}

export interface AlertCondition {
  operator?: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  time_window?: number; // seconds
  group_by?: string[];
}

export interface MonitoringDashboard {
  id: string;
  name: string;
  description: string;
  organization_id?: string;
  
  // Layout configuration
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  
  // Settings
  refresh_interval: number; // seconds
  time_range: TimeRange;
  auto_refresh: boolean;
  
  // Access control
  visibility: 'public' | 'organization' | 'private';
  shared_with: string[];
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface DashboardLayout {
  columns: number;
  row_height: number;
  margin: [number, number];
  padding: [number, number];
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert_list' | 'status' | 'log';
  title: string;
  
  // Position and size
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Configuration
  config: WidgetConfig;
  
  // Data source
  metric_queries: MetricQuery[];
  
  created_at: string;
  updated_at: string;
}

export interface WidgetConfig {
  chart_type?: 'line' | 'bar' | 'pie' | 'gauge' | 'stat';
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  time_range?: TimeRange;
  refresh_interval?: number;
  thresholds?: Threshold[];
  colors?: string[];
  display_mode?: 'table' | 'list' | 'grid';
  show_legend?: boolean;
  show_tooltip?: boolean;
}

export interface MetricQuery {
  id: string;
  metric_name: string;
  labels: Record<string, string>;
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
  time_range: TimeRange;
  group_by?: string[];
}

export interface TimeRange {
  start: string; // ISO string or relative like '1h', '24h', '7d'
  end: string;
  step?: number; // seconds
}

export interface Threshold {
  value: number;
  color: string;
  label?: string;
}

export interface SystemHealth {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  last_updated: string;
  
  // Component health
  components: ComponentHealth[];
  
  // Key metrics
  uptime_percentage: number;
  response_time_avg: number; // ms
  error_rate: number; // percentage
  active_alerts: number;
  
  // Resource utilization
  cpu_usage: number; // percentage
  memory_usage: number; // percentage
  disk_usage: number; // percentage
  
  // External dependencies
  external_services: ExternalServiceHealth[];
}

export interface ComponentHealth {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  response_time: number; // ms
  error_rate: number; // percentage
  last_check: string;
  incidents?: string[];
}

export interface ExternalServiceHealth {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  response_time: number; // ms
  last_check: string;
  endpoint?: string;
}

export interface PerformanceReport {
  id: string;
  organization_id: string;
  period_start: string;
  period_end: string;
  
  // Performance metrics
  metrics: {
    avg_response_time: number;
    p95_response_time: number;
    p99_response_time: number;
    error_rate: number;
    throughput: number; // requests per second
    uptime: number; // percentage
  };
  
  // Trend analysis
  trends: {
    response_time_trend: number; // percentage change
    error_rate_trend: number;
    throughput_trend: number;
    uptime_trend: number;
  };
  
  // Top issues
  top_errors: ErrorSummary[];
  slow_endpoints: EndpointPerformance[];
  
  // Recommendations
  recommendations: PerformanceRecommendation[];
  
  created_at: string;
}

export interface ErrorSummary {
  error_type: string;
  count: number;
  percentage: number;
  first_seen: string;
  last_seen: string;
  affected_endpoints: string[];
}

export interface EndpointPerformance {
  endpoint: string;
  avg_response_time: number;
  p95_response_time: number;
  request_count: number;
  error_count: number;
  error_rate: number;
}

export interface PerformanceRecommendation {
  type: 'optimization' | 'scaling' | 'configuration' | 'monitoring';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  
  // Implementation details
  steps: string[];
  estimated_improvement: string;
  resources: string[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: string;
  
  // Context
  organization_id?: string;
  user_id?: string;
  session_id?: string;
  trace_id?: string;
  
  // Structured data
  labels: Record<string, string>;
  fields: Record<string, any>;
  
  // Location
  file?: string;
  line?: number;
  function?: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'discord';
  
  // Configuration
  config: NotificationConfig;
  
  // Settings
  enabled: boolean;
  rate_limit: number; // messages per hour
  escalation_delay: number; // seconds
  
  // Filtering
  severity_filter: AlertSeverity[];
  source_filter: MonitoringSource[];
  organization_filter: string[];
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface NotificationConfig {
  // Email
  email?: {
    recipients: string[];
    subject_template: string;
    body_template: string;
  };
  
  // Slack
  slack?: {
    webhook_url: string;
    channel: string;
    username: string;
    icon_emoji: string;
  };
  
  // Webhook
  webhook?: {
    url: string;
    method: 'POST' | 'PUT';
    headers: Record<string, string>;
    body_template: string;
  };
  
  // SMS
  sms?: {
    provider: 'twilio' | 'aws_sns';
    recipients: string[];
  };
}

// API Request/Response Types
export interface CreateAlertRuleRequest {
  name: string;
  description: string;
  metric_name: string;
  condition: AlertCondition;
  threshold: number;
  severity: AlertSeverity;
  notification_channels: string[];
  organization_id?: string;
}

export interface UpdateAlertRuleRequest {
  name?: string;
  description?: string;
  condition?: Partial<AlertCondition>;
  threshold?: number;
  severity?: AlertSeverity;
  notification_channels?: string[];
  enabled?: boolean;
}

export interface MonitoringFilters {
  source?: MonitoringSource;
  severity?: AlertSeverity;
  status?: AlertStatus;
  organization_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Utility Types
export type MetricAggregation = {
  [K in keyof Metric]: Metric[K][];
} & {
  count: number;
  avg_value: number;
  min_value: number;
  max_value: number;
  sum_value: number;
};

export type AlertSummary = Pick<Alert, 'id' | 'name' | 'severity' | 'status' | 'triggered_at'> & {
  duration?: number; // seconds
  affected_resources?: string[];
};