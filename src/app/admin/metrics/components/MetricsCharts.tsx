/* eslint-disable no-console */
import { fetchMetricsData } from '@/lib/admin/metrics';
import RlsDeniedWeeklyChart from './charts/RlsDeniedWeeklyChart';
import JobFailRateWeeklyChart from './charts/JobFailRateWeeklyChart';
import EdgeErrorRateChart from './charts/EdgeErrorRateChart';
import AiInterviewCompletionChart from './charts/AiInterviewCompletionChart';
import AiCitationsChart from './charts/AiCitationsChart';
import SecurityIncidentsChart from './charts/SecurityIncidentsChart';
import AlertEventsChart from './charts/AlertEventsChart';

interface MetricsChartsProps {
  range: '1w' | '4w' | '12w';
  orgId?: string;
}

export default async function MetricsCharts({ range, orgId }: MetricsChartsProps) {
  try {
    const metricsData = await fetchMetricsData(range, orgId);
    const { charts } = metricsData;

    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">KPI チャート</h2>
        
        <div className="space-y-8">
          {/* 第1行: RLS拒否 & ジョブ失敗率 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="週別 RLS拒否数"
              description="RLSによるアクセス拒否イベントの推移"
            >
              <RlsDeniedWeeklyChart data={charts.rls_denied_weekly} />
            </ChartContainer>
            
            <ChartContainer
              title="ジョブ失敗率推移"
              description="ジョブ種別ごとの週次失敗率"
            >
              <JobFailRateWeeklyChart data={charts.job_fail_rate_weekly_by_job} />
            </ChartContainer>
          </div>

          {/* 第2行: Edgeエラー率 & AIインタビュー完了率 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="Edge Functions エラー率"
              description="最新週の関数別エラー率"
            >
              <EdgeErrorRateChart data={charts.edge_error_rate_latest_week} />
            </ChartContainer>
            
            <ChartContainer
              title="AIインタビュー完了率"
              description="組織別の週次完了率推移"
              note={orgId ? `組織: ${orgId}` : '全組織平均'}
            >
              <AiInterviewCompletionChart 
                data={charts.ai_interview_completion_rate_weekly_by_org} 
                orgId={orgId}
              />
            </ChartContainer>
          </div>

          {/* 第3行: AI引用 & セキュリティインシデント */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="AI引用メトリクス"
              description="回答あたり引用数とトークン使用量"
              note={orgId ? `組織: ${orgId}` : '全組織合計'}
            >
              <AiCitationsChart 
                data={charts.ai_citations_weekly_by_org} 
                orgId={orgId}
              />
            </ChartContainer>
            
            <ChartContainer
              title="セキュリティインシデント"
              description="種別・リスクレベル別の週次インシデント数"
            >
              <SecurityIncidentsChart data={charts.security_incidents_weekly_by_type_and_risk} />
            </ChartContainer>
          </div>

          {/* 第4行: アラートイベント（フル幅） */}
          <div>
            <ChartContainer
              title="アラートイベント (今週)"
              description="イベント種別ごとのアラート発生数"
            >
              <AlertEventsChart data={charts.alert_events_current_week} />
            </ChartContainer>
          </div>
        </div>

        {/* チャート説明 */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">チャートについて</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <p className="font-medium mb-1">データ更新:</p>
              <p>週次でバッチ更新（UTC月曜日基準）</p>
            </div>
            <div>
              <p className="font-medium mb-1">期間設定:</p>
              <p>{range === '1w' ? '今週' : range === '4w' ? '過去4週' : '過去12週'}</p>
            </div>
            <div>
              <p className="font-medium mb-1">組織フィルタ:</p>
              <p>{orgId || 'すべての組織'}</p>
            </div>
            <div>
              <p className="font-medium mb-1">しきい値:</p>
              <p>RLS拒否: 10件/週で注意、ジョブ失敗率: 5%で注意</p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching charts data:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-medium">チャートデータ取得エラー</h3>
        <p className="text-red-600 text-sm mt-1">
          チャートデータを取得できませんでした。しばらくしてから再試行してください。
        </p>
      </div>
    );
  }
}

interface ChartContainerProps {
  title: string;
  description: string;
  note?: string;
  children: React.ReactNode;
}

function ChartContainer({ title, description, note, children }: ChartContainerProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        {note && (
          <p className="text-xs text-blue-600 mt-1">{note}</p>
        )}
      </div>
      <div className="h-80">
        {children}
      </div>
    </div>
  );
}