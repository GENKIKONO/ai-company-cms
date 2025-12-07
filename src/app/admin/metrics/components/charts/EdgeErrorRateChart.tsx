'use client';

import type { EdgeErrorRate } from '@/types/admin-metrics';

interface EdgeErrorRateChartProps {
  data: EdgeErrorRate[];
}

export default function EdgeErrorRateChart({ data }: EdgeErrorRateChartProps) {
  const sortedData = [...data]
    .sort((a, b) => b.error_rate_pct - a.error_rate_pct)
    .slice(0, 10); // 上位10件表示

  const maxErrorRate = Math.max(...sortedData.map(d => d.error_rate_pct), 0);
  const hasData = sortedData.length > 0;

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg">🔧</p>
          <p className="text-sm mt-2">Edge Functions実行データがありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4">
      <div className="space-y-3">
        {sortedData.map((item, index) => {
          const widthPercent = maxErrorRate > 0 ? (item.error_rate_pct / maxErrorRate) * 100 : 0;
          const isHighAlert = item.error_rate_pct >= 10;
          const isWarning = item.error_rate_pct >= 2;
          
          return (
            <div key={item.function_name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 truncate flex-1">
                  {index + 1}. {item.function_name}
                </span>
                <span className={`text-sm font-bold ml-2 ${
                  isHighAlert ? 'text-red-600' :
                  isWarning ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {item.error_rate_pct.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      isHighAlert ? 'bg-red-500' :
                      isWarning ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-16 text-right">
                  {item.failed_count}/{item.total_runs}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* しきい値レジェンド */}
      <div className="flex justify-center space-x-4 mt-6 text-xs border-t pt-3">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
          <span>正常 (&lt;2%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
          <span>注意 (2-9%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
          <span>要改善 (10%+)</span>
        </div>
      </div>
      
      {/* 実装ノート */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-500">
        <p>📝 実装ノート: 水平棒グラフで実装推奨（エラー率降順）</p>
        <p>現在表示: 最新週のエラー率上位{sortedData.length}関数</p>
      </div>
    </div>
  );
}