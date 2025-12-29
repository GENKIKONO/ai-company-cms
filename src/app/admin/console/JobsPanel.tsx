/**
 * AIOHub P3-1: Super Admin Console - Jobs Panel (VIEW準拠版)
 * 
 * VIEW: admin_jobs_recent_v1 対応：
 * - started_at, completed_at, error_message は VIEW で投影済み
 * - status は 'success'|'error' 準拠
 * - job_name フィールド名に対応
 */

'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { 
  AdminJobRun,
  AdminJobFilters
} from '@/types/admin-console';
import { 
  getStatusLabel,
  calculateDuration,
  formatDuration
} from '@/types/admin-console';

interface JobsPanelProps {
  jobs: AdminJobRun[];
  stats: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<'success' | 'error', number>;
    recent24h: number;
    failureRate: number;
  };
  isPreview?: boolean;
}

export default function JobsPanel({ jobs, stats, isPreview = false }: JobsPanelProps) {
  const [filters, setFilters] = useState<AdminJobFilters>({});
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // VIEW フィールド名に対応したフィルタリング
  const filteredJobs = jobs.filter(job => {
    if (filters.jobName && job.job_name !== filters.jobName) return false;
    if (filters.status && job.status !== filters.status) return false;
    if (filters.dateFrom && job.created_at < filters.dateFrom) return false;
    if (filters.dateTo && job.created_at > filters.dateTo) return false;
    return true;
  });

  // Status バッジの設定（VIEW値対応）
  const getStatusBadge = (status: string) => {
    const label = getStatusLabel(status);
    const configs = {
      Success: { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
      Failure: { bg: 'bg-red-100', text: 'text-red-800', icon: '✗' }
    };
    
    const config = configs[label as keyof typeof configs] || configs.Failure;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className="mr-1">{config.icon}</span>
        {label}
      </span>
    );
  };

  // フィルタ用の一意値を取得（VIEW フィールド名準拠）
  const availableJobNames = Array.from(new Set(jobs.map(job => job.job_name)));
  const availableStatuses: ('success' | 'error')[] = ['success', 'error'];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isPreview ? 'Recent Job Runs' : 'Job Runs'}
            </h3>
            <p className="text-sm text-gray-500">
              {stats.total} total, {stats.recent24h} in last 24h
            </p>
          </div>
          {!isPreview && (
            <button className="px-4 py-2 text-sm font-medium text-white bg-[var(--aio-primary)] rounded hover:bg-[var(--aio-primary-hover)]">
              View All Jobs
            </button>
          )}
        </div>

        {/* 統計サマリー */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.byStatus.success}</div>
            <div className="text-xs text-gray-500">Success</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.byStatus.error}</div>
            <div className="text-xs text-gray-500">Failure</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--aio-info)]">
              {Math.round(stats.failureRate * 100)}%
            </div>
            <div className="text-xs text-gray-500">Failure Rate</div>
          </div>
        </div>
      </div>

      {!isPreview && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-4">
            {/* Job Name フィルタ（VIEW フィールド名準拠） */}
            <select 
              value={filters.jobName || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, jobName: e.target.value || undefined }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--aio-info)]"
            >
              <option value="">All Job Names</option>
              {availableJobNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            {/* Status フィルタ（DB値準拠） */}
            <select 
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as 'success' | 'error' || undefined }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--aio-info)]"
            >
              <option value="">All Status</option>
              {availableStatuses.map(status => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>

            {/* 日付フィルタ */}
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--aio-info)]"
              placeholder="From"
            />
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value || undefined }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--aio-info)]"
              placeholder="To"
            />

            {/* フィルタリセット */}
            <button
              onClick={() => setFilters({})}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {filteredJobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
            </svg>
            <p>No job runs found</p>
          </div>
        ) : (
          filteredJobs.slice(0, isPreview ? 5 : undefined).map((job) => {
            const duration = calculateDuration(job.started_at, job.completed_at);
            
            return (
              <div key={job.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(job.status)}
                      <span className="text-sm font-medium text-gray-900">{job.job_name}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(job.created_at), 'MMM d, HH:mm', { locale: ja })}
                      </span>
                    </div>
                    
                    {/* VIEW からの投影済み実行時間・詳細表示 */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {duration && (
                        <span>Duration: {formatDuration(duration)}</span>
                      )}
                      {job.started_at && (
                        <span>Started: {format(new Date(job.started_at), 'HH:mm:ss')}</span>
                      )}
                      {job.completed_at && (
                        <span>Completed: {format(new Date(job.completed_at), 'HH:mm:ss')}</span>
                      )}
                    </div>

                    {/* エラーメッセージ表示（VIEW から投影済み） */}
                    {job.error_message && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                        <span className="font-medium">Error:</span> {job.error_message}
                      </div>
                    )}

                    {showDetails === job.id && (
                      <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                        <div className="mb-2">
                          <span className="font-medium">Job ID:</span> {job.id}
                        </div>
                        <div className="mb-2">
                          <span className="font-medium">Created:</span> {format(new Date(job.created_at), 'yyyy-MM-dd HH:mm:ss')}
                        </div>
                        {job.started_at && (
                          <div className="mb-2">
                            <span className="font-medium">Started At:</span> {format(new Date(job.started_at), 'yyyy-MM-dd HH:mm:ss')}
                          </div>
                        )}
                        {job.completed_at && (
                          <div className="mb-2">
                            <span className="font-medium">Completed At:</span> {format(new Date(job.completed_at), 'yyyy-MM-dd HH:mm:ss')}
                          </div>
                        )}
                        {job.details && Object.keys(job.details).length > 0 && (
                          <div>
                            <span className="font-medium">Details:</span>
                            <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                              {JSON.stringify(job.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center ml-4">
                    <button
                      onClick={() => setShowDetails(showDetails === job.id ? null : job.id)}
                      className="text-xs text-[var(--aio-primary)] hover:text-[var(--aio-primary)] font-medium"
                    >
                      {showDetails === job.id ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isPreview && filteredJobs.length > 5 && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button className="text-sm font-medium text-[var(--aio-primary)] hover:text-[var(--aio-primary)]">
            View All {filteredJobs.length} Jobs
          </button>
        </div>
      )}
    </div>
  );
}