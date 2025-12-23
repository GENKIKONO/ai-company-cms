/**
 * Database Types - Migration Compatibility Layer
 * 
 * 🚨 DEPRECATED: This file provides backward compatibility only
 * 
 * For new development, use:
 * - @/types/supabase - Single source of truth from Supabase
 * - @/types/domain/* - UI-specific types
 * - @/types/utils/database - Utility types and helpers
 * - @/types/legacy/database - Legacy types (for migration only)
 * 
 * This file will be removed after all imports are migrated.
 */

// Re-export commonly used types for backward compatibility
export type {
  UserRole,
  UserSegment, 
  OrganizationStatus,
  PartnershipType,
  ServiceMedia
} from './utils/database';

// Re-export legacy types (use sparingly)
export type {
  AppUser,
  Partner,
  Organization,
  Service,
  FAQ,
  CaseStudy,
  Post
} from './legacy/database';

// Re-export API response types
export type {
  APIResponse,
  MyOrganizationResponse,
  MyOrganizationUpdateResponse,
  MyOrganizationDeleteResponse,
  MyOrganizationErrorResponse
} from './domain/api-responses';

// Re-export form data types
export type {
  OrganizationFormData,
  PartnerFormData,
  OrganizationWithOwner
} from './domain/organizations';

export type {
  ServiceFormData,
  PostFormData,
  CaseStudyFormData,
  FAQFormData
} from './domain/content';

// Re-export Q&A types
export type {
  QAVisibility,
  QAEntryVisibility,
  QAEntryStatus,
  QALogAction,
  QACategory,
  QAEntry,
  QAContentLog,
  QAQuestionTemplate,
  QAEntryWithCategory,
  QACategoryFormData,
  QAEntryFormData,
  QAViewStat,
  QAStatsSummary,
  QADailyStats,
  QAStatsAction
} from './domain/qa-system';

// Re-export other domain types
export type {
  ReportStatus,
  ReportLevel,
  MonthlyReport,
  MonthlyReportMetrics,
  LegacyMonthlyReport
} from './domain/reports';

export {
  toPeriodStart,
  toPeriodEnd,
  fromPeriodStart
} from './domain/reports';

export type {
  QuestionStatus,
  Question,
  QuestionWithDetails,
  QuestionFormData,
  QuestionAnswerData
} from './domain/questions';

export type {
  SalesAction,
  SalesMaterial,
  SalesMaterialStat,
  SalesMaterialStatsSummary,
  SalesMaterialDailyStats
} from './domain/sales';

export type {
  Subscription,
  StripeCustomer
} from './domain/billing';