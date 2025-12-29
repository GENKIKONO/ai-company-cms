'use client';

import { 
  FileText, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Brain,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';
import { useState } from 'react';

interface ReportSectionProps {
  title: string;
  data: any;
  level: string;
}

export function ReportSection({ title, data, level }: ReportSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getSectionIcon = (title: string) => {
    switch (title) {
      case 'top_contents':
        return <TrendingUp className="w-5 h-5 text-[var(--aio-primary)]" />;
      case 'weak_contents':
        return <FileText className="w-5 h-5 text-orange-600" />;
      case 'qna_insights':
        return <MessageSquare className="w-5 h-5 text-green-600" />;
      case 'trends':
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case 'ai_content_effect':
        return <Brain className="w-5 h-5 text-[var(--aio-info)]" />;
      case 'interview_insights':
        return <Users className="w-5 h-5 text-indigo-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSectionTitle = (title: string) => {
    switch (title) {
      case 'kpi_overview':
        return 'KPI概要';
      case 'top_contents':
        return '上位コンテンツ';
      case 'weak_contents':
        return '弱点コンテンツ';
      case 'qna_insights':
        return 'Q&A分析';
      case 'trends':
        return 'トレンド分析';
      case 'ai_content_effect':
        return 'AIコンテンツ効果';
      case 'interview_insights':
        return 'AI面談分析';
      default:
        return title.replace(/_/g, ' ');
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'service': return 'サービス';
      case 'faq': return 'FAQ';
      case 'case_study': return '導入事例';
      case 'post': return '投稿';
      case 'news': return 'ニュース';
      case 'product': return '製品';
      default: return type;
    }
  };

  const renderContent = () => {
    if (!data) return null;

    switch (title) {
      case 'top_contents':
        return (
          <div className="space-y-3">
            {data.items?.map((item: any, index: number) => (
              <div key={item.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 bg-[var(--aio-muted)] text-[var(--aio-primary)] text-xs rounded">
                      {getContentTypeLabel(item.type)}
                    </span>
                    <span className="text-sm font-medium text-neutral-900">{item.title}</span>
                  </div>
                  {item.url && (
                    <div className="text-xs text-gray-500">{item.url}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[var(--aio-primary)]">
                    {item.page_views?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-600">PV</div>
                </div>
              </div>
            ))}
            {(!data.items || data.items.length === 0) && (
              <p className="text-gray-500 text-center py-4">データがありません</p>
            )}
          </div>
        );

      case 'weak_contents':
        return (
          <div className="space-y-3">
            {data.items?.map((item: any, index: number) => (
              <div key={item.id || index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                      {getContentTypeLabel(item.type)}
                    </span>
                    <span className="text-sm font-medium text-neutral-900">{item.title}</span>
                  </div>
                  <div className="text-xs text-orange-700">{item.reason}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-orange-800">
                    {item.page_views?.toLocaleString() || 0} PV
                  </div>
                </div>
              </div>
            ))}
            {(!data.items || data.items.length === 0) && (
              <p className="text-gray-500 text-center py-4">データがありません</p>
            )}
          </div>
        );

      case 'qna_insights':
        return (
          <div className="space-y-4">
            {data.top_faqs && data.top_faqs.length > 0 && (
              <div>
                <h4 className="font-medium text-neutral-900 mb-3">よく見られたQ&A</h4>
                <div className="space-y-2">
                  {data.top_faqs.map((faq: any, index: number) => (
                    <div key={faq.id || index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-neutral-900">{faq.title}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">
                          {faq.page_views?.toLocaleString() || 0} PV
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {data.falling_faqs && data.falling_faqs.length > 0 && (
              <div>
                <h4 className="font-medium text-neutral-900 mb-3">閲覧数が減少したQ&A</h4>
                <div className="space-y-2">
                  {data.falling_faqs.map((faq: any, index: number) => (
                    <div key={faq.id || index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-neutral-900">{faq.title}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-yellow-800">
                          {faq.page_views?.toLocaleString() || 0} PV
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!data.top_faqs || data.top_faqs.length === 0) && 
             (!data.falling_faqs || data.falling_faqs.length === 0) && (
              <p className="text-gray-500 text-center py-4">Q&Aデータがありません</p>
            )}
          </div>
        );

      case 'trends':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-purple-800">{data.description || 'トレンドデータを分析中です'}</p>
            </div>
            
            {data.monthly_data && data.monthly_data.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-neutral-900">月次推移</h4>
                {data.monthly_data.map((monthData: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-neutral-700">{monthData.month}</span>
                    <span className="text-sm font-medium">{monthData.page_views?.toLocaleString()} PV</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'ai_content_effect':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--aio-muted)] rounded-lg">
                <div className="text-lg font-bold text-[var(--aio-primary)]">
                  {((data.ai_generated_ratio || 0) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-[var(--aio-primary)]">AI生成コンテンツ割合</div>
              </div>
              <div className="p-4 bg-[var(--aio-muted)] rounded-lg">
                <div className="text-lg font-bold text-[var(--aio-primary)]">
                  {((data.ai_generated_views_ratio || 0) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-[var(--aio-primary)]">AI生成コンテンツPV割合</div>
              </div>
            </div>
            <div className="p-4 bg-[var(--aio-muted)] rounded-lg">
              <p className="text-[var(--aio-primary)]">{data.description || 'AI生成コンテンツの効果を分析中です'}</p>
            </div>
          </div>
        );

      case 'interview_insights':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="text-lg font-bold text-indigo-600">
                  {data.sessions_count || 0}
                </div>
                <div className="text-sm text-indigo-800">AI面談実施回数</div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="text-lg font-bold text-indigo-600">
                  {data.generated_contents || 0}
                </div>
                <div className="text-sm text-indigo-800">生成コンテンツ数</div>
              </div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-indigo-800">{data.description || 'AI面談の実施状況を分析中です'}</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <pre className="text-sm text-gray-600 whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  // kpi_overviewは別途表示されるためスキップ
  if (title === 'kpi_overview') {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {getSectionIcon(title)}
          <h2 className="text-xl font-semibold text-neutral-900">
            {getSectionTitle(title)}
          </h2>
        </div>
        
        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-6">
          {renderContent()}
        </div>
      )}
    </div>
  );
}