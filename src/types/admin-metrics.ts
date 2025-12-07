/**
 * P3-8: Admin Metrics Dashboard Types
 * Supabase側のKPI VIEW定義に対応した型定義
 */

export type JobFailRate = {
  job_name: string;
  failed_count: number;
  total_runs: number;
  fail_rate_pct: number;
};

export type EdgeErrorRate = {
  function_name: string;
  failed_count: number;
  total_runs: number;
  error_rate_pct: number;
};

export type WeeklyRlsDenied = {
  week_start_utc: string; // ISO (UTC), e.g. "2025-11-24T00:00:00.000Z"
  rls_denied_count: number;
};

export type WeeklyJobFailRate = {
  week_start_utc: string;
  job_name: string;
  fail_rate_pct: number;
};

export type WeeklyAiInterviewCompletion = {
  week_start_utc: string;
  org_id: string | null;
  completion_rate_pct: number;
};

export type WeeklyAiCitations = {
  week_start_utc: string;
  org_id: string | null;
  avg_items_per_response: number;
  tokens_sum: number;
};

export type WeeklySecurityIncidents = {
  week_start_utc: string;
  incident_type: string;
  risk: string | null;
  incident_count: number;
};

export type WeeklyAlertEvents = {
  event_type: string;
  event_count: number;
};

export type MetricsSummary = {
  rls_denied_count: number;
  job_fail_rate_top3: JobFailRate[];
  edge_error_rate_worst3: EdgeErrorRate[];
  security_incidents_count: number;
};

export type MetricsCharts = {
  rls_denied_weekly: WeeklyRlsDenied[];
  job_fail_rate_weekly_by_job: WeeklyJobFailRate[];
  edge_error_rate_latest_week: EdgeErrorRate[];
  ai_interview_completion_rate_weekly_by_org: WeeklyAiInterviewCompletion[];
  ai_citations_weekly_by_org: WeeklyAiCitations[];
  security_incidents_weekly_by_type_and_risk: WeeklySecurityIncidents[];
  alert_events_current_week: WeeklyAlertEvents[];
};

export type AdminMetricsResponse = {
  summary: MetricsSummary;
  charts: MetricsCharts;
};

export type MetricsApiParams = {
  range?: '1w' | '4w' | '12w';
  orgId?: string;
};