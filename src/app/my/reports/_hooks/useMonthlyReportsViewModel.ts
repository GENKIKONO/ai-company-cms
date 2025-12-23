'use client';

/**
 * Monthly Reports ViewModel
 * 一覧/選択/Realtime統合を担い、副作用と購読を一元管理
 *
 * 変更点（リファクタリング）:
 * - _lib/api.ts（fetch経由）→ @/lib/reports（RPC直接）に移行
 * - Realtime フックを最適化版に差し替え
 * - 1ページ1インスタンス原則を徹底
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useOrganization } from '@/lib/hooks/useOrganization';

// Service Layer (RPC direct)
import {
  getReportsList,
  getLatestReport,
  getJobsList,
  checkActiveJob,
  enqueueReport,
  requestRegenerate,
  useCombinedRealtime,
  createPeriodSelection,
  getPreviousPeriod,
  type MonthlyReportRow,
  type MonthlyReportJobRow,
  type ReportLevel,
  type PeriodSelection
} from '@/lib/reports';

// Local Types
import {
  type ReportViewModel,
  type JobViewModel,
  type ViewState,
  type MonthComparison,
  toReportViewModel,
  toJobViewModel,
  calculateComparison
} from '../_types';

// =====================================================
// Options & State Types
// =====================================================

interface UseMonthlyReportsViewModelOptions {
  initialYear?: number;
  initialMonth?: number;
  autoFetch?: boolean;
}

interface MonthlyReportsViewModelState {
  // View State
  viewState: ViewState;
  error: string | null;

  // Period Selection
  selectedPeriod: PeriodSelection;

  // Reports
  reports: ReportViewModel[];
  selectedReport: ReportViewModel | null;
  latestReport: ReportViewModel | null;

  // Comparison
  comparison: MonthComparison | null;

  // Jobs
  jobs: JobViewModel[];
  hasActiveJob: boolean;

  // Realtime Status
  realtimeConnected: boolean;

  // Actions Loading State
  isGenerating: boolean;
  isRegenerating: boolean;
}

// =====================================================
// ViewModel Hook
// =====================================================

export function useMonthlyReportsViewModel(options: UseMonthlyReportsViewModelOptions = {}) {
  const now = new Date();
  const defaultYear = options.initialYear ?? now.getFullYear();
  const defaultMonth = options.initialMonth ?? now.getMonth() + 1;

  const { organization } = useOrganization();
  const organizationId = organization?.id ?? null;

  // State
  const [state, setState] = useState<MonthlyReportsViewModelState>({
    viewState: 'loading',
    error: null,
    selectedPeriod: createPeriodSelection(defaultYear, defaultMonth),
    reports: [],
    selectedReport: null,
    latestReport: null,
    comparison: null,
    jobs: [],
    hasActiveJob: false,
    realtimeConnected: false,
    isGenerating: false,
    isRegenerating: false
  });

  // Refs
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  // =====================================================
  // Realtime Subscription (Combined)
  // =====================================================

  const handleReportChange = useCallback((report: MonthlyReportRow, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => {
    if (!mountedRef.current) return;

    const viewModel = toReportViewModel(report);

    setState(prev => {
      // Handle DELETE
      if (eventType === 'DELETE') {
        const filtered = prev.reports.filter(r => r.id !== viewModel.id);
        return {
          ...prev,
          reports: filtered,
          selectedReport: prev.selectedReport?.id === viewModel.id ? null : prev.selectedReport
        };
      }

      // Handle INSERT/UPDATE
      const reportIndex = prev.reports.findIndex(r => r.id === viewModel.id);
      let newReports = [...prev.reports];

      if (reportIndex >= 0) {
        newReports[reportIndex] = viewModel;
      } else {
        // New report, add to beginning
        newReports = [viewModel, ...newReports];
      }

      // Update selected if matches
      const newSelected = prev.selectedReport?.id === viewModel.id
        ? viewModel
        : prev.selectedReport;

      return {
        ...prev,
        reports: newReports,
        selectedReport: newSelected
      };
    });

    // Show toast for status changes
    if (eventType === 'UPDATE' && report.status === 'completed') {
      toast.success('レポートが生成されました');
    } else if (eventType === 'UPDATE' && report.status === 'failed') {
      toast.error('レポート生成に失敗しました');
    }
  }, []);

  const handleJobChange = useCallback((job: MonthlyReportJobRow, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => {
    if (!mountedRef.current) return;

    const viewModel = toJobViewModel(job);

    setState(prev => {
      // Handle DELETE
      if (eventType === 'DELETE') {
        const filtered = prev.jobs.filter(j => j.id !== viewModel.id);
        const stillHasActive = filtered.some(j =>
          j.status === 'queued' || j.status === 'processing'
        );
        return { ...prev, jobs: filtered, hasActiveJob: stillHasActive };
      }

      // Handle INSERT/UPDATE
      const jobIndex = prev.jobs.findIndex(j => j.id === viewModel.id);
      let newJobs = [...prev.jobs];

      if (jobIndex >= 0) {
        newJobs[jobIndex] = viewModel;
      } else {
        newJobs = [viewModel, ...newJobs];
      }

      const stillHasActive = newJobs.some(j =>
        j.status === 'queued' || j.status === 'processing'
      );

      return {
        ...prev,
        jobs: newJobs,
        hasActiveJob: stillHasActive
      };
    });

    // Show toast for job status changes
    if (eventType === 'UPDATE') {
      if (job.status === 'succeeded') {
        toast.success('ジョブが完了しました');
      } else if (job.status === 'failed') {
        toast.error(`ジョブが失敗しました: ${job.last_error || '不明なエラー'}`);
      }
    }
  }, []);

  const { isConnected } = useCombinedRealtime({
    organizationId,
    enabled: !!organizationId,
    onReportChange: handleReportChange,
    onJobChange: handleJobChange,
    onError: (error) => {
      console.error('Realtime error:', error);
    }
  });

  // Sync realtime connection status
  useEffect(() => {
    setState(prev => ({ ...prev, realtimeConnected: isConnected }));
  }, [isConnected]);

  // =====================================================
  // Data Fetching
  // =====================================================

  const fetchReports = useCallback(async () => {
    if (!organizationId || fetchingRef.current) return;

    fetchingRef.current = true;
    setState(prev => ({ ...prev, viewState: 'loading', error: null }));

    try {
      const { reports, error } = await getReportsList({
        organizationId,
        year: state.selectedPeriod.year,
        limit: 12
      });

      if (error) throw new Error(error);
      if (!mountedRef.current) return;

      const viewModels = reports.map(toReportViewModel);

      // Find selected period report
      const selected = viewModels.find(
        r => r.year === state.selectedPeriod.year && r.month === state.selectedPeriod.month
      ) ?? null;

      // Calculate comparison if selected exists
      let comparison: MonthComparison | null = null;
      if (selected) {
        const prevPeriod = getPreviousPeriod(selected.year, selected.month);
        const prevReport = viewModels.find(
          r => r.year === prevPeriod.year && r.month === prevPeriod.month
        );
        comparison = calculateComparison(selected.metrics, prevReport?.metrics ?? null);
      }

      setState(prev => ({
        ...prev,
        viewState: viewModels.length > 0 || selected ? 'ready' : 'empty',
        reports: viewModels,
        selectedReport: selected,
        comparison
      }));

    } catch (err) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : 'レポートの取得に失敗しました';
      setState(prev => ({ ...prev, viewState: 'error', error: message }));
    } finally {
      fetchingRef.current = false;
    }
  }, [organizationId, state.selectedPeriod.year, state.selectedPeriod.month]);

  const fetchLatestReport = useCallback(async () => {
    if (!organizationId) return;

    try {
      const { report } = await getLatestReport(organizationId);
      if (report && mountedRef.current) {
        setState(prev => ({ ...prev, latestReport: toReportViewModel(report) }));
      }
    } catch {
      // Silent fail for latest report
    }
  }, [organizationId]);

  const fetchJobs = useCallback(async () => {
    if (!organizationId) return;

    try {
      const { jobs, error } = await getJobsList({
        organizationId,
        limit: 20
      });

      if (error || !mountedRef.current) return;

      const viewModels = jobs.map(toJobViewModel);
      const hasActive = viewModels.some(j =>
        j.status === 'queued' || j.status === 'processing'
      );

      setState(prev => ({
        ...prev,
        jobs: viewModels,
        hasActiveJob: hasActive
      }));

    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  }, [organizationId]);

  // =====================================================
  // Actions
  // =====================================================

  const selectPeriod = useCallback((year: number, month: number) => {
    const newPeriod = createPeriodSelection(year, month);
    setState(prev => ({
      ...prev,
      selectedPeriod: newPeriod,
      selectedReport: prev.reports.find(r => r.year === year && r.month === month) ?? null
    }));
  }, []);

  const generateReport = useCallback(async (level: ReportLevel = 'basic') => {
    if (!organizationId) {
      toast.error('組織が見つかりません');
      return false;
    }

    // Check for active job
    const { hasActive } = await checkActiveJob(organizationId);
    if (hasActive) {
      toast.warning('現在処理中のジョブがあります。完了までお待ちください。');
      return false;
    }

    setState(prev => ({ ...prev, isGenerating: true }));

    try {
      const { jobId, error } = await enqueueReport({
        organizationId,
        year: state.selectedPeriod.year,
        month: state.selectedPeriod.month,
        level
      });

      if (error) throw new Error(error);

      toast.success('レポート生成をキューに追加しました');
      await fetchJobs();

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'レポート生成に失敗しました';
      toast.error(message);
      return false;
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  }, [organizationId, state.selectedPeriod, fetchJobs]);

  const regenerateReport = useCallback(async () => {
    if (!organizationId) {
      toast.error('組織が見つかりません');
      return false;
    }

    // Check for active job
    const { hasActive } = await checkActiveJob(organizationId);
    if (hasActive) {
      toast.warning('現在処理中のジョブがあります。完了までお待ちください。');
      return false;
    }

    setState(prev => ({ ...prev, isRegenerating: true }));

    try {
      const { error } = await requestRegenerate({
        organizationId,
        year: state.selectedPeriod.year,
        month: state.selectedPeriod.month
      });

      if (error) throw new Error(error);

      toast.success('レポート再生成をリクエストしました');
      await fetchJobs();

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'レポート再生成に失敗しました';
      toast.error(message);
      return false;
    } finally {
      setState(prev => ({ ...prev, isRegenerating: false }));
    }
  }, [organizationId, state.selectedPeriod, fetchJobs]);

  // =====================================================
  // Effects
  // =====================================================

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;

    if (organizationId && options.autoFetch !== false) {
      fetchReports();
      fetchLatestReport();
      fetchJobs();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [organizationId, fetchReports, fetchLatestReport, fetchJobs, options.autoFetch]);

  // Refetch when period changes (but only update selection from existing data)
  useEffect(() => {
    if (!organizationId || state.viewState === 'loading') return;

    const existing = state.reports.find(
      r => r.year === state.selectedPeriod.year && r.month === state.selectedPeriod.month
    );

    if (existing) {
      const prevPeriod = getPreviousPeriod(existing.year, existing.month);
      const prevReport = state.reports.find(
        r => r.year === prevPeriod.year && r.month === prevPeriod.month
      );
      const comparison = calculateComparison(existing.metrics, prevReport?.metrics ?? null);

      setState(prev => ({
        ...prev,
        selectedReport: existing,
        comparison
      }));
    } else {
      setState(prev => ({ ...prev, selectedReport: null, comparison: null }));
    }
  }, [state.selectedPeriod, state.reports, organizationId, state.viewState]);

  // =====================================================
  // Computed Values
  // =====================================================

  const availableMonths = useMemo(() => {
    const months: Array<{ year: number; month: number; hasReport: boolean }> = [];
    const currentYear = state.selectedPeriod.year;

    for (let m = 1; m <= 12; m++) {
      const hasReport = state.reports.some(r => r.year === currentYear && r.month === m);
      months.push({ year: currentYear, month: m, hasReport });
    }

    return months;
  }, [state.reports, state.selectedPeriod.year]);

  // =====================================================
  // Return
  // =====================================================

  return {
    // State
    ...state,

    // Computed
    availableMonths,

    // Actions
    selectPeriod,
    generateReport,
    regenerateReport,
    refresh: fetchReports,
    refreshJobs: fetchJobs
  };
}
