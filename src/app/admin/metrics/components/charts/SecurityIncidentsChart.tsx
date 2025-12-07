'use client';

import type { WeeklySecurityIncidents } from '@/types/admin-metrics';
import { formatWeekDate } from '@/lib/admin/metrics';

interface SecurityIncidentsChartProps {
  data: WeeklySecurityIncidents[];
}

const RISK_COLORS = {
  critical: 'bg-red-600',
  high: 'bg-red-400',
  medium: 'bg-yellow-400',
  low: 'bg-blue-400'
} as const;

const INCIDENT_ICONS = {
  unauthorized_access: '🚫',
  rls_bypass_attempt: '🛡️',
  rate_limit_exceeded: '⏰',
  data_breach: '💥',
  suspicious_activity: '👁️'
} as const;

export default function SecurityIncidentsChart({ data }: SecurityIncidentsChartProps) {
  // 週別にグループ化
  const weeklyData = data.reduce((acc, item) => {
    const week = item.week_start_utc;
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(item);
    return acc;
  }, {} as Record<string, WeeklySecurityIncidents[]>);

  const weeks = Object.keys(weeklyData).sort();
  const hasData = data.length > 0;

  // インシデントタイプ別集計
  const incidentSummary = data.reduce((acc, item) => {
    const key = item.incident_type;
    if (!acc[key]) {
      acc[key] = { total: 0, byRisk: {} as Record<string, number> };
    }
    acc[key].total += item.incident_count;
    acc[key].byRisk[item.risk || 'unknown'] = 
      (acc[key].byRisk[item.risk || 'unknown'] || 0) + item.incident_count;
    return acc;
  }, {} as Record<string, { total: number; byRisk: Record<string, number> }>);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg">🔒</p>
          <p className="text-sm mt-2">セキュリティインシデントはありません</p>
        </div>
      </div>
    );
  }

  const totalIncidents = data.reduce((sum, item) => sum + item.incident_count, 0);

  return (
    <div className="h-full w-full p-4">
      {/* 総数表示 */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-red-600">
          {totalIncidents}
        </div>
        <div className="text-sm text-gray-600">
          総インシデント数
        </div>
      </div>
      
      {/* インシデントタイプ別サマリー */}
      <div className="space-y-3 max-h-32 overflow-y-auto mb-4">
        {Object.entries(incidentSummary)
          .sort(([,a], [,b]) => b.total - a.total)
          .map(([type, summary]) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg mr-2">
                  {INCIDENT_ICONS[type as keyof typeof INCIDENT_ICONS] || '⚠️'}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {type.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-red-600">
                  {summary.total}
                </span>
                <div className="flex space-x-1">
                  {Object.entries(summary.byRisk).map(([risk, count]) => (
                    <div 
                      key={risk}
                      className={`w-3 h-3 rounded ${RISK_COLORS[risk as keyof typeof RISK_COLORS] || 'bg-gray-400'}`}
                      title={`${risk}: ${count}件`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
      </div>
      
      {/* 週別トレンド（積み上げ棒の簡易版） */}
      <div className="border-t pt-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">週別推移</h4>
        <div className="flex items-end justify-between h-20 space-x-1">
          {weeks.slice(-8).map((week, index) => {
            const weekIncidents = weeklyData[week];
            const totalForWeek = weekIncidents.reduce((sum, item) => sum + item.incident_count, 0);
            const maxWeekly = Math.max(...weeks.map(w => 
              weeklyData[w].reduce((sum, item) => sum + item.incident_count, 0)
            ));
            const height = maxWeekly > 0 ? (totalForWeek / maxWeekly) * 100 : 0;
            
            // リスク別の積み上げ
            const riskBreakdown = weekIncidents.reduce((acc, item) => {
              acc[item.risk || 'unknown'] = (acc[item.risk || 'unknown'] || 0) + item.incident_count;
              return acc;
            }, {} as Record<string, number>);
            
            return (
              <div key={week} className="flex flex-col items-center flex-1">
                <div className="w-full flex flex-col-reverse" style={{ height: `${height}%`, minHeight: totalForWeek > 0 ? '4px' : '0' }}>
                  {Object.entries(riskBreakdown).map(([risk, count]) => {
                    const segmentHeight = totalForWeek > 0 ? (count / totalForWeek) * height : 0;
                    return (
                      <div 
                        key={risk}
                        className={`w-full ${RISK_COLORS[risk as keyof typeof RISK_COLORS] || 'bg-gray-400'}`}
                        style={{ height: `${segmentHeight}%` }}
                        title={`${formatWeekDate(week)}: ${risk} ${count}件`}
                      />
                    );
                  })}
                </div>
                <div className="mt-1 text-xs text-gray-600 text-center">
                  {formatWeekDate(week)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* リスクレベル・レジェンド */}
      <div className="flex justify-center space-x-3 mt-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-600 rounded mr-1"></div>
          <span>Critical</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-400 rounded mr-1"></div>
          <span>High</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-400 rounded mr-1"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-400 rounded mr-1"></div>
          <span>Low</span>
        </div>
      </div>
      
      {/* 実装ノート */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-500">
        <p>📝 実装ノート: 積み上げ棒グラフ（週×incident_type、risk別色分け）</p>
      </div>
    </div>
  );
}