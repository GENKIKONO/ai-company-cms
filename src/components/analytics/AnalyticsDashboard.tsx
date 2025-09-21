'use client';

import { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  CpuChipIcon, 
  LightBulbIcon,
  ExclamationTriangleIcon,
  TrendingUpIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { 
  advancedAnalyticsService, 
  AnalyticsMetrics, 
  MLInsights, 
  PredictiveModels 
} from '@/lib/advanced-analytics';

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'models'>('overview');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d');
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [insights, setInsights] = useState<MLInsights | null>(null);
  const [models, setModels] = useState<PredictiveModels | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  useEffect(() => {
    // Track analytics dashboard usage
  }, [activeTab, timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [metricsData, insightsData, modelsData] = await Promise.all([
        advancedAnalyticsService.getMetrics(timeRange),
        advancedAnalyticsService.getMLInsights(),
        advancedAnalyticsService.getPredictiveModels(),
      ]);

      setMetrics(metricsData);
      setInsights(insightsData);
      setModels(modelsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      console.error('Analytics dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercent = (num: number): string => {
    return (num * 100).toFixed(1) + '%';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactColor = (impact: 'high' | 'medium' | 'low'): string => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low'): string => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const tabs = [
    { id: 'overview', label: '概要', icon: ChartBarIcon },
    { id: 'insights', label: 'MLインサイト', icon: LightBulbIcon },
    { id: 'models', label: '予測モデル', icon: CpuChipIcon },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">高度分析ダッシュボード</h1>
            <p className="text-gray-600">機械学習による予測分析とインサイト</p>
          </div>
          <div className="flex space-x-2">
            {(['24h', '7d', '30d', '90d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeRange(period)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  timeRange === period
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && metrics && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ChartBarIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">総組織数</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalOrganizations)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUpIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">アクティブ組織</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.activeOrganizations)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <EyeIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">総検索数</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalSearches)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">平均応答時間</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.avgSearchTime}ms</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Industry and Region Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">業界別成長率</h3>
                <div className="space-y-4">
                  {metrics.topIndustries.slice(0, 8).map((industry) => (
                    <div key={industry.industry} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{industry.industry}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{industry.count}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          industry.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {industry.growth > 0 ? '+' : ''}{formatPercent(industry.growth)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">地域別成長率</h3>
                <div className="space-y-4">
                  {metrics.topRegions.slice(0, 8).map((region) => (
                    <div key={region.region} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{region.region}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{region.count}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          region.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {region.growth > 0 ? '+' : ''}{formatPercent(region.growth)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* User Engagement */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ユーザーエンゲージメント</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">{formatNumber(metrics.userEngagement.dailyActiveUsers)}</p>
                  <p className="text-sm text-gray-600">日次アクティブユーザー</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{metrics.userEngagement.averageSessionDuration.toFixed(1)}分</p>
                  <p className="text-sm text-gray-600">平均セッション時間</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">{formatPercent(metrics.userEngagement.bounceRate)}</p>
                  <p className="text-sm text-gray-600">バウンス率</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ML Insights Tab */}
        {activeTab === 'insights' && insights && (
          <div className="space-y-8">
            {/* Market Trends */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">市場トレンド</h3>
              <div className="space-y-4">
                {insights.marketTrends.map((trend, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{trend.trend}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(trend.impact)}`}>
                          {trend.impact === 'high' ? '高影響' : trend.impact === 'medium' ? '中影響' : '低影響'}
                        </span>
                        <span className={`text-sm font-medium ${getConfidenceColor(trend.confidence)}`}>
                          信頼度 {formatPercent(trend.confidence)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{trend.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Industry Predictions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">業界予測</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.industryPredictions.map((prediction, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{prediction.industry}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">予測成長率</span>
                        <span className="text-sm font-medium text-green-600">
                          +{formatPercent(prediction.predictedGrowth)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">期間</span>
                        <span className="text-sm">
                          {prediction.timeframe === '3months' ? '3ヶ月' : 
                           prediction.timeframe === '6months' ? '6ヶ月' : '1年'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">信頼度</span>
                        <span className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                          {formatPercent(prediction.confidence)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Search Patterns */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">検索パターン分析</h3>
              <div className="space-y-4">
                {insights.searchPatterns.map((pattern, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-gray-900">{pattern.pattern}</p>
                      <p className="text-sm text-gray-600">
                        {pattern.timeOfDay} | {pattern.userSegment}
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-indigo-600">{pattern.frequency}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Anomalies */}
            {insights.anomalies.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">異常検知</h3>
                <div className="space-y-4">
                  {insights.anomalies.map((anomaly, index) => (
                    <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(anomaly.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">
                            {anomaly.type === 'search_spike' ? '検索急増' :
                             anomaly.type === 'data_quality' ? 'データ品質' : 'ユーザー行動'}
                          </h4>
                          <p className="text-sm mt-1">{anomaly.description}</p>
                        </div>
                        <span className="text-xs">
                          {new Date(anomaly.detectedAt).toLocaleString('ja-JP')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Predictive Models Tab */}
        {activeTab === 'models' && models && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Organization Success Model */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">組織成功予測</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">モデル</span>
                    <span className="text-sm font-medium">{models.organizationSuccess.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">精度</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatPercent(models.organizationSuccess.accuracy)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">最終学習</span>
                    <span className="text-sm">
                      {new Date(models.organizationSuccess.lastTrained).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">主要特徴量:</p>
                    <div className="flex flex-wrap gap-1">
                      {models.organizationSuccess.features.slice(0, 4).map((feature) => (
                        <span key={feature} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Demand Model */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">検索需要予測</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">モデル</span>
                    <span className="text-sm font-medium">{models.searchDemand.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">精度</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatPercent(models.searchDemand.accuracy)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">季節性</span>
                    <span className="text-sm">
                      {models.searchDemand.seasonality === 'weekly' ? '週次' : '月次'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">最終学習</span>
                    <span className="text-sm">
                      {new Date(models.searchDemand.lastTrained).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Churn Model */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ユーザー離脱予測</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">モデル</span>
                    <span className="text-sm font-medium">{models.userChurn.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">精度</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatPercent(models.userChurn.precision)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">再現率</span>
                    <span className="text-sm font-medium text-blue-600">
                      {formatPercent(models.userChurn.recall)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">最終学習</span>
                    <span className="text-sm">
                      {new Date(models.userChurn.lastTrained).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">主要特徴量:</p>
                    <div className="flex flex-wrap gap-1">
                      {models.userChurn.features.slice(0, 4).map((feature) => (
                        <span key={feature} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Performance Chart Placeholder */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">モデル性能推移</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">チャートプレースホルダー - Chart.jsやD3.jsで実装</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}