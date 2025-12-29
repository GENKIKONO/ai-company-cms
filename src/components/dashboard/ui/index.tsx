/**
 * Dashboard UI Component Library
 * ダッシュボード専用のUIコンポーネント群
 *
 * iCloud風のビジュアル + Stripe風の操作性を実現
 *
 * Usage:
 * import { DashboardCard, DashboardButton, DashboardInput } from '@/components/dashboard/ui';
 */

// ============================================
// Layout Components
// ============================================
export {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardContent,
  DashboardCardFooter,
} from './DashboardCard';

export { DashboardSection } from './DashboardSection';

export { DashboardPageHeader } from './DashboardPageHeader';

// ============================================
// Data Display
// ============================================
export { DashboardMetricCard } from './DashboardMetricCard';

export {
  DashboardTable,
  DashboardTableHead,
  DashboardTableBody,
  DashboardTableRow,
  DashboardTableHeaderCell,
  DashboardTableCell,
  DashboardTableEmpty,
} from './DashboardTable';

export {
  DashboardBadge,
  StatusBadge,
  CountBadge,
} from './DashboardBadge';

// ============================================
// Form Components
// ============================================
export {
  DashboardInput,
  DashboardTextarea,
  DashboardSelect,
  DashboardCheckbox,
  DashboardFormGroup,
} from './DashboardInput';

// ============================================
// Buttons
// ============================================
export {
  DashboardButton,
  DashboardButtonGroup,
  DashboardIconButton,
} from './DashboardButton';

// ============================================
// Navigation
// ============================================
export {
  DashboardTabs,
  DashboardTabList,
  DashboardTabTrigger,
  DashboardTabContent,
  DashboardTabNav,
} from './DashboardTabs';

// ============================================
// Feedback
// ============================================
export { DashboardAlert } from './DashboardAlert';

export { DashboardEmptyState } from './DashboardEmptyState';

export {
  DashboardLoadingState,
  DashboardLoadingCard,
} from './DashboardLoadingState';
