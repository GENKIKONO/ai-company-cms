/**
 * Dashboard Hooks
 *
 * Dashboard専用フックの一括エクスポート
 *
 * Usage:
 * import { useDashboardData, useDashboardMutation, useDashboardResource } from '@/hooks/dashboard';
 */

// Data fetching
export {
  useDashboardData,
  useDashboardSingleRecord,
  useDashboardCount,
  type UseDashboardDataOptions,
  type UseDashboardDataResult,
} from './useDashboardData';

// Data mutation
export {
  useDashboardMutation,
  type UseDashboardMutationOptions,
  type UseDashboardMutationResult,
  type MutationState,
  type MutationActions,
} from './useDashboardMutation';

// Combined resource hook
export {
  useDashboardResource,
  type UseDashboardResourceOptions,
  type UseDashboardResourceResult,
} from './useDashboardResource';
