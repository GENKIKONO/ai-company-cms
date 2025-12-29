/**
 * Core モジュールのエクスポート
 *
 * Shell / API / Server Action から再利用可能な横断的ロジック
 */

// 認証状態 (Server)
export {
  // Core Entry Points
  getUserServerOptional,
  requireUserServer,
  // Legacy (deprecated)
  getAuthUser,
  // Admin/Role checks
  isSiteAdmin,
  isSiteAdminWithClient,
  isOrgMember,
  getOrgRole,
  // Errors
  AuthRequiredError,
} from './auth-state'
export type { AuthUser } from './auth-state'

// エラー境界（クライアント側）
export { ErrorBoundary } from './error-boundary'

// ローディング状態（クライアント側）
export { useLoading, useMultipleLoading } from './loading-state'

// UI Provider（クライアント側）
export { UIProvider, useUI } from './ui-provider'

// 監査ログ
export { auditLogWrite, auditLogWriteRPC } from './audit-logger'

// DB依存RPC安全ラッパ（未確認RPC用）
export {
  getCurrentPlanSafe,
  auditLogWriteSafe,
  analyticsEventWriteSafe,
  getFeatureFlagsSafe,
  getFeatureOverridesSafe,
} from './db-safe-wrappers'
export type {
  CurrentPlanResult,
  AuditLogEntry,
  AnalyticsEvent,
  FeatureFlagResult,
} from './db-safe-wrappers'
