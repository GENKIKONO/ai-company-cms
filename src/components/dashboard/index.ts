/**
 * Dashboard Component Library
 *
 * 全Dashboardコンポーネントの一括エクスポート
 *
 * Usage:
 * import { DashboardPageShell, DashboardCard, DashboardButton } from '@/components/dashboard';
 */

// ============================================
// Page Shell (認証・権限・エラー境界)
// ============================================
export {
  DashboardPageShell,
  useDashboardPageContext,
  withDashboardPageShell,
  type DashboardPageShellProps,
  type DashboardPageContext,
  type OrganizationContext,
} from './DashboardPageShell';

// ============================================
// Error Boundary
// ============================================
export {
  DashboardErrorBoundary,
  withDashboardErrorBoundary,
} from './DashboardErrorBoundary';

// ============================================
// UI Components (re-export from ui/)
// ============================================
export * from './ui';

// ============================================
// Page Templates
// ============================================
export * from './templates';

// ============================================
// Feature Gate UI (プラン制限時の統一UI)
// ============================================
export { FeatureGateUI, type FeatureGateUIProps } from './FeatureGateUI';
export { UpgradeCTA, type UpgradeCTAProps } from './UpgradeCTA';
export { QuotaWarning, type QuotaWarningProps } from './QuotaWarning';
