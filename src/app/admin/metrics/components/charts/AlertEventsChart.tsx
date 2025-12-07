'use client';

import type { WeeklyAlertEvents } from '@/types/admin-metrics';

interface AlertEventsChartProps {
  data: WeeklyAlertEvents[];
}

// 標準event_type候補（Supabaseアシスタントからの指定）
const STANDARD_EVENT_TYPES = [
  'rate_limit_violation',
  'rls_denied_spike', 
  'job_fail_rate_spike',
  'edge_error_rate_spike',
  'security_incident_critical',
  'ai_completion_drop'
] as const;

const EVENT_COLORS = {
  rate_limit_violation: 'bg-yellow-500',
  rls_denied_spike: 'bg-red-500',
  job_fail_rate_spike: 'bg-orange-500',
  edge_error_rate_spike: 'bg-purple-500',
  security_incident_critical: 'bg-red-700',
  ai_completion_drop: 'bg-blue-500',
  others: 'bg-gray-400'
} as const;

const EVENT_ICONS = {
  rate_limit_violation: '⏰',
  rls_denied_spike: '🛡️',
  job_fail_rate_spike: '⚡',
  edge_error_rate_spike: '🔧',
  security_incident_critical: '🚨',
  ai_completion_drop: '🎤',
  others: '📊'
} as const;

export default function AlertEventsChart({ data }: AlertEventsChartProps) {
  // データを標準event_typeとothersに分類
  const processedData = data.reduce((acc, item) => {
    const isStandard = STANDARD_EVENT_TYPES.includes(item.event_type as any);
    const key = isStandard ? item.event_type : 'others';
    
    if (!acc[key]) {
      acc[key] = 0;
    }
    acc[key] += item.event_count;
    return acc;
  }, {} as Record<string, number>);

  const sortedData = Object.entries(processedData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10); // 上位10件表示

  const totalAlerts = Object.values(processedData).reduce((sum, count) => sum + count, 0);
  const maxCount = Math.max(...Object.values(processedData), 0);
  const hasData = sortedData.length > 0;

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg">📊</p>
          <p className="text-sm mt-2">アラートイベントはありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4">
      {/* 総アラート数 */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-gray-900">
          {totalAlerts}
        </div>
        <div className="text-sm text-gray-600">
          今週の総アラート数
        </div>
      </div>
      
      {/* イベントタイプ別表示 */}
      <div className="space-y-3">
        {sortedData.map(([eventType, count], index) => {
          const widthPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const percentage = totalAlerts > 0 ? (count / totalAlerts) * 100 : 0;
          
          return (
            <div key={eventType} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-lg mr-2">
                    {EVENT_ICONS[eventType as keyof typeof EVENT_ICONS] || '📊'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {index + 1}. {eventType === 'others' ? 'その他' : eventType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-gray-900">
                    {count}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full transition-all duration-300 ${
                      EVENT_COLORS[eventType as keyof typeof EVENT_COLORS] || 'bg-gray-400'
                    }`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 重要度別分析 */}
      <div className="mt-6 border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">重要度分析</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-red-600">
              {(processedData.security_incident_critical || 0) + (processedData.rls_denied_spike || 0)}
            </div>
            <div className="text-xs text-gray-600">高重要度</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-orange-600">
              {(processedData.job_fail_rate_spike || 0) + (processedData.edge_error_rate_spike || 0)}
            </div>
            <div className="text-xs text-gray-600">中重要度</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-yellow-600">
              {(processedData.rate_limit_violation || 0) + (processedData.ai_completion_drop || 0)}
            </div>
            <div className="text-xs text-gray-600">低重要度</div>
          </div>
        </div>
      </div>
      
      {/* 標準event_type凡例 */}
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <h5 className="text-xs font-medium text-gray-700 mb-2">標準イベントタイプ</h5>
        <div className="flex flex-wrap gap-2 text-xs">
          {STANDARD_EVENT_TYPES.map(eventType => (
            <span 
              key={eventType}
              className={`px-2 py-1 rounded text-white ${
                EVENT_COLORS[eventType] || 'bg-gray-400'
              }`}
            >
              {eventType.replace(/_/g, ' ')}
            </span>
          ))}
          <span className="px-2 py-1 rounded text-white bg-gray-400">
            その他
          </span>
        </div>
      </div>
      
      {/* 実装ノート */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-500">
        <p>📝 実装ノート: 横棒グラフ（event_type降順、標準候補+Others集約）</p>
        <p>DB distinctとの併記でUI凡例固定対応済み</p>
      </div>
    </div>
  );
}