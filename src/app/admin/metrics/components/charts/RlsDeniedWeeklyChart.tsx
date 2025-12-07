'use client';

import { useMemo } from 'react';
import type { WeeklyRlsDenied } from '@/types/admin-metrics';
import { formatWeekDate, fillMissingWeeks, rangeToWeeksCount } from '@/lib/admin/metrics';

interface RlsDeniedWeeklyChartProps {
  data: WeeklyRlsDenied[];
}

export default function RlsDeniedWeeklyChart({ data }: RlsDeniedWeeklyChartProps) {
  // 欠損週を0で補完
  const chartData = useMemo(() => {
    // データの期間を推定（12週分想定）
    const weeksCount = Math.max(12, data.length);
    const filledData = fillMissingWeeks(data, weeksCount);
    
    return filledData.map(item => ({
      week: formatWeekDate(item.week_start_utc),
      count: item.rls_denied_count,
      date: item.week_start_utc
    }));
  }, [data]);

  const maxValue = Math.max(...chartData.map(d => d.count), 0);
  const hasData = chartData.some(d => d.count > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg">📊</p>
          <p className="text-sm mt-2">RLS拒否イベントはありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {/* TODO: Replace with actual chart library (e.g., Recharts) */}
      {/* For now, showing a simple bar representation */}
      <div className="h-full flex items-end justify-between space-x-1 p-4">
        {chartData.map((item, index) => {
          const height = maxValue > 0 ? (item.count / maxValue) * 100 : 0;
          const isHighAlert = item.count >= 50;
          const isWarning = item.count >= 10;
          
          return (
            <div key={index} className="flex flex-col items-center">
              <div 
                className={`w-8 transition-all duration-300 rounded-t ${
                  isHighAlert ? 'bg-red-500' :
                  isWarning ? 'bg-yellow-500' : 
                  'bg-blue-500'
                }`}
                style={{ height: `${height}%`, minHeight: item.count > 0 ? '4px' : '0' }}
                title={`${item.week}: ${item.count}件のRLS拒否`}
              />
              <div className="mt-2 text-xs text-gray-600 transform rotate-45 origin-bottom-left">
                {item.week}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 簡易レジェンド */}
      <div className="flex justify-center space-x-4 mt-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
          <span>正常 (&lt;10)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
          <span>注意 (10-49)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
          <span>警告 (50+)</span>
        </div>
      </div>
      
      {/* 簡易統計 */}
      <div className="mt-4 text-xs text-gray-600 text-center">
        <p>合計: {chartData.reduce((sum, item) => sum + item.count, 0)}件</p>
        <p>最大: {maxValue}件/週</p>
      </div>
      
      {/* 実装ノート */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-500">
        <p>📝 実装ノート: チャートライブラリ（Recharts等）の導入が必要です</p>
      </div>
    </div>
  );
}