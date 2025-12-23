'use client';

import { useState } from 'react';
import {
  DocumentArrowDownIcon,
  ArrowPathIcon,
  PlusIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { MonthSelector } from './MonthSelector';
import { LevelSelector } from './LevelSelector';
import { type ReportLevel, type ReportViewModel } from '../_types';

interface ReportHeaderProps {
  // Period
  year: number;
  month: number;
  onPeriodChange: (year: number, month: number) => void;
  availableMonths?: Array<{ year: number; month: number; hasReport: boolean }>;

  // Report State
  selectedReport: ReportViewModel | null;
  hasActiveJob: boolean;

  // Realtime
  realtimeConnected: boolean;

  // Actions
  onGenerate: (level: ReportLevel) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  isRegenerating: boolean;

  // Optional
  onDownload?: () => void;
}

export function ReportHeader({
  year,
  month,
  onPeriodChange,
  availableMonths,
  selectedReport,
  hasActiveJob,
  realtimeConnected,
  onGenerate,
  onRegenerate,
  isGenerating,
  isRegenerating,
  onDownload
}: ReportHeaderProps) {
  const [selectedLevel, setSelectedLevel] = useState<ReportLevel>('basic');

  const hasReport = selectedReport !== null;
  const isCompleted = selectedReport?.status === 'completed';
  const isProcessing = hasActiveJob || isGenerating || isRegenerating;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Title & Period Selector */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">月次レポート</h1>
          <MonthSelector
            year={year}
            month={month}
            onSelect={onPeriodChange}
            availableMonths={availableMonths}
            disabled={isProcessing}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Realtime Indicator */}
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              realtimeConnected
                ? 'bg-green-50 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <SignalIcon className={`h-3.5 w-3.5 mr-1 ${realtimeConnected ? 'text-green-500' : 'text-gray-400'}`} />
            {realtimeConnected ? 'Live' : '...'}
          </span>

          {/* Level Selector (for new generation) */}
          {!hasReport && (
            <LevelSelector
              value={selectedLevel}
              onChange={setSelectedLevel}
              disabled={isProcessing}
            />
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!hasReport ? (
              // Generate Button
              <button
                onClick={() => onGenerate(selectedLevel)}
                disabled={isProcessing}
                className={`
                  inline-flex items-center px-4 py-2 rounded-lg font-medium text-white
                  transition-colors
                  ${isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                  }
                `}
              >
                {isGenerating ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    レポート生成
                  </>
                )}
              </button>
            ) : (
              <>
                {/* Regenerate Button */}
                <button
                  onClick={onRegenerate}
                  disabled={isProcessing}
                  className={`
                    inline-flex items-center px-4 py-2 rounded-lg font-medium
                    border transition-colors
                    ${isProcessing
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {isRegenerating ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                      再生成中...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2" />
                      再生成
                    </>
                  )}
                </button>

                {/* Download Button */}
                {isCompleted && onDownload && (
                  <button
                    onClick={onDownload}
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                    ダウンロード
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {hasActiveJob && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2 text-blue-700">
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
          <span className="text-sm">ジョブを処理中です。完了までお待ちください...</span>
        </div>
      )}

      {selectedReport?.status === 'failed' && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-700">
          <span className="text-sm">前回の生成に失敗しました。「再生成」で再試行できます。</span>
        </div>
      )}
    </div>
  );
}
