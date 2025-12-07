export type ReportLevel = 'light' | 'detail' | 'advanced' | 'custom';

export type PlanId = 'starter' | 'pro' | 'business' | 'enterprise';

export interface ReportPeriod {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface ContentMetrics {
  total_page_views: number;
  unique_contents: number;
  services_published: number;
  faqs_published: number;
  case_studies_published: number;
  posts_published: number;
  news_published: number;
  products_published: number;
  ai_generated_contents: number;
}

export interface TopContent {
  type: string;
  id: string;
  title: string;
  page_views: number;
  url?: string;
}

export interface WeakContent {
  type: string;
  id: string;
  title: string;
  reason: string;
  page_views: number;
}

export interface SuggestionItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  related_content_type?: string;
  related_content_id?: string;
  category?: string;
}

export interface ReportSections {
  kpi_overview: {
    summary: string;
    metrics: ContentMetrics;
  };
  top_contents: {
    items: TopContent[];
  };
  weak_contents?: {
    items: WeakContent[];
  };
  qna_insights?: {
    top_faqs: TopContent[];
    falling_faqs?: TopContent[];
  };
  trends?: {
    description: string;
    monthly_data: Array<{
      month: string;
      page_views: number;
    }>;
  };
  ai_content_effect?: {
    ai_generated_ratio: number;
    ai_generated_views_ratio: number;
    description: string;
  };
  interview_insights?: {
    sessions_count: number;
    generated_contents: number;
    description: string;
  };
}

export interface AiMonthlyReportData {
  organization_id: string;
  plan_id: PlanId;
  level: ReportLevel;
  period_start: string;
  period_end: string;
  summary_text: string;
  metrics: ContentMetrics;
  sections: ReportSections;
  suggestions: SuggestionItem[];
}