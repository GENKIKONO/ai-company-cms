'use client';

import type { WeeklyAiInterviewCompletion } from '@/types/admin-metrics';
import { formatWeekDate } from '@/lib/admin/metrics';

interface AiInterviewCompletionChartProps {
  data: WeeklyAiInterviewCompletion[];
  orgId?: string;
}

export default function AiInterviewCompletionChart({ data, orgId }: AiInterviewCompletionChartProps) {
  // 組織別またはグローバル平均でデータを処理
  const chartData = orgId 
    ? data.filter(item => item.org_id === orgId)
    : data.reduce((acc, item) => {
        const week = item.week_start_utc;
        const existing = acc.find(x => x.week_start_utc === week);
        
        if (existing) {
          // 平均を計算
          existing.completion_rate_pct = 
            (existing.completion_rate_pct + item.completion_rate_pct) / 2;
        } else {
          acc.push({ ...item, org_id: null });
        }
        return acc;
      }, [] as WeeklyAiInterviewCompletion[]);

  const hasData = chartData.length > 0;
  const avgCompletion = hasData 
    ? chartData.reduce((sum, item) => sum + item.completion_rate_pct, 0) / chartData.length
    : 0;

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg">🎤</p>
          <p className="text-sm mt-2">AIインタビューデータがありません</p>
          {orgId && <p className="text-xs mt-1">組織: {orgId}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4">
      {/* 平均完了率表示 */}
      <div className="mb-4 text-center">
        <div className="text-2xl font-bold text-gray-900">
          {avgCompletion.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600">
          平均完了率 ({orgId || 'すべての組織'})
        </div>
      </div>
      
      {/* 週別トレンド表示（簡易版） */}
      <div className="flex items-end justify-between h-32 border-b border-gray-200">
        {chartData.slice(-8).map((item, index) => {
          const height = item.completion_rate_pct;
          const isLow = item.completion_rate_pct < 60;
          const isGood = item.completion_rate_pct >= 80;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 mx-1">
              <div 
                className={`w-full transition-all duration-300 rounded-t ${
                  isLow ? 'bg-red-400' :
                  isGood ? 'bg-green-400' :
                  'bg-yellow-400'
                }`}
                style={{ height: `${height}%`, minHeight: '2px' }}
                title={`${formatWeekDate(item.week_start_utc)}: ${item.completion_rate_pct.toFixed(1)}%`}
              />
              <div className="mt-1 text-xs text-gray-600 text-center">
                {formatWeekDate(item.week_start_utc)}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* パフォーマンス指標 */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-green-600">
            {chartData.filter(d => d.completion_rate_pct >= 80).length}
          </div>
          <div className="text-xs text-gray-600">良好週</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-yellow-600">
            {chartData.filter(d => d.completion_rate_pct >= 60 && d.completion_rate_pct < 80).length}
          </div>
          <div className="text-xs text-gray-600">普通週</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-red-600">
            {chartData.filter(d => d.completion_rate_pct < 60).length}
          </div>
          <div className="text-xs text-gray-600">要改善週</div>
        </div>
      </div>
      
      {/* しきい値レジェンド */}
      <div className="flex justify-center space-x-4 mt-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-400 rounded mr-1"></div>
          <span>良好 (80%+)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-400 rounded mr-1"></div>
          <span>普通 (60-79%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-400 rounded mr-1"></div>
          <span>要改善 (&lt;60%)</span>
        </div>
      </div>
      
      {/* 実装ノート */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-500">
        <p>📝 実装ノート: 折れ線グラフ（組織別）で実装推奨</p>
        <p>対象: {orgId ? `組織${orgId}` : '全組織平均'}</p>
      </div>
    </div>
  );
}