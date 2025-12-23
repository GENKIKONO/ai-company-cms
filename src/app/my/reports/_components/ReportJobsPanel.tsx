'use client';

import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  QueueListIcon
} from '@heroicons/react/24/outline';
import { type JobViewModel, type JobStatus, getJobStatusLabel } from '../_types';

interface ReportJobsPanelProps {
  jobs: JobViewModel[];
  isConnected: boolean;
  loading?: boolean;
  onRefresh?: () => void;
}

function getStatusIcon(status: JobStatus) {
  switch (status) {
    case 'queued':
      return <QueueListIcon className="h-5 w-5 text-gray-500" />;
    case 'processing':
      return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
    case 'succeeded':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
  }
}

function getStatusColor(status: JobStatus) {
  switch (status) {
    case 'queued':
      return 'bg-gray-100 text-gray-700';
    case 'processing':
      return 'bg-blue-100 text-blue-700';
    case 'succeeded':
      return 'bg-green-100 text-green-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  return `${diffDays}日前`;
}

export function ReportJobsPanel({ jobs, isConnected, loading, onRefresh }: ReportJobsPanelProps) {
  const activeJobs = jobs.filter(j => j.status === 'queued' || j.status === 'processing');
  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">ジョブ状態</h3>
          {activeJobs.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
              {activeJobs.length}件処理中
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Realtime indicator */}
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
              isConnected ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full mr-1.5 ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            {isConnected ? 'Live' : 'Offline'}
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 rounded hover:bg-gray-100"
              title="更新"
            >
              <ArrowPathIcon className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {recentJobs.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            ジョブ履歴はありません
          </div>
        ) : (
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  job.status === 'processing' ? 'bg-blue-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(job.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                      {getJobStatusLabel(job.status)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(job.createdAt)}
                    </span>
                  </div>
                  {job.status === 'processing' && job.startedAt && (
                    <p className="text-xs text-blue-600 mt-1">
                      処理開始: {new Date(job.startedAt).toLocaleTimeString('ja-JP')}
                    </p>
                  )}
                  {job.status === 'succeeded' && job.finishedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      完了: {new Date(job.finishedAt).toLocaleTimeString('ja-JP')}
                    </p>
                  )}
                  {job.status === 'failed' && job.lastError && (
                    <p className="text-xs text-red-600 mt-1 truncate" title={job.lastError}>
                      エラー: {job.lastError}
                    </p>
                  )}
                  {job.attempts > 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      試行回数: {job.attempts}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
