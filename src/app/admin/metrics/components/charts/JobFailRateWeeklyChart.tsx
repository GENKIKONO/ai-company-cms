'use client';

import type { WeeklyJobFailRate } from '@/types/admin-metrics';
import { formatWeekDate } from '@/lib/admin/metrics';

interface JobFailRateWeeklyChartProps {
  data: WeeklyJobFailRate[];
}

export default function JobFailRateWeeklyChart({ data }: JobFailRateWeeklyChartProps) {
  // データをジョブ別にグループ化
  const jobGroups = data.reduce((acc, item) => {
    if (!acc[item.job_name]) {
      acc[item.job_name] = [];
    }
    acc[item.job_name].push(item);
    return acc;
  }, {} as Record<string, WeeklyJobFailRate[]>);

  const jobNames = Object.keys(jobGroups);
  const hasData = data.length > 0;

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg">⚡</p>
          <p className="text-sm mt-2">ジョブ実行データがありません</p>
        </div>
      </div>
    );
  }

  // 週ごとの最大失敗率を計算
  const maxFailRate = Math.max(...data.map(d => d.fail_rate_pct), 0);

  return (
    <div className="h-full w-full">
      {/* ジョブ別失敗率の簡易表示 */}
      <div className="space-y-4 p-4">
        {jobNames.slice(0, 5).map((jobName) => {
          const jobData = jobGroups[jobName];
          const avgFailRate = jobData.reduce((sum, item) => sum + item.fail_rate_pct, 0) / jobData.length;
          const latest = jobData[jobData.length - 1];
          
          const isHighAlert = avgFailRate >= 15;
          const isWarning = avgFailRate >= 5;
          
          return (
            <div key={jobName} className="border rounded p-3">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {jobName}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    最新: {latest?.fail_rate_pct.toFixed(1)}% | 平均: {avgFailRate.toFixed(1)}%
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  isHighAlert ? 'bg-red-100 text-red-800' :
                  isWarning ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {isHighAlert ? '要改善' : isWarning ? '注意' : '正常'}
                </div>
              </div>
              
              {/* 簡易トレンド表示 */}
              <div className="flex items-end space-x-1 mt-2 h-8">
                {jobData.slice(-8).map((item, index) => {
                  const height = maxFailRate > 0 ? (item.fail_rate_pct / maxFailRate) * 100 : 0;
                  return (
                    <div 
                      key={index}
                      className={`flex-1 rounded-t transition-all ${
                        item.fail_rate_pct >= 15 ? 'bg-red-400' :
                        item.fail_rate_pct >= 5 ? 'bg-yellow-400' :
                        'bg-green-400'
                      }`}
                      style={{ height: `${height}%`, minHeight: item.fail_rate_pct > 0 ? '2px' : '0' }}
                      title={`${formatWeekDate(item.week_start_utc)}: ${item.fail_rate_pct.toFixed(1)}%`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* しきい値レジェンド */}
      <div className="flex justify-center space-x-4 mt-4 text-xs border-t pt-3">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-400 rounded mr-1"></div>
          <span>正常 (&lt;5%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-400 rounded mr-1"></div>
          <span>注意 (5-14%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-400 rounded mr-1"></div>
          <span>要改善 (15%+)</span>
        </div>
      </div>
      
      {/* 実装ノート */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-500">
        <p>📝 実装ノート: 積み上げ棒グラフまたは複数線チャートで実装推奨</p>
        <p>現在表示: {jobNames.length}個のジョブ（最新8週のトレンド）</p>
      </div>
    </div>
  );
}