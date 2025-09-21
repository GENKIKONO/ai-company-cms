// API関連型定義

import { Organization, Partner, Service, CaseStudy, FAQ, AppUser } from './database';

// 抽出API関連
export interface ExtractionResult {
  title?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  industry?: string;
  founded?: string;
  employees?: string;
  capital?: string;
  representative?: string;
  content?: string;
}

export interface URLExtractionRequest {
  url: string;
}

export interface PDFExtractionRequest {
  file: File | Buffer;
  filename: string;
}

// Analytics関連
export interface AnalyticsPageView {
  url: string;
  referrer?: string;
  title?: string;
}

export interface AnalyticsEventPayload {
  name: string;
  properties?: Record<string, any>;
}

export interface TrackingData {
  organizationSlug?: string;
  organizationName?: string;
  externalUrl?: string;
  eventType?: 'page_view' | 'external_link' | 'form_submit' | 'download';
  metadata?: Record<string, any>;
}

// OGP画像生成関連
export interface OGPGenerationRequest {
  title: string;
  subtitle?: string;
  logoUrl?: string;
  template?: 'corporate' | 'service' | 'news' | 'event';
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  width?: number;
  height?: number;
}

export interface OGPGenerationResponse {
  imageUrl: string;
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'webp';
}

// 画像最適化関連
export interface ImageOptimizationRequest {
  file: File | Buffer;
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
    removeExif?: boolean;
  };
}

export interface ImageOptimizationResponse {
  optimizedImage: Buffer;
  originalSize: number;
  optimizedSize: number;
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
}

// パートナー管理関連
export interface PartnerStats {
  totalOrganizations: number;
  publishedOrganizations: number;
  totalRevenue: number;
  commissionEarned: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    commission: number;
  }>;
  topOrganizations: Array<{
    id: string;
    name: string;
    revenue: number;
    viewCount: number;
  }>;
}

export interface PartnerDashboardData {
  partner: Partner;
  stats: PartnerStats;
  organizations: Organization[];
  recentActivity: Array<{
    id: string;
    type: 'organization_created' | 'organization_published' | 'payment_received';
    description: string;
    timestamp: string;
  }>;
}

// 組織詳細ページ関連
export interface OrganizationPageData {
  organization: Organization & {
    services: Service[];
    case_studies: CaseStudy[];
    faqs: FAQ[];
  };
  partner?: Partner;
}

// 検索・フィルタリング関連
export interface SearchFilters {
  query?: string;
  status?: string[];
  industries?: string[];
  partner_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface SearchParams extends SearchFilters {
  sort?: SortOptions;
  pagination?: PaginationOptions;
}

// ファイルアップロード関連
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

// バリデーション関連
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Webhook関連
export interface WebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp: string;
  signature?: string;
}

// レート制限関連
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
}

// 認証関連
export interface AuthUser {
  id: string;
  email: string;
  role: AppUser['role'];
  partner_id?: string;
  permissions: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  role?: AppUser['role'];
  partner_id?: string;
}

// セッション関連
export interface SessionData {
  user: AuthUser;
  expiresAt: string;
  csrfToken: string;
}

// エラーレスポンス
export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
}