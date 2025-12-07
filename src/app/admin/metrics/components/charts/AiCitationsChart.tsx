'use client';

import type { WeeklyAiCitations } from '@/types/admin-metrics';
import { formatWeekDate } from '@/lib/admin/metrics';

interface AiCitationsChartProps {
  data: WeeklyAiCitations[];
  orgId?: string;
}

export default function AiCitationsChart({ data, orgId }: AiCitationsChartProps) {
  // 組織別またはグローバル合計でデータを処理
  const chartData = orgId 
    ? data.filter(item => item.org_id === orgId)
    : data.reduce((acc, item) => {
        const week = item.week_start_utc;
        const existing = acc.find(x => x.week_start_utc === week);
        
        if (existing) {
          existing.avg_items_per_response = 
            (existing.avg_items_per_response + item.avg_items_per_response) / 2;
          existing.tokens_sum += item.tokens_sum;
        } else {
          acc.push({ ...item, org_id: null });
        }
        return acc;
      }, [] as WeeklyAiCitations[]);

  const hasData = chartData.length > 0;
  const totalTokens = hasData 
    ? chartData.reduce((sum, item) => sum + item.tokens_sum, 0)
    : 0;
  const avgItemsPerResponse = hasData
    ? chartData.reduce((sum, item) => sum + item.avg_items_per_response, 0) / chartData.length
    : 0;

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg">📚</p>
          <p className="text-sm mt-2">AI引用データがありません</p>
          {orgId && <p className="text-xs mt-1">組織: {orgId}</p>}
        </div>
      </div>
    );
  }

  const maxItems = Math.max(...chartData.map(d => d.avg_items_per_response), 0);
  const maxTokens = Math.max(...chartData.map(d => d.tokens_sum), 0);

  return (
    <div className="h-full w-full p-4">
      {/* 主要指標表示 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">
            {avgItemsPerResponse.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600">
            平均引用数/回答
          </div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">
            {(totalTokens / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-gray-600">
            合計トークン数
          </div>
        </div>
      </div>
      
      {/* 複合チャート（簡易版） */}
      <div className="h-32 border-b border-gray-200">
        <div className="flex justify-between items-end h-full">
          {chartData.slice(-8).map((item, index) => {
            const itemsHeight = maxItems > 0 ? (item.avg_items_per_response / maxItems) * 80 : 0;
            const tokensHeight = maxTokens > 0 ? (item.tokens_sum / maxTokens) * 80 : 0;
            
            return (
              <div key={index} className="flex flex-col items-center flex-1 mx-1">
                <div className="relative w-full h-20 flex items-end justify-center space-x-1">
                  {/* 引用数（棒） */}
                  <div 
                    className="w-4 bg-blue-400 rounded-t"
                    style={{ height: `${itemsHeight}%`, minHeight: '2px' }}
                    title={`引用数: ${item.avg_items_per_response.toFixed(1)}`}
                  />
                  {/* トークン数（線の代わりに細い棒） */}
                  <div 
                    className="w-1 bg-green-500 rounded"
                    style={{ height: `${tokensHeight}%`, minHeight: '1px' }}
                    title={`トークン: ${item.tokens_sum.toLocaleString()}`}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-600 text-center">
                  {formatWeekDate(item.week_start_utc)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 詳細データ表示 */}
      <div className="mt-4 space-y-2 max-h-24 overflow-y-auto">
        {chartData.slice(-4).map((item, index) => (
          <div key={index} className="flex justify-between items-center text-xs border-b border-gray-100 pb-1">
            <span className="text-gray-600">
              {formatWeekDate(item.week_start_utc)}
            </span>
            <span className="text-blue-600">
              {item.avg_items_per_response.toFixed(1)} 引用
            </span>
            <span className="text-green-600">
              {(item.tokens_sum / 1000).toFixed(1)}K トークン
            </span>
          </div>
        ))}
      </div>
      
      {/* レジェンド */}
      <div className="flex justify-center space-x-4 mt-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-400 rounded mr-1"></div>
          <span>引用数/回答</span>
        </div>
        <div className="flex items-center">
          <div className="w-1 h-3 bg-green-500 rounded mr-1"></div>
          <span>トークン数</span>
        </div>
      </div>
      
      {/* 実装ノート */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-500">
        <p>📝 実装ノート: 複合チャート（棒＋折れ線）で実装推奨</p>
        <p>左軸: 引用数, 右軸: トークン数</p>
      </div>
    </div>
  );
}